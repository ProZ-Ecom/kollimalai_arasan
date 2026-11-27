/**
 * Kollimalai Arasan Project Handover Documentation Generator
 * Generates an executive, formal, publication-grade .docx document.
 * 
 * Strict Styling Guidelines:
 * - Pure White Page (No colored background)
 * - Pure Black Text (#000000) throughout
 * - Professional monochrome / greyscale tables, borders, and callouts
 * - Includes High-Resolution UML Use Case Diagram of Full Flow
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ImageRun,
} = require('docx');

// Strict Monochrome Palette
const COLOR_BLACK = '000000';       // Pure Black
const COLOR_DARK_GREY = '333333';   // Dark Grey (captions / notes)
const COLOR_BORDER = 'CCCCCC';      // Clean Subtle Grey for table borders
const COLOR_BORDER_BLACK = '000000';// Solid Black for key borders
const COLOR_WHITE = 'FFFFFF';       // Pure White

// Thin clean cell borders
const tableBorderClean = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
};

// Formal header bottom border
const headerBottomBorder = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BORDER_BLACK },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

// Heading 1: Clean, Bold, Black
function createH1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
  });
}

// Heading 2: Clean, Bold, Black
function createH2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
  });
}

// Heading 3: Clean, Bold, Black
function createH3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
  });
}

// Normal body paragraph
function createP(text, options = {}) {
  return new Paragraph({
    spacing: { before: options.before || 80, after: options.after || 80, line: 276 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        size: options.size || 22, // 11pt
        color: COLOR_BLACK,
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

// Bullet list item
function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, color: COLOR_BLACK, size: 22 }));
  }
  children.push(new TextRun({ text: text, size: 22, color: COLOR_BLACK }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 50, after: 50 },
    children: children,
  });
}

// Formal Callout / Note box (White background, solid black left rule)
function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 20, color: COLOR_BORDER_BLACK },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_WHITE },
            margins: { top: 120, bottom: 120, left: 180, right: 120 },
            children: [
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({ text: 'NOTE: ' + title, bold: true, color: COLOR_BLACK, size: 22 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: text, size: 21, color: COLOR_BLACK, italics: true }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Professional Monochrome Table
function createTable(headers, rows, colWidths = []) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        shading: { fill: COLOR_WHITE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER_BLACK },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BORDER_BLACK },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: h, bold: true, color: COLOR_BLACK, size: 20 })],
          }),
        ],
      })
    ),
  });

  const tableRows = rows.map((row, rowIndex) =>
    new TableRow({
      children: row.map((cellText, cellIndex) =>
        new TableCell({
          shading: { fill: COLOR_WHITE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            bottom: rowIndex === rows.length - 1
              ? { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER_BLACK }
              : { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          width: colWidths[cellIndex] ? { size: colWidths[cellIndex], type: WidthType.PERCENTAGE } : undefined,
          margins: { top: 90, bottom: 90, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cellText,
                  size: 20,
                  color: COLOR_BLACK,
                  bold: cellIndex === 0,
                }),
              ],
            }),
          ],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...tableRows],
  });
}

async function generateDocumentation() {
  const children = [];

  // ==========================================
  // COVER / TITLE SECTION (PROFESSIONAL MONOCHROME)
  // ==========================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 120 },
      children: [
        new TextRun({
          text: 'KOLLIMALAI ARASAN',
          bold: true,
          size: 46, // 23pt
          color: COLOR_BLACK,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [
        new TextRun({
          text: 'Enterprise E-Commerce Platform Project Handover Documentation',
          size: 26, // 13pt
          color: COLOR_BLACK,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      children: [
        new TextRun({
          text: 'Technical Specifications, Full Flow UML Use Case Model, Architecture, Module Inventory & Deployment Runbook',
          size: 21,
          italics: true,
          color: COLOR_DARK_GREY,
        }),
      ],
    })
  );

  // Metadata Table
  children.push(
    createTable(
      ['Specification Item', 'Technical Parameter & Project Value'],
      [
        ['Project Title', 'Kollimalai Arasan Natural & Organic E-Commerce Platform'],
        ['Software Release', 'Version 1.0.0 (Production Master)'],
        ['Handover Date', 'November 2026'],
        ['Core Frameworks', 'Next.js 16.3.0 (App Router), React 19.2.8, TypeScript 5.x'],
        ['Data Persistence', 'MariaDB / MySQL 10.11+ via Prisma ORM 7.9.1 (@prisma/adapter-mariadb)'],
        ['Third-Party Services', 'Shiprocket Logistics, ST Courier, Razorpay Gateway, WhatsApp Baileys, Hostinger SMTP'],
        ['Document Classification', 'Confidential - Formal Technical Handover Asset'],
      ],
      [30, 70]
    )
  );

  children.push(new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }));

  // ==========================================
  // 1. EXECUTIVE SUMMARY
  // ==========================================
  children.push(createH1('1. Executive Summary'));
  children.push(
    createP(
      'The Kollimalai Arasan web application is an enterprise Direct-to-Consumer (D2C) e-commerce system purpose-built for natural, organic agricultural, herbal, and wellness products. Engineered using Next.js 16 (App Router) and React 19, the platform provides server-side rendered storefront performance, omnichannel fulfillment workflows, multi-carrier logistics automation, and an administrative control suite.'
    ),
    createP(
      'This document serves as the formal technical handover manual. It details the system architecture, the complete end-to-end UML Use Case Model illustrating full system flows, an inventory of 14 core functional modules (35 feature domains), 93 database models, recently engineered and verified features, and standard operating procedures (SOP) for production deployment and ongoing maintenance.'
    ),
    createCallout(
      'System Verification & Static Analysis Status',
      'The platform codebase has completed full static verification (strict TypeScript compilation with 0 errors), database integrity validation, end-to-end payment gateway transaction testing, multi-carrier dispatch mocks, and high-performance video media streaming.'
    )
  );

  // ==========================================
  // 2. SYSTEM ARCHITECTURE & TECH STACK
  // ==========================================
  children.push(createH1('2. System Architecture & Technology Stack'));
  children.push(
    createP(
      'The application follows a modern feature-sliced modular architecture within Next.js 16. The persistence layer is decoupled through Prisma ORM repositories and domain service layers, ensuring clean separation of concerns and maintainability.'
    ),
    createTable(
      ['Architecture Layer', 'Technology Component', 'Version', 'Role & Operational Purpose'],
      [
        ['Frontend Web', 'Next.js App Router (SSR)', '16.3.0', 'Server-Side Rendering, React Server Components, Streaming HTML, Edge API routing'],
        ['UI Component Library', 'React', '19.2.8', 'Component model with React 19 hooks and optimistic UI states'],
        ['Language Engine', 'TypeScript', '5.x', 'Strict end-to-end type validation across database queries, APIs, and client views'],
        ['Styling Engine', 'Tailwind CSS', 'v4.0', 'High-performance utility CSS engine with zero runtime styling overhead'],
        ['ORM & Data Layer', 'Prisma ORM with MariaDB Adapter', '7.9.1', 'Type-safe SQL querying, schema migrations, and connection pooling'],
        ['Database Engine', 'MariaDB / MySQL', '10.11+ / 8.0+', 'Enterprise relational database with ACID guarantees, constraints, and indexes'],
        ['Authentication', 'Dual Auth: NextAuth v5 + JWT', '5.0-beta / 9.0', 'Google OAuth 2.0 social login + Custom HttpOnly Access/Refresh tokens'],
        ['Payment Processing', 'Razorpay Node SDK', '2.9.8', 'UPI, Cards, NetBanking, Instant Automated Refunds & Webhook verification'],
        ['Logistics Integration', 'Shiprocket API + ST Courier', 'REST / Cron', '1-Click automated AWB booking, multi-carrier calculation, and tracking sync'],
        ['Messaging Suite', 'WhatsApp Baileys Protocol', '7.0.0-rc14', 'Direct multi-device QR pairing, transactional order alerts & bulk marketing broadcasts'],
        ['Email Notifications', 'Nodemailer (Hostinger SMTP)', '8.0.11', 'HTML transactional emails for orders, customer returns, and password resets'],
        ['Rich Content & CMS', 'TipTap Editor & Jimp', '3.31 / 1.6', 'WYSIWYG blog management & server-side image optimization'],
        ['Document & Media', 'RFC 9110 HTTP 206 Streaming', 'Custom Engine', 'Range request video streaming for unboxing returns + PDF invoices'],
      ],
      [20, 28, 12, 40]
    )
  );

  // ==========================================
  // 3. FULL FLOW UML USE CASE DIAGRAM & MODEL
  // ==========================================
  children.push(createH1('3. Complete End-to-End UML Use Case Diagram & Flow Model'));
  children.push(
    createP(
      'The diagram below illustrates the end-to-end functional use cases, system boundaries, and interactions among primary actors (Storefront Customer, Registered Customer, Wholesale B2B Client) and secondary/external actors (Store Administrator, Logistics Partners, External Payment & Communication Gateways):'
    )
  );

  // Embed Use Case Diagram Image (High-Res B&W)
  const diagramPath = path.resolve(process.cwd(), 'use_case_diagram.png');
  if (fs.existsSync(diagramPath)) {
    const imgBuffer = fs.readFileSync(diagramPath);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 140, after: 80 },
        children: [
          new ImageRun({
            data: imgBuffer,
            transformation: {
              width: 600,  // Fits standard 6.5 inch printable width
              height: 412, // Aspect ratio 16:11
            },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 180 },
        children: [
          new TextRun({
            text: 'Figure 3.1: Formal UML 2.5 Use Case Diagram - Complete Platform Lifecycle',
            size: 19,
            italics: true,
            color: COLOR_DARK_GREY,
          }),
        ],
      })
    );
  }

  children.push(createH2('3.1 System Actors Specification'));
  children.push(
    createTable(
      ['Actor Identifier', 'Classification', 'Description & Scope of Authority'],
      [
        ['Customer / Visitor', 'Primary External', 'Unauthenticated or guest user browsing product catalog, search filters, variants, and adding items to cart.'],
        ['Registered Customer', 'Primary External', 'Authenticated account holder managing saved addresses, order history, live tracking, and return requests with video proofs.'],
        ['Wholesale / B2B Client', 'Primary External', 'Business entity submitting commercial bulk purchase inquiries and request for quotations.'],
        ['Store Administrator', 'Primary Internal', 'Full privileged operator managing catalog, inventory, GST rates, order fulfillment, refund approvals, and WhatsApp campaigns.'],
        ['Logistics / Carrier', 'Secondary External', 'Carrier partners (ST Courier, Shiprocket, MSS Cargo) receiving parcel manifests, generating AWBs, and returning live checkpoint webhooks.'],
        ['Payment Gateway', 'Secondary External', 'Razorpay banking service processing UPI, Cards, NetBanking, and automated partial/full refund payouts.'],
        ['Communication Gateway', 'Secondary External', 'WhatsApp Baileys protocol and Hostinger SMTP dispatching transactional notifications and marketing messages.'],
      ],
      [22, 20, 58]
    )
  );

  children.push(createH2('3.2 End-to-End Use Case Execution Lifecycle'));
  children.push(
    createP(
      'The platform coordinates 10 chronological phases from catalog discovery to return settlement:'
    ),
    createBullet('Customer explores categories, selects package sizes (e.g. 100ml, 250ml, 500ml, 1L), reviews live stock availability, and inspects GST-inclusive pricing.', 'Phase 1: Catalog Discovery & Multi-Unit Selection:'),
    createBullet('Customer adds items to cart with real-time stock validation, enters optional coupon codes, and adds optional delivery notes.', 'Phase 2: Cart Management & Promotional Discounting:'),
    createBullet('Customer enters a 6-digit postal code; system automatically verifies city, district, and state, presenting a cleaned dropdown of local delivery post offices.', 'Phase 3: Postal Verification & Address Selection:'),
    createBullet('Customer selects Online Payment (Razorpay modal for UPI, Cards, NetBanking) or Cash on Delivery (COD) with immediate confirmation and zero upfront friction.', 'Phase 4: Dual Checkout & Payment Authorization:'),
    createBullet('System provisions the order record, sends instant WhatsApp confirmation to customer, and transitions status: PENDING -> CONFIRMED -> PROCESSING -> PACKED.', 'Phase 5: Order State Machine Initialization:'),
    createBullet('Staff accesses Ship Order modal, views customer choice badge, and books ST Courier (default), Shiprocket 1-click AWB, or MSS Cargo. System generates sequential GST tax invoice (WEB/YY-YY/XXXX).', 'Phase 6: Multi-Carrier Logistics Dispatch & Tax Invoicing:'),
    createBullet('Carrier transit updates stream into the platform via Shiprocket webhooks and scheduled ST Courier cron jobs (/api/cron/sync-st-courier). Customer receives automated WhatsApp out-for-delivery alert.', 'Phase 7: Real-Time Transit Synchronization:'),
    createBullet('Customer initiates return in self-service portal, providing reason and uploading mandatory unboxing condition video and photos.', 'Phase 8: Customer Return Ticket & Video Proof Upload:'),
    createBullet('Staff streams inspection video via RFC 9110 HTTP 206 byte-range media route (/document/[folder]/[filename]), dispatches Shiprocket reverse pickup, and confirms physical warehouse receipt.', 'Phase 9: Video Streaming Review & Reverse Logistics:'),
    createBullet('System evaluates refund amount: if 100% of item/order value, marks as REFUNDED; if custom deduction applied, marks as PARTIALLY_REFUNDED. Razorpay dispatches funds automatically.', 'Phase 10: Precision 100% Full vs Partial Refund Execution:')
  );

  // ==========================================
  // 4. MODULE INVENTORY: 14 CORE FUNCTIONAL MODULES
  // ==========================================
  children.push(createH1('4. Platform Module Inventory: 14 Core Functional Modules'));
  children.push(
    createP(
      'The platform is organized into 14 overarching core functional modules comprising 35 feature submodules located in src/features and 30 admin management suites located in src/app/admin/dashboard:'
    )
  );

  const modulesData = [
    {
      num: '1',
      title: 'Authentication & Identity Access Management (IAM)',
      features: 'auth, users, roles, permissions',
      desc: 'Dual authentication engine combining NextAuth v5 Google OAuth and custom JWT HttpOnly cookies with access/refresh rotation. Granular Role-Based Access Control (RBAC) with 35 permissions spanning SUPER_ADMIN, ADMIN, STAFF, and CUSTOMER.',
    },
    {
      num: '2',
      title: 'Product Catalog & Master Data Management',
      features: 'products, categories, brands, units, variants, attributes, hsn-codes, gst-rates',
      desc: 'Hierarchical product categorization, brand directory, multi-variant unit matrix (e.g. 100ml, 250ml, 500ml, 1L), fractional pricing, barcode tracking, and Indian GST rate (0%, 5%, 12%, 18%, 28%) with HSN classification.',
    },
    {
      num: '3',
      title: 'Storefront Shopping & Cart Engine',
      features: 'cart, wishlist, checkout, addresses',
      desc: 'Real-time cart validation against live inventory, coupon discount calculator, wishlist persistence, India Postal PIN code auto-discovery of City/District/State/Post Office, and multi-address management.',
    },
    {
      num: '4',
      title: 'Order Management & Fulfillment Lifecycle',
      features: 'orders, delivery, shipping, invoice',
      desc: '9-stage order state machine: PENDING -> CONFIRMED -> PROCESSING -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED (or CANCELLED / RETURNED). Real-time admin filtering, search, and bulk order actions.',
    },
    {
      num: '5',
      title: 'Courier & Logistics Multi-Carrier Integration',
      features: 'shiprocket, st-courier, mss-cargo, delivery-partners',
      desc: 'Integrated logistics engine supporting Shiprocket 1-click automated booking, ST Courier AWB generation with scheduled cron synchronization, MSS Cargo overland dispatch, and in-house staff doorstep delivery.',
    },
    {
      num: '6',
      title: 'Customer Returns, Refunds & Video Inspection Engine',
      features: 'returns, document streaming, refund service',
      desc: 'Self-service customer return portal requiring photo/video evidence. Admin review dashboard featuring RFC 9110 HTTP 206 partial-content video streaming, reverse pickup dispatch, physical inspection sign-off, and smart partial/full refund calculation.',
    },
    {
      num: '7',
      title: 'Payment Gateway & Cash on Delivery (COD)',
      features: 'payment, razorpay, cod-workflow',
      desc: 'Razorpay payment gateway supporting UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets. Cash on Delivery (COD) workflow with automated ledger settlement and webhook-verified reconciliation.',
    },
    {
      num: '8',
      title: 'Warehouse, Inventory & Stock Tracking',
      features: 'inventory, stock-adjustments, trash',
      desc: 'Variant-level inventory management with low-stock alerts, safety stock thresholds, transaction audit logs (Stock In, Stock Out, Damage, Return Additions), and a soft-delete trash recovery bin.',
    },
    {
      num: '9',
      title: 'Marketing, Coupons & Promotional Engine',
      features: 'coupons, offers, banners',
      desc: 'Coupon rule engine (percentage vs flat, minimum order value, max discount cap, usage limits per customer), dynamic promotional hero/strip banners, and flash offer countdown timers.',
    },
    {
      num: '10',
      title: 'WhatsApp Automation & Communication Suite',
      features: 'whatsapp, notification-templates, campaigns',
      desc: 'Direct Baileys WhatsApp Web protocol integration with QR code pairing in admin dashboard. Sends automated transactional notifications (Order Placed, Shipped with AWB, Out for Delivery) and broadcasts marketing campaigns to customer segments.',
    },
    {
      num: '11',
      title: 'B2B Bulk Orders & Customer Relationship Management (CRM)',
      features: 'bulk-orders, contact, customers',
      desc: 'Wholesale B2B inquiry submission workflow, storefront contact messages inbox, customer lifetime value (LTV) tracking, order history profiling, and customer blocking/unblocking.',
    },
    {
      num: '12',
      title: 'Content Management System (CMS) & Knowledge Base',
      features: 'blogs, faqs, page-contents, seo-meta',
      desc: 'Rich-text blog publishing with TipTap editor, category tagging, comment moderation, categorized accordion FAQs, and dynamic SEO meta tag injection.',
    },
    {
      num: '13',
      title: 'Customer Reviews, Ratings & Social Proof',
      features: 'reviews, review-images',
      desc: 'Verified buyer product reviews with 5-star ratings, photo attachments, customer testimonials showcase, and admin moderation workflow (Approve, Hide, Delete).',
    },
    {
      num: '14',
      title: 'Analytics, Financial Reporting & Executive Dashboard',
      features: 'dashboard, reports, company, settings, import',
      desc: 'Live financial KPI dashboard (Total Revenue, Orders, Average Order Value, Pending Dispatches), sales and inventory Excel export, bulk product Excel import, and company legal profile configuration.',
    },
  ];

  modulesData.forEach((m) => {
    children.push(createH2(`Module ${m.num}: ${m.title}`));
    children.push(createBullet(m.features, 'Submodules:'));
    children.push(createBullet(m.desc, 'Functional Scope:'));
  });

  // ==========================================
  // 5. DETAILED FEATURES ADDED & ENHANCED
  // ==========================================
  children.push(createH1('5. Features Added & System Enhancements'));
  children.push(
    createP(
      'Below is a detailed engineering summary of the features added, refined, and verified across the platform:'
    )
  );

  const featuresDeep = [
    {
      title: '5.1 Dual Payment Engine (Razorpay Online + Cash on Delivery / COD)',
      items: [
        'Integrated Razorpay modal checkout with real-time cryptographic signature verification and webhook fallback.',
        'Engineered high-conversion Cash on Delivery (COD) radio option with dedicated visual indicator and zero upfront friction.',
        'Intelligent payment state tracking: distinguishes between PAID (Razorpay captured), COD_PENDING (awaiting doorstep cash collection), and PAID_ON_DELIVERY.',
        'Order status transitions automatically settle COD balances upon order delivery confirmation.',
      ],
    },
    {
      title: '5.2 Real-Time India Postal PIN Code Verification & Post Office Auto-fill',
      items: [
        'Direct integration with the India Postal Pincode API for automated verification upon entering a 6-digit code.',
        'Automatically extracts and populates District, City, and State without manual customer typing.',
        'Enhanced dropdown UI: Stripped noisy "Branch Post Office • Delivery / Non-Delivery" labels to present a clean, elegant list of local post office and locality names.',
        'Eliminates delivery failures and address entry typos by delivery couriers.',
      ],
    },
    {
      title: '5.3 Multi-Carrier Logistics with Default ST Courier & Ship Order Modal',
      items: [
        'Orders table defaults to displaying ST Courier as the primary regional carrier in Tamil Nadu and South India.',
        'Ship Order Modal highlights the customer\'s checkout choice via a "Customer Choice" badge.',
        'Administrative Dropdown selector allowing staff to pick ST Courier, Shiprocket Multi-Carrier, MSS Cargo, or In-house Staff Delivery.',
        'Automated AWB tracking modal with direct live links to official carrier tracking portals.',
      ],
    },
    {
      title: '5.4 Resilient Shiprocket Multi-Carrier Integration & Auto-Mock Fallback',
      items: [
        '1-Click automated parcel booking: aggregates order items, calculates volumetric weight, submits payload to Shiprocket API, assigns fastest carrier (Delhivery, BlueDart, DTDC, etc.), and generates printable shipping labels.',
        'Smart Test Mode & Wallet Balance Guard: When running in development/testing mode, if the Shiprocket account balance is below the Rs 100 API threshold, the system automatically detects the error and smoothly generates an authoritative mock AWB (e.g., TEST-SR-13324481) without interrupting admin testing.',
        'Configurable via environment variables (SHIPROCKET_TEST_MODE, SHIPROCKET_LOCAL_MOCK_FALLBACK).',
      ],
    },
    {
      title: '5.5 Customer Unboxing Video Upload & RFC 9110 HTTP 206 Streaming',
      items: [
        'Customers can upload video files (MP4, MOV, WebM) during return requests as authentic proof of product damage or defect.',
        'Implemented custom secure document streaming route at /document/[folder]/[filename] located outside the public web root.',
        'Dual-Layer Auth: Validates both NextAuth Google OAuth sessions and custom JWT access_token HttpOnly cookies.',
        'Full RFC 9110 HTTP 206 Partial Content Range Support: Correctly parses single byte ranges, start-offset ranges, and tail suffix ranges (e.g. bytes=-65536) enabling browsers to seek and read metadata (moov atom) from large video files instantly.',
        'Resilient inline video player with fallback to direct download or opening in a new tab if video codecs are unsupported.',
      ],
    },
    {
      title: '5.6 Precision Return & Refund Calculations (Full 100% vs Partial Refund)',
      items: [
        'Admin Returns Processing Center allows approving/rejecting returns, booking Shiprocket doorstep reverse pickups, and recording physical parcel receipt.',
        'Smart Refund Calculation: Detects whether the refunded amount equals 100% of the item/order value or a partial amount (e.g., after deducting restocking fees or handling charges).',
        'Automatically marks the order payment status as "REFUNDED" (Full Refund) or "PARTIALLY_REFUNDED" (Partial Refund), reflecting dynamic badges in the Orders and Returns tables.',
        'Triggers automated Razorpay API refunds for prepaid orders or updates the manual accounting ledger for COD returns.',
      ],
    },
    {
      title: '5.7 GST-Compliant Sequential Tax Invoices (WEB/YY-YY/XXXX)',
      items: [
        'Complies with Indian Goods and Services Tax (GST) invoicing standards.',
        'Sequential invoice series generator using atomic database transactions (InvoiceSequence model) preventing duplicate numbering during high-volume checkout.',
        'Itemized display of HSN Codes, CGST (Central Tax), SGST (State Tax), and IGST (Integrated Tax for inter-state sales).',
        'Dedicated printable web route at /invoice/[uuid] with company branding, GSTIN, registered office address, and customer delivery details.',
      ],
    },
    {
      title: '5.8 Direct WhatsApp Baileys Automation Suite',
      items: [
        'Direct multi-device WhatsApp protocol integration without expensive per-message third-party SaaS charges.',
        'Interactive QR code modal in the admin settings for instant device scanning and pairing.',
        'Transactional notification triggers on order events: Confirmation, Shipment with live tracking URL, and Out for Delivery alerts.',
        'Marketing Campaign Engine: Filter customers by buying behavior and schedule broadcast campaigns with dynamic templates (e.g., {{customer_name}}, {{order_id}}).',
      ],
    },
    {
      title: '5.9 Multi-Variant Unit Matrix with Fractional Pricing & HSN/GST Rules',
      items: [
        'Supports products with diverse physical packaging (Bottles, Pouches, Tins, Jars) across custom volumes (100ml, 250ml, 500ml, 1000ml, 1kg).',
        'Fractional pricing engine with live variant switching, strike-through MRP, and automatic GST inclusion calculations.',
        'Unit master management with conversion factors (e.g. 1000ml = 1L) for accurate inventory depletion during order fulfillment.',
      ],
    },
    {
      title: '5.10 Excel Bulk Catalog Management & Template Generator',
      items: [
        'Administrative Excel import tool supporting bulk creation and updating of categories, products, and variants via .xlsx spreadsheets.',
        'One-click sample template generator with predefined column headers and validation rules.',
        'Export features for Orders, Inventory, and Customer reports using write-excel-file and read-excel-file.',
      ],
    },
    {
      title: '5.11 Granular Role-Based Access Control (RBAC) & Security Hardening',
      items: [
        'Role and Permission data models supporting dynamic assignment of permissions across all 35 application domains.',
        'Fine-grained API protection using requireAuth() and requirePermission() middleware guards.',
        'Bcryptjs password encryption with salt rounds 10, JWT secret expiration policies, and secure sameSite cookie attributes.',
        'Sanitization of user input using isomorphic-dompurify preventing stored and reflected XSS attacks.',
      ],
    },
    {
      title: '5.12 Soft-Delete Trash Bin & Safe Restoration',
      items: [
        'Soft-deletion architecture (deleted_at timestamps) across Products, Categories, Brands, Banners, and Variants.',
        'Admin "Trash" view allowing staff to review deleted entities, restore them with one click, or permanently purge them.',
      ],
    },
  ];

  featuresDeep.forEach((f) => {
    children.push(createH2(f.title));
    f.items.forEach((item) => children.push(createBullet(item)));
  });

  // ==========================================
  // 6. DATABASE SCHEMA INVENTORY (93 MODELS)
  // ==========================================
  children.push(createH1('6. Database Architecture & Schema Directory (93 Prisma Models)'));
  children.push(
    createP(
      'The persistence layer utilizes MariaDB/MySQL managed through Prisma ORM 7.9. The schema contains 93 relational models organized into 9 domain clusters:'
    ),
    createTable(
      ['Domain Cluster', 'Prisma Database Models Included', 'Functional Purpose'],
      [
        [
          'Identity & RBAC',
          'User, Role, Permission, RolePermission, user_sessions, login_logs, otp_verifications',
          'Manages customers, administrators, staff credentials, roles, permissions, and active login sessions.',
        ],
        [
          'Product & Catalog',
          'Product, ProductCategory, ProductBrand, ProductVariant, VariantUnitPrice, ProductImage, ProductAttribute, AttributeValue, product_units, product_gst_rates, product_hsn_codes, product_category_images, product_variant_images, produt_brand_images, product_tags, product_tag_maps, product_attribute_values, combo_products, combo_product_items',
          'Stores complete master catalog, nested categories, multi-variants, pricing units, media galleries, GST and HSN codes.',
        ],
        [
          'Cart, Wishlist & Checkout',
          'Cart, CartItem, WishlistItem, pincode_serviceability, recently_viewed_products, search_history',
          'Handles live storefront shopping carts, customer wishlists, recent views, and postal pincode lookup.',
        ],
        [
          'Orders & Invoicing',
          'Order, OrderItem, OrderAddress, InvoiceSequence, order_status_history, sales_reports',
          'Captures placed orders, line items, delivery addresses, GST sequential invoice numbers, and order audit trail.',
        ],
        [
          'Logistics & Shipping',
          'shipments, shipment_tracking, shipping_charges, shipping_zones, delivery_partners, delivery_slots',
          'Manages courier dispatches, AWB numbers, carrier checkpoints, regional delivery zones, and slots.',
        ],
        [
          'Payments & Refunds',
          'Payment, PaymentTransaction, refunds, payment_gateway_webhooks, payment_methods, Wallet, WalletTransaction, reward_points, reward_transactions',
          'Manages Razorpay transactions, COD receipts, refund records, payment webhooks, wallets, and loyalty points.',
        ],
        [
          'Returns & Reverse Logistics',
          'return_requests, return_items',
          'Captures customer return requests, inspection videos, doorstep reverse pickups, and refund tracking.',
        ],
        [
          'Inventory & Warehouse',
          'Inventory, InventoryTransaction, stock_adjustments, stock_reports',
          'Tracks live variant stock counts, minimum alert buffers, and immutable audit logs of all stock adjustments.',
        ],
        [
          'Marketing & CMS',
          'Coupon, coupon_usage, Offer, offer_products, offer_items, Banner, banner_positions, Blog, blog_categories, blog_comments, faq, Review, ReviewImage, product_questions, contact_messages, bulk_order_enquiries, newsletter_subscribers, WhatsAppCampaign, WhatsAppCampaignRecipient, WhatsAppTemplate, Notification, notification_logs, notification_templates, pages, page_contents, seo_meta, settings, Company, AuditLog, redirect_urls, customer_profiles, customer_reports',
          'Manages discounts, marketing campaigns, blogs, customer reviews, WhatsApp templates, FAQs, SEO, and company settings.',
        ],
      ],
      [22, 48, 30]
    )
  );

  // ==========================================
  // 7. API DIRECTORY & ROUTE SPECIFICATION
  // ==========================================
  children.push(createH1('7. Application Routing & Primary API Reference'));
  children.push(
    createP(
      'The application exposes clean RESTful API routes under src/app/api. Below is the directory of primary operational endpoints:'
    ),
    createTable(
      ['Endpoint Path', 'HTTP Method', 'Auth Level', 'Description & Action'],
      [
        ['/api/auth/[...nextauth]', 'GET / POST', 'Public', 'NextAuth OAuth endpoint for Google social sign-in'],
        ['/api/auth/login', 'POST', 'Public', 'Custom JWT login endpoint issuing HttpOnly access/refresh tokens'],
        ['/api/auth/logout', 'POST', 'Authenticated', 'Clears authentication cookies and invalidates session'],
        ['/api/cart', 'GET / POST / PUT', 'Public / User', 'Retrieves, adds, updates, and validates cart items against stock'],
        ['/api/checkout', 'POST', 'Customer', 'Processes order checkout, calculates totals, applies coupons, validates addresses'],
        ['/api/razorpay/webhook', 'POST', 'Razorpay Webhook', 'Reconciles payment captures, authorized charges, and automated refunds'],
        ['/api/admin/orders/list', 'GET', 'Admin / Staff', 'Paginated orders retrieval with multi-tab filters and global search'],
        ['/api/admin/orders/[uuid]/ship', 'POST', 'Admin / Staff', 'Dispatches order via ST Courier, MSS Cargo, or Staff with manual AWB'],
        ['/api/admin/orders/[uuid]/shiprocket', 'POST', 'Admin / Staff', '1-Click automated Shiprocket booking with dynamic mock fallback'],
        ['/api/admin/returns/list', 'GET', 'Admin / Staff', 'Lists customer return requests with video and photo media links'],
        ['/api/admin/returns/[uuid]/refund', 'POST', 'Admin', 'Executes 100% full or partial refund via Razorpay and updates ledger'],
        ['/api/document/[folder]/[filename]', 'GET', 'Authenticated', 'Secure authenticated streaming media endpoint with RFC 9110 HTTP 206'],
        ['/api/webhooks/shiprocket', 'POST', 'Shiprocket Webhook', 'Receives transit and delivery status updates from Shiprocket'],
        ['/api/cron/sync-st-courier', 'GET', 'Cron Secret', 'Automated background cron task synchronizing ST Courier tracking states'],
        ['/api/admin/whatsapp/campaigns', 'GET / POST', 'Admin', 'Manages WhatsApp broadcast marketing campaigns and dispatches messages'],
      ],
      [28, 14, 18, 40]
    )
  );

  // ==========================================
  // 8. ENVIRONMENT CONFIGURATION & RUNBOOK
  // ==========================================
  children.push(createH1('8. Environment Configuration Guide'));
  children.push(
    createP(
      'The repository contains distinct configuration templates: .env_dev, .env_test, and .env_prod. Below is the configuration key reference:'
    ),
    createTable(
      ['Configuration Variable', 'Production Setting', 'Description & Security Requirement'],
      [
        ['APP_ENV / NEXT_PUBLIC_APP_ENV', 'production', 'Defines environment mode; disables dev mocks and test bypasses.'],
        ['DATABASE_URL', 'mysql://user:pass@host:3306/db', 'Connection string to production MariaDB/MySQL database.'],
        ['NEXT_PUBLIC_APP_URL', 'https://kollimalaiarasan.com', 'Public canonical URL used for SEO, canonical links, and webhook callbacks.'],
        ['AUTH_SECRET', 'Strong 32+ char random string', 'Secret key used by NextAuth to sign session tokens.'],
        ['JWT_ACCESS_SECRET / JWT_REFRESH_SECRET', 'Strong random secret keys', 'Cryptographic keys for signing JWT access and refresh cookies.'],
        ['SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS', 'smtp.hostinger.com:465', 'Hostinger business email credentials for transactional customer emails.'],
        ['RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET', 'rzp_live_...', 'Production live credentials obtained from the Razorpay Dashboard.'],
        ['RAZORPAY_WEBHOOK_SECRET', 'Secret token', 'Validates HMAC SHA256 signatures on incoming Razorpay webhook payloads.'],
        ['SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD', 'Official Account Email/Pass', 'Shiprocket production account credentials for API authentication.'],
        ['SHIPROCKET_TEST_MODE', 'false', 'Set to "false" in production to book real courier dispatches via Shiprocket.'],
        ['SHIPROCKET_LOCAL_MOCK_FALLBACK', 'false', 'Disabled in production; strictly enforces live AWB generation.'],
        ['UPLOAD_DIR', '/mnt/storage/document', 'Absolute path to persistent volume storage for customer return photos and videos.'],
      ],
      [26, 26, 48]
    )
  );

  // ==========================================
  // 9. DEPLOYMENT & MAINTENANCE RUNBOOK
  // ==========================================
  children.push(createH1('9. Production Operations, Build & Maintenance Runbook'));
  children.push(
    createP(
      'To build and launch the platform in a production Linux/Node.js environment, execute these standard operational procedures:'
    ),
    createH2('9.1 Build & Launch Commands'),
    createBullet('npm run build:prod', 'Production Build: Compiles Next.js application with webpack and generates Prisma Client:'),
    createBullet('npm run start:prod', 'Production Start: Launches Next.js standalone HTTP server loaded with .env_prod:'),
    createBullet('npm run db:migrate:prod', 'Database Migration: Applies safe Prisma schema migrations to production MariaDB:'),
    createBullet('npm run db:sync', 'Database Sync: Verifies and synchronizes schema definitions with the live database:'),
    createH2('9.2 Scheduled Background Cron Job Setup'),
    createP(
      'To enable automated ST Courier tracking updates, configure a system crontab on the host server to invoke the cron endpoint every 30 minutes:'
    ),
    createBullet(
      '*/30 * * * * curl -X GET https://kollimalaiarasan.com/api/cron/sync-st-courier -H "Authorization: Bearer <CRON_SECRET>" > /dev/null 2>&1',
      'Crontab Entry:'
    ),
    createH2('9.3 Media & Persistent Storage Directory Setup'),
    createP(
      'Customer return videos and unboxing photos are stored on the server filesystem. Ensure the target storage folder exists and has write permissions granted to the Node.js process (e.g. chmod -R 775 /var/data/kollimalai/document).'
    ),
    createH2('9.4 WhatsApp Session Management'),
    createP(
      'The WhatsApp Baileys protocol stores auth credentials in the local auth directory. If connection drops or the device is logged out, the administrator simply visits Admin Dashboard -> Settings -> WhatsApp and scans the freshly generated QR code with their mobile device.'
    )
  );

  // ==========================================
  // 10. CONCLUSION & HANDOVER SIGN-OFF
  // ==========================================
  children.push(createH1('10. Handover Sign-Off & Deliverable Acceptance'));
  children.push(
    createP(
      'All source code, database schemas, third-party integration pipelines, build scripts, and media streaming endpoints have been verified, validated, and finalized for production deployment. The codebase is clean, well-architected, and ready for commercial operation.'
    ),
    createTable(
      ['Handover Milestone', 'Deliverable Status', 'Verification Notes'],
      [
        ['Full Source Code & Git History', 'Delivered & Committed', 'Repository clean, zero untracked bugs, strict TS clean.'],
        ['Prisma Database & Schema (93 Models)', 'Verified & Seeded', 'Foreign keys, indexes, and migrations validated.'],
        ['Payment & Razorpay Gateway', 'Operational & Verified', 'UPI, Cards, NetBanking, and Webhook listeners confirmed.'],
        ['Logistics & Multi-Carrier Dispatch', 'Operational & Verified', 'ST Courier default, Shiprocket 1-click & test fallback ready.'],
        ['Customer Returns & Video Streaming', 'Operational & Verified', 'RFC 9110 range streaming & dual auth verified.'],
        ['Full vs Partial Refund Calculation', 'Operational & Verified', '100% full refund vs partial deduction logic active.'],
        ['WhatsApp Baileys Suite', 'Operational & Verified', 'QR pairing, transactional alerts, and campaigns ready.'],
        ['Full Flow UML Use Case Model', 'Incorporated & Verified', 'UML diagram and 10-phase sequence matrix included.'],
        ['Documentation & Handover File (.docx)', 'Generated & Exported', 'Clean executive monochrome document stored in root.'],
      ],
      [30, 25, 45]
    ),
    new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),
    createCallout(
      'Project Handover Complete',
      'This document confirms the formal technical handover of the Kollimalai Arasan E-Commerce Platform. For any further administrative inquiries, refer to the operations runbook in Section 9.'
    )
  );

  // Construct Document with pure white page and black text styling
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 22,
            color: COLOR_BLACK,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: 'Segoe UI',
            size: 30, // 15pt
            bold: true,
            color: COLOR_BLACK,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: 'Segoe UI',
            size: 25, // 12.5pt
            bold: true,
            color: COLOR_BLACK,
          },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            font: 'Segoe UI',
            size: 23, // 11.5pt
            bold: true,
            color: COLOR_BLACK,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const primaryPath = path.resolve(process.cwd(), 'Kollimalai_Arasan_Project_Handover_Documentation.docx');
  const v2Path = path.resolve(process.cwd(), 'Kollimalai_Arasan_Project_Handover_Documentation_Final.docx');
  
  let finalPath = primaryPath;
  try {
    fs.writeFileSync(primaryPath, buffer);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`Primary file locked by an open application. Writing to ${v2Path}`);
      fs.writeFileSync(v2Path, buffer);
      finalPath = v2Path;
    } else {
      throw err;
    }
  }
  console.log(`SUCCESS: Documentation generated at ${finalPath} (${buffer.length} bytes)`);
}

generateDocumentation().catch((err) => {
  console.error('Error generating documentation:', err);
  process.exit(1);
});
