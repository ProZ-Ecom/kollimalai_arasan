# Rithu Snacks — WhatsApp Integration & Campaign System
## Complete Technical Architecture & Team Guide

---

### Executive Summary
We have engineered a **100% Free WhatsApp Communication & Campaign System** for Rithu Snacks. Instead of paying recurring monthly subscriptions to third-party service providers (like Twilio, Gallabox, or Wati) or paying per-conversation fees to the Meta Cloud API, our platform connects directly to WhatsApp Web through the admin's existing business phone number via QR code authentication ("Linked Devices").

---

## 1. Key Highlights & Business Value

| Feature | Third-Party APIs (Twilio / Wati / Meta) | Our Custom Solution |
| :--- | :--- | :--- |
| **Cost** | ₹1.00 – ₹2.50 per conversation + monthly SaaS fee | **₹0 (100% Free Forever)** |
| **Sender Identity** | Generic bot number or verified business template lock | **Admin's authentic phone number** |
| **Template Approval** | 24–48 hours wait time with strict Meta scrutiny | **Instant customization & launch** |
| **Bulk Campaigns** | Expensive, requires Meta Business verification | **Built-in 200–500 safe batch campaigns** |
| **Transactional Alerts** | High monthly minimums | **Automatic order status notifications** |

---

## 2. NPM Packages Used & Why

### 1. `@whiskeysockets/baileys` (`^6.7.24`)
* **What it does:** An open-source, TypeScript-native reimplementation of the WhatsApp Web binary WebSocket protocol.
* **Why this specific package & version:**
  * It connects directly to WhatsApp servers via WebSocket using end-to-end encryption (`Noise` protocol).
  * **Version pinned to `6.7.24`**: We strictly avoided Baileys v7 (`@whiskeysockets/baileys@7.0.0-rc.*`) because v7 includes a native Rust bridge (`whatsapp-rust-bridge`) that causes binary compilation errors and packaging breakage on Node.js and Windows servers. Version 6.7.24 is battle-tested, pure TypeScript/JavaScript, and rock-solid.

### 2. `qrcode` (`^1.5.4`) & `@types/qrcode`
* **What it does:** Converts the raw alphanumeric pairing string emitted by WhatsApp (`2@xyz...`) into a high-contrast base64 Data URL (`data:image/png;base64,...`).
* **Why it's used:** Allows the admin to simply point their camera from WhatsApp > Linked Devices and scan directly off the admin dashboard screen.

### 3. `pino` (`^10.3.1`)
* **What it does:** Fast, low-overhead JSON logger required by Baileys.
* **Why it's used:** We set `logger: pino({ level: "silent" })` to suppress verbose binary packet logs that would otherwise flood terminal stdout and consume memory.

### 4. `crypto` & `bcryptjs`
* Standard Node.js cryptography for generating secure UUIDs for campaigns/recipients and hashing passwords for customer accounts.

---

## 3. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             ADMIN DASHBOARD                              │
│  - Device Connection & QR Scan: /admin/dashboard/whatsapp                │
│  - Campaign Management:         /admin/dashboard/whatsapp/campaigns      │
│  - 4-Step Campaign Creator:     /admin/dashboard/whatsapp/campaigns/create│
│  - Template Library:            /admin/dashboard/whatsapp/templates      │
│  - Delivery Analytics:          /admin/dashboard/whatsapp/reports        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP REST API (Next.js App Router)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            API ROUTES LAYER                              │
│  /api/admin/whatsapp/status     -> Check connection status & battery/phone│
│  /api/admin/whatsapp/connect    -> Request socket pairing & QR data URL  │
│  /api/admin/whatsapp/disconnect -> Logout & clear credentials            │
│  /api/admin/whatsapp/send       -> Immediate single-message dispatch     │
│  /api/admin/whatsapp/customers  -> Filter database contacts for campaigns│
│  /api/admin/whatsapp/campaigns  -> Create & list bulk campaigns          │
│  /api/admin/whatsapp/campaigns/[id]/action -> Pause/Resume/Cancel/Retry  │
└──────────────────┬───────────────────────────────────┬───────────────────┘
                   │ Mutex Singleton                   │ Database Transactions
                   ▼                                   ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────┐
│            BAILEYS ENGINE            │  │          DATABASE              │
│       (Global Node Singleton)        │  │       (MariaDB / MySQL)        │
│  - Auth: auth_baileys/creds.json     │  │  - User & customer_profiles    │
│  - Socket: makeWASocket              │  │  - whatsAppCampaign            │
│  - Human presence simulation         │  │  - whatsAppCampaignRecipient   │
│  - Jitter queue (1.5s - 4.5s delays) │  │  - whatsAppTemplate            │
└──────────────────┬───────────────────┘  └────────────────────────────────┘
                   │ Encrypted WebSocket
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      WHATSAPP SERVERS & CUSTOMERS                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. End-to-End User & Operational Flows

### Flow A: Device Pairing & Authentication
1. **Admin Navigates** to `/admin/dashboard/whatsapp`.
2. **Initiate Pairing:** If disconnected, the admin clicks **"Start Connection"**.
3. **Socket Handshake:** The server invokes `initWhatsAppClient()`. Baileys initializes the multi-file authentication directory (`./auth_baileys/`).
4. **QR Code Generation:** The server catches `connection.update` containing the QR string, converts it via `QRCode.toDataURL()`, and renders it on the screen.
5. **Scan & Link:** The admin opens WhatsApp on their mobile device $\rightarrow$ **Settings** $\rightarrow$ **Linked Devices** $\rightarrow$ **Link a Device**, and scans the screen.
6. **Persistent State:** Baileys saves encrypted keys to `auth_baileys/creds.json`. The UI automatically switches to **"🟢 Connected"** and displays the admin's phone number and avatar.
7. **Hot-Reload Resilience:** Even if Next.js recompiles code or the dev server restarts, the credentials on disk persist. The client automatically restores the session quietly without re-scanning.

---

### Flow B: Sending Immediate / Transactional Messages
1. Single messages (Order confirmation, invoice, out for delivery) are sent via `sendWhatsAppMessage(phone, message)`.
2. **Phone Number Sanitization (`formatToWhatsAppJid`):**
   - Strips non-digits (`+`, `-`, spaces).
   - If 10 digits (e.g. `7305996058`), prepends country code `91`.
   - Appends WhatsApp domain: `917305996058@s.whatsapp.net`.
3. **Human Simulation:** Sends `"composing"` presence indicator to the recipient.
4. **Jitter Delay:** Pauses 1.5s – 2.5s before dispatching.
5. **Delivery:** Dispatches message, resets presence to `"paused"`, and returns the message ID.

---

### Flow C: Creating & Launching a Bulk Campaign
The Campaign Creator (`/admin/dashboard/whatsapp/campaigns/create`) is structured into a guided 4-step wizard:

1. **Step 1: Campaign Details**
   - Title (e.g., *"Diwali Sweets Special Flash Sale"*).
   - Category (`FESTIVAL`, `OFFER`, `PROMOTION`, `CUSTOM`).
2. **Step 2: Audience Selection**
   - Real-time customer selector querying active database records.
   - Filter pills:
     - **WhatsApp Ready Only:** Customers with `is_whatsapp = true` and valid 10-digit mobile numbers.
     - **Recent Buyers:** Customers who placed orders in the last 30 days.
     - **Customers with Orders:** Customers who have at least 1 historical order.
     - **All Database Customers:** Complete list.
   - Safety warning banner automatically triggered if audience $> 500$.
3. **Step 3: Message & Banner Composer**
   - Message textarea with variable substitution support:
     - `{{customer_name}}` $\rightarrow$ Dynamically replaced per recipient with their actual name.
     - `{{store_name}}` $\rightarrow$ Replaced with "Rithu Snacks".
   - Optional promotional banner image upload.
   - **Live Interactive Phone Mockup:** Real-time preview rendering an accurate WhatsApp chat bubble with timestamps and double-check marks.
4. **Step 4: Scheduling & Launch**
   - Option A: **"Send Now"** $\rightarrow$ Kicks off immediate sequential worker.
   - Option B: **"Schedule for Later"** $\rightarrow$ Saves campaign as `SCHEDULED` for future execution.
   - Clear summary of recipient count, estimated run time (~3.5s per recipient), and anti-ban safeguards.

---

### Flow D: The Background Campaign Worker Engine
Located at: `src/lib/whatsapp/whatsapp-campaign-worker.ts`

To guarantee 100% safety and zero spam flagging:
1. **Never blast simultaneously:** Messages are processed sequentially **one-by-one**.
2. **Anti-Ban Jitter:** A randomized delay of **2,500ms to 4,500ms** is inserted between each contact, along with real WhatsApp typing indicators.
3. **Circuit Breaker:** If the admin phone loses internet or battery, the worker detects the socket drop and automatically switches campaign status to `PAUSED` instead of failing recipients. Once the phone reconnects, 1-click **"Resume"** picks up exactly where it left off.
4. **Per-Recipient Tracking:**
   - Database marks recipient: `QUEUED` $\rightarrow$ `SENDING` $\rightarrow$ `SENT` or `FAILED`.
   - Exact error messages are logged if a number has no WhatsApp account.

---

## 5. Critical Anti-Ban Safeguards Implemented

1. **`syncFullHistory: false`**
   - By default, Baileys attempts to download personal chat backups. We disabled this completely. Prevents memory spikes and server disk overflow.
2. **Next.js Hot-Reload Singleton (`globalThis.__whatsapp_manager__`)**
   - In Next.js development mode, files recompile frequently. Without our singleton mutex lock, multiple sockets would open to WhatsApp simultaneously, triggering an instant temporary ban. Our singleton ensures only 1 socket runs across the Node process.
3. **Natural Human Presence & Rate Jitter**
   - Sending 100 messages in 1 second triggers automated spam heuristics. Our queue enforces human typing emulation and a randomized 2.5s–4.5s delay.
4. **Audience Limitation Philosophy**
   - Designed for curated batches of **200 to 500 customers** per run.
5. **Credential Security**
   - The session directory `auth_baileys/` is included in `.gitignore` to prevent leaking private cryptographic keys to version control.

---

## 6. Database Schema (Prisma)

### 1. `WhatsAppCampaign`
- `id`: BigInt primary key
- `name`: Campaign title
- `type`: Enum (`FESTIVAL`, `OFFER`, `PROMOTION`, `CUSTOM`)
- `status`: Enum (`DRAFT`, `SCHEDULED`, `RUNNING`, `PAUSED`, `COMPLETED`, `CANCELLED`)
- `message`: Template body
- `media_url`: Optional promotional image URL
- `total_recipients`, `sent_count`, `failed_count`: Real-time counters
- `scheduled_at`, `started_at`, `completed_at`: Timestamps

### 2. `WhatsAppCampaignRecipient`
- `campaign_id`: Foreign key to campaign
- `customer_id`: Optional foreign key to customer profile
- `customer_name`: Name for variable substitution
- `phone_number`: Clean phone number
- `status`: Enum (`QUEUED`, `SENDING`, `SENT`, `FAILED`, `SKIPPED`)
- `whatsapp_message_id`: ID returned by WhatsApp server upon successful delivery
- `error_message`: Detailed failure reason if undelivered
- `sent_at`: Delivery timestamp
- *Compound unique constraint:* `[campaign_id, phone_number]` prevents duplicate messages to the same person in a campaign.

### 3. `WhatsAppTemplate`
- Preset festive & promotional templates (Pongal, Diwali, Weekend Flash Sale, New Launch)
- Custom user-created reusable templates

---

## 7. How to Test & Demo to the Team

1. **Navigate to the WhatsApp Tab:**
   - Log into the Admin Dashboard $\rightarrow$ Look at the left sidebar $\rightarrow$ Click **"WhatsApp"** (placed right above Settings).
2. **Link the Admin Phone:**
   - Click **"Start Connection"** $\rightarrow$ Scan the QR code with WhatsApp $\rightarrow$ Wait 2 seconds for the status badge to turn **🟢 Connected**.
3. **Test Single Message:**
   - Use the Quick Message box on `/admin/dashboard/whatsapp`.
   - Enter one of our test numbers (e.g., `7305996058` or `9677313783`).
   - Click **"Send Message"** and observe instant delivery on the receiving phone.
4. **Test Campaign Creation:**
   - Go to **Campaigns** tab $\rightarrow$ Click **"Create Campaign"**.
   - Select audience $\rightarrow$ Notice the 6 newly added test customers appear under **"WhatsApp Ready"**.
   - Type message with `{{customer_name}}` and preview the live mobile mockup.
   - Click **"Launch Campaign"** $\rightarrow$ Watch the real-time progress bar update as messages are delivered with safe delays.
5. **Review Delivery Reports:**
   - Go to **Reports & Analytics** $\rightarrow$ Review overall delivery rate %, campaign stats, and click **"View Details"** to audit individual recipient logs and timestamps.
