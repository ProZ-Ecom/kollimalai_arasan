import path from "node:path";
import fs from "node:fs";
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { formatToWhatsAppJid, cleanPhoneDisplay } from "@/lib/whatsapp/whatsapp-utils";

export type WhatsAppStatus = "DISCONNECTED" | "PAIRING" | "CONNECTED";

export interface WhatsAppUserInfo {
  id: string;
  name?: string;
  phone: string;
}

interface WhatsAppManagerInstance {
  sock: WASocket | null;
  status: WhatsAppStatus;
  qr: string | null;
  user: WhatsAppUserInfo | null;
  errorMessage: string | null;
  isInitializing: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __whatsapp_manager__: WhatsAppManagerInstance | undefined;
}

const AUTH_DIR = path.join(process.cwd(), "auth_baileys");

function getManager(): WhatsAppManagerInstance {
  if (!globalThis.__whatsapp_manager__) {
    globalThis.__whatsapp_manager__ = {
      sock: null,
      status: "DISCONNECTED",
      qr: null,
      user: null,
      errorMessage: null,
      isInitializing: false,
    };
  }
  return globalThis.__whatsapp_manager__;
}

const createSocket =
  typeof (makeWASocket as any)?.default === "function"
    ? (makeWASocket as any).default
    : typeof makeWASocket === "function"
      ? makeWASocket
      : (makeWASocket as any)?.makeWASocket;

function hasSavedCredentials(): boolean {
  return fs.existsSync(path.join(AUTH_DIR, "creds.json"));
}

function getSavedUserFromCreds(): WhatsAppUserInfo | null {
  try {
    const credsPath = path.join(AUTH_DIR, "creds.json");
    if (fs.existsSync(credsPath)) {
      const content = JSON.parse(fs.readFileSync(credsPath, "utf8"));
      if (content?.me?.id) {
        return {
          id: content.me.id,
          name: content.me.name || "Kollimalai Admin",
          phone: cleanPhoneDisplay(content.me.id),
        };
      }
    }
  } catch {
    // Ignore read error
  }
  return null;
}

/**
 * Initialize Baileys WhatsApp client singleton
 */
export async function initWhatsAppClient(force = false): Promise<WhatsAppManagerInstance> {
  const manager = getManager();

  if (manager.isInitializing && !force) {
    return manager;
  }

  if (!force && manager.status === "CONNECTED" && manager.sock) {
    return manager;
  }

  const hasCreds = hasSavedCredentials();

  manager.isInitializing = true;
  manager.status = hasCreds ? "CONNECTED" : "PAIRING";
  if (hasCreds && !manager.user) {
    manager.user = getSavedUserFromCreds();
  }
  manager.errorMessage = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = createSocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ["Kollimalai Admin", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
    });

    manager.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      // Only show QR if credentials do not exist on disk
      if (qr && !hasSavedCredentials()) {
        try {
          manager.qr = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: {
              dark: "#1e1e1e",
              light: "#ffffff",
            },
          });
          manager.status = "PAIRING";
        } catch (qrErr) {
          console.error("[WhatsApp] Failed to generate QR code data URL:", qrErr);
        }
      }

      if (connection === "open") {
        manager.status = "CONNECTED";
        manager.qr = null;
        manager.errorMessage = null;

        const rawId = sock.user?.id || "";
        const phone = cleanPhoneDisplay(rawId);
        manager.user = {
          id: rawId,
          name: sock.user?.name || "Kollimalai Admin",
          phone,
        };
        console.log(`[WhatsApp] Connected successfully as ${phone}`);
      } else if (connection === "close") {
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output
          ?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `[WhatsApp] Connection closed. StatusCode: ${statusCode}, shouldReconnect: ${shouldReconnect}`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          manager.status = "DISCONNECTED";
          manager.user = null;
          manager.qr = null;
          manager.sock = null;
          // Clear auth credentials directory
          if (fs.existsSync(AUTH_DIR)) {
            try {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            } catch (rmErr) {
              console.error("[WhatsApp] Failed to remove auth folder:", rmErr);
            }
          }
        } else if (shouldReconnect) {
          // Keep user profile if credentials are saved
          if (hasSavedCredentials()) {
            manager.status = "CONNECTED";
            if (!manager.user) manager.user = getSavedUserFromCreds();
          } else {
            manager.status = "DISCONNECTED";
          }
          // Immediate quiet reconnect
          setTimeout(() => {
            initWhatsAppClient(true).catch((err) => {
              console.error("[WhatsApp] Auto-reconnect failed:", err);
            });
          }, 1500);
        } else {
          manager.status = "DISCONNECTED";
          manager.sock = null;
        }
      }
    });

    manager.isInitializing = false;
    return manager;
  } catch (err: any) {
    manager.isInitializing = false;
    if (hasSavedCredentials()) {
      manager.status = "CONNECTED";
      if (!manager.user) manager.user = getSavedUserFromCreds();
    } else {
      manager.status = "DISCONNECTED";
    }
    manager.errorMessage = err?.message || "Failed to initialize WhatsApp client";
    console.error("[WhatsApp] Initialization error:", err);
    return manager;
  }
}

/**
 * Get current session state
 */
export function getWhatsAppStatus() {
  const manager = getManager();

  if (hasSavedCredentials()) {
    if (!manager.user) {
      manager.user = getSavedUserFromCreds();
    } else if (manager.user.id) {
      manager.user.phone = cleanPhoneDisplay(manager.user.id);
    }
    // If not connected or initializing, initiate connection quietly
    if (!manager.sock && !manager.isInitializing) {
      initWhatsAppClient(false).catch((err) => console.error("[WhatsApp] Silent start failed:", err));
    }
    return {
      status: "CONNECTED" as WhatsAppStatus,
      qr: null,
      user: manager.user,
      errorMessage: manager.errorMessage,
    };
  }

  return {
    status: manager.status,
    qr: manager.qr,
    user: manager.user,
    errorMessage: manager.errorMessage,
  };
}

/**
 * Wait for QR code generation or connection (up to timeoutMs)
 */
export async function waitForQrCode(timeoutMs = 5000): Promise<{
  status: WhatsAppStatus;
  qr: string | null;
  user: WhatsAppUserInfo | null;
  errorMessage: string | null;
}> {
  const start = Date.now();
  const manager = getManager();

  while (Date.now() - start < timeoutMs) {
    if (manager.qr || manager.status === "CONNECTED" || manager.errorMessage) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return getWhatsAppStatus();
}

/**
 * Wait for active socket connection
 */
export async function waitForConnection(timeoutMs = 5000): Promise<boolean> {
  const start = Date.now();
  const manager = getManager();

  while (Date.now() - start < timeoutMs) {
    if (manager.sock && manager.status === "CONNECTED") {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return !!manager.sock && manager.status === "CONNECTED";
}

/**
 * Send a WhatsApp text message with simulated typing and rate-limiting delay
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const manager = getManager();

  // If not currently connected, attempt automatic wake-up using saved credentials
  if (manager.status !== "CONNECTED" || !manager.sock) {
    if (hasSavedCredentials()) {
      console.log("[WhatsApp] Waking up connection from saved credentials before sending...");
      await initWhatsAppClient(false);
      await waitForConnection(5000);
    }
  }

  if (!manager.sock) {
    return {
      success: false,
      error: "WhatsApp is reconnecting. Please wait 2-3 seconds and try again.",
    };
  }

  const jid = formatToWhatsAppJid(phone);

  try {
    // 1. Simulate human presence (typing)
    try {
      await manager.sock.sendPresenceUpdate("composing", jid);
    } catch {
      // Ignore presence failures
    }

    // 2. Natural jitter delay (1.5s - 2.5s)
    const delay = Math.floor(Math.random() * 1000) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 3. Send text message
    const result = await manager.sock.sendMessage(jid, { text: message });

    // 4. Reset presence
    try {
      await manager.sock.sendPresenceUpdate("paused", jid);
    } catch {
      // Ignore presence failures
    }

    return {
      success: true,
      messageId: result?.key?.id || undefined,
    };
  } catch (err: any) {
    console.error(`[WhatsApp] Failed to send message to ${jid}:`, err);

    // If connection was closed or dropped, auto-reconnect and retry once
    const errMsg = err?.message || err?.output?.payload?.message || "";
    if (
      errMsg.includes("Closed") ||
      errMsg.includes("conflict") ||
      err?.output?.statusCode === 428 ||
      err?.output?.statusCode === 440
    ) {
      console.log("[WhatsApp] Socket closed/errored. Reconnecting and retrying send...");
      await initWhatsAppClient(true);
      const isReconnected = await waitForConnection(6000);
      if (isReconnected && manager.sock) {
        try {
          const retryResult = await manager.sock.sendMessage(jid, { text: message });
          return {
            success: true,
            messageId: retryResult?.key?.id || undefined,
          };
        } catch (retryErr: any) {
          return {
            success: false,
            error: retryErr?.message || "Failed to deliver message after reconnecting",
          };
        }
      }
    }

    return {
      success: false,
      error: errMsg || "Failed to deliver WhatsApp message",
    };
  }
}

/**
 * Disconnect current WhatsApp session and clear saved auth keys
 */
export async function disconnectWhatsAppSession(): Promise<{ success: boolean }> {
  const manager = getManager();

  try {
    if (manager.sock) {
      try {
        await manager.sock.logout();
      } catch {
        manager.sock.end(undefined);
      }
    }
  } catch (err) {
    console.error("[WhatsApp] Error during logout:", err);
  } finally {
    manager.sock = null;
    manager.status = "DISCONNECTED";
    manager.qr = null;
    manager.user = null;
    manager.errorMessage = null;

    if (fs.existsSync(AUTH_DIR)) {
      try {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      } catch (rmErr) {
        console.error("[WhatsApp] Failed to remove auth folder:", rmErr);
      }
    }
  }

  return { success: true };
}
