/**
 * Hostinger SMTP Diagnostic and Test Script
 * 
 * Usage:
 *   node scripts/test-email.mjs                         # Verifies SMTP connection & config
 *   node scripts/test-email.mjs --send=you@example.com  # Sends an actual test email
 */

import "dotenv/config";
import net from "net";
import nodemailer from "nodemailer";

function maskSecret(str) {
  if (!str) return "[NOT SET]";
  if (str.length <= 4) return "****";
  return str.slice(0, 2) + "****" + str.slice(-2);
}

function getSmtpConfig() {
  const host =
    process.env.SMTP_HOST ||
    process.env.EMAIL_HOST ||
    "smtp.hostinger.com";

  const portStr =
    process.env.SMTP_PORT ||
    process.env.EMAIL_PORT ||
    "465";

  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    "info@kollimalaiarasan.com";

  const pass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    "";

  const rawFrom =
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    `"Kollimalai Arasan" <info@kollimalaiarasan.com>`;

  const port = Number(portStr) || 465;
  const secure = port === 465;
  const requireTLS = port === 587;

  const from = rawFrom.includes("<")
    ? rawFrom
    : `"Kollimalai Arasan" <${rawFrom}>`;

  return { host, port, secure, requireTLS, user, pass, from };
}

function testSocketPort(host, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(5000);
    s.on("connect", () => {
      s.destroy();
      resolve({ success: true });
    });
    s.on("timeout", () => {
      s.destroy();
      resolve({ success: false, error: "Connection timed out (5s)" });
    });
    s.on("error", (err) => {
      s.destroy();
      resolve({ success: false, error: err.message });
    });
    s.connect(port, host);
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("📧 Hostinger Email Integration Diagnostics");
  console.log("=======================================================\n");

  const config = getSmtpConfig();

  console.log("1. Environment Configuration:");
  console.log(`   • SMTP Host   : ${config.host}`);
  console.log(`   • SMTP Port   : ${config.port} (${config.secure ? "Implicit SSL/TLS" : "STARTTLS"})`);
  console.log(`   • SMTP User   : ${config.user}`);
  console.log(`   • SMTP Pass   : ${maskSecret(config.pass)}`);
  console.log(`   • Sender From : ${config.from}`);

  console.log("\n2. Outbound Network Connectivity Check:");
  const socketResult = await testSocketPort(config.host, config.port);
  if (socketResult.success) {
    console.log(`   ✓ Successfully opened socket to ${config.host}:${config.port}`);
  } else {
    console.error(`   ✗ Outbound port connection failed to ${config.host}:${config.port}: ${socketResult.error}`);
  }

  console.log("\n3. SMTP Handshake & Authentication Check:");
  if (!config.pass) {
    console.log("   ⚠️  SMTP_PASS / EMAIL_PASS is empty.");
    console.log("      Please set the mailbox password in .env (or environment variables) to authenticate.");
  } else {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    try {
      await transporter.verify();
      console.log(`   ✓ SMTP connection and authentication verified successfully with ${config.host}:${config.port} as ${config.user}`);
    } catch (err) {
      console.error(`   ✗ SMTP verification failed: ${err.message}`);
    }
  }

  // Check if a test recipient was passed via --send=email@example.com
  const sendArg = process.argv.find((a) => a.startsWith("--send="));
  if (sendArg) {
    const testRecipient = sendArg.split("=")[1]?.trim();
    if (testRecipient) {
      if (!config.pass) {
        console.error("\n   ✗ Cannot send test email because SMTP_PASS is empty.");
      } else {
        console.log(`\n4. Sending Test Email to: ${testRecipient}...`);
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          requireTLS: config.requireTLS,
          auth: {
            user: config.user,
            pass: config.pass,
          },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        });

        try {
          const info = await transporter.sendMail({
            from: config.from,
            to: testRecipient,
            subject: "Test Email - Kollimalai Arasan Hostinger Integration",
            html: `
              <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #15803d; margin-top: 0;">🌿 Kollimalai Arasan</h2>
                <p>This is a verification email from <strong>Hostinger Business Email</strong>.</p>
                <p>If you are receiving this message, your SMTP configuration is active and working properly.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                <p style="font-size: 12px; color: #6b7280;">Sent via ${config.user} (${new Date().toISOString()})</p>
              </div>
            `,
            text: `Kollimalai Arasan - Hostinger Business Email Verification.\nSent via ${config.user} at ${new Date().toISOString()}`,
          });

          console.log(`   ✓ Test email sent successfully! MessageId: ${info.messageId}`);
        } catch (sendErr) {
          console.error(`   ✗ Failed to send test email: ${sendErr.message}`);
        }
      }
    }
  } else {
    console.log("\n(Tip: Run with `node scripts/test-email.mjs --send=your-email@example.com` to send a live test message)");
  }

  console.log("\n=======================================================\n");
}

main().catch(console.error);
