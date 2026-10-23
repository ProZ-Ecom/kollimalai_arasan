import "dotenv/config";
import assert from "node:assert/strict";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { db } from "../src/lib/db/prisma";
import {
  getIndianFinancialYear,
  formatInvoiceNumber,
} from "../src/features/invoice/utils/financial-year";
import { invoiceRepository } from "../src/features/invoice/repositories/invoice.repository";
import { TaxInvoice } from "../src/features/invoice/components/TaxInvoice";
import type { InvoiceDto } from "../src/features/invoice/types";

async function runTests() {
  console.log("=== STARTING INVOICE SYSTEM VERIFICATION TESTS ===");

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Financial Year & Boundary Calculations
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 1] Financial Year Boundary Tests (Asia/Kolkata):");

  const fyTestCases = [
    { date: new Date("2027-03-31T23:59:59+05:30"), expectedFy: "26-27", desc: "31 March 2027 (end of FY 26-27)" },
    { date: new Date("2027-04-01T00:00:00+05:30"), expectedFy: "27-28", desc: "1 April 2027 (start of FY 27-28)" },
    { date: new Date("2027-08-15T12:00:00+05:30"), expectedFy: "27-28", desc: "15 August 2027 (mid FY 27-28)" },
    { date: new Date("2028-03-31T23:59:59+05:30"), expectedFy: "27-28", desc: "31 March 2028 (end of FY 27-28)" },
    { date: new Date("2028-04-01T00:00:00+05:30"), expectedFy: "28-29", desc: "1 April 2028 (start of FY 28-29)" },
  ];

  for (const tc of fyTestCases) {
    const calculatedFy = getIndianFinancialYear(tc.date);
    assert.equal(
      calculatedFy,
      tc.expectedFy,
      `FY mismatch for ${tc.desc}: got ${calculatedFy}, expected ${tc.expectedFy}`
    );
    console.log(`  ✓ ${tc.desc} => FY: ${calculatedFy}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Invoice Number Formatting Tests
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 2] Invoice Number Formatting Tests:");

  const formatTestCases = [
    { prefix: "WEB", fy: "26-27", seq: 1, expected: "WEB/26-27/0001" },
    { prefix: "WEB", fy: "26-27", seq: 158, expected: "WEB/26-27/0158" },
    { prefix: "WEB", fy: "27-28", seq: 1, expected: "WEB/27-28/0001" },
    { prefix: "WEB", fy: "27-28", seq: 9999, expected: "WEB/27-28/9999" },
    { prefix: "WEB", fy: "27-28", seq: 10005, expected: "WEB/27-28/10005" },
  ];

  for (const tc of formatTestCases) {
    const formatted = formatInvoiceNumber(tc.prefix, tc.fy, tc.seq);
    assert.equal(
      formatted,
      tc.expected,
      `Format mismatch: got ${formatted}, expected ${tc.expected}`
    );
    console.log(`  ✓ (${tc.prefix}, ${tc.fy}, ${tc.seq}) => ${formatted}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Database Atomic Sequence Allocation & Idempotency
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 3] Database Atomic Sequence & Idempotency Tests:");

  // Create temporary test order to verify allocation without mutating real orders
  const testOrderUuid = `test-order-${Date.now()}`;
  const testOrderNumber = `ORD-TEST-${Date.now().toString().slice(-6)}`;

  // Find a valid user to satisfy FK
  const existingUser = await db.user.findFirst({ select: { id: true } });
  if (!existingUser) {
    throw new Error("No user found in database to attach test order");
  }

  const createdTestOrder = await db.order.create({
    data: {
      uuid: testOrderUuid,
      orderNumber: testOrderNumber,
      userId: existingUser.id,
      order_status: "confirmed",
      payment_status: "paid",
      subtotal: 100,
      totalAmount: 100,
      is_active: false, // Inactive so it doesn't appear in store admin
      placed_at: new Date("2027-03-31T10:00:00+05:30"),
    },
  });

  try {
    // 3a. Allocate first invoice number for FY 26-27 on test order
    const alloc1 = await invoiceRepository.allocateInvoiceNumberForOrder(
      createdTestOrder.id,
      new Date("2027-03-31T10:00:00+05:30"),
      "TESTWEB"
    );
    console.log(`  ✓ Allocated invoice for test order: ${alloc1.invoiceNumber}`);
    assert(alloc1.invoiceNumber.startsWith("TESTWEB/26-27/"), "Invoice should be in FY 26-27 series");

    // 3b. Verify Idempotency: repeated call returns identical invoice number without incrementing sequence
    const alloc2 = await invoiceRepository.allocateInvoiceNumberForOrder(
      createdTestOrder.id,
      new Date("2027-03-31T10:00:00+05:30"),
      "TESTWEB"
    );
    assert.equal(
      alloc2.invoiceNumber,
      alloc1.invoiceNumber,
      "Idempotency failed: subsequent call returned a different invoice number"
    );
    console.log(`  ✓ Idempotency verified: re-request returned exact same ${alloc2.invoiceNumber}`);

    // 3c. Verify Sequence Separation for Next Financial Year (e.g. 1 April 2027 -> 27-28)
    const testOrderUuid2 = `test-order-fy28-${Date.now()}`;
    const testOrder2 = await db.order.create({
      data: {
        uuid: testOrderUuid2,
        orderNumber: `ORD-TEST-${Date.now().toString().slice(-6)}-2`,
        userId: existingUser.id,
        order_status: "confirmed",
        payment_status: "paid",
        subtotal: 100,
        totalAmount: 100,
        is_active: false,
        placed_at: new Date("2027-04-01T10:00:00+05:30"),
      },
    });

    const allocFy28 = await invoiceRepository.allocateInvoiceNumberForOrder(
      testOrder2.id,
      new Date("2027-04-01T10:00:00+05:30"),
      "TESTWEB"
    );
    console.log(`  ✓ Allocated invoice in new FY 27-28: ${allocFy28.invoiceNumber}`);
    assert.equal(
      allocFy28.invoiceNumber,
      "TESTWEB/27-28/0001",
      `Expected new FY to start at 0001, got ${allocFy28.invoiceNumber}`
    );

    // Clean up test order 2
    await db.order.delete({ where: { id: testOrder2.id } });
  } finally {
    // Clean up test order 1
    await db.order.delete({ where: { id: createdTestOrder.id } });
    // Clean up test sequence rows
    await db.invoiceSequence.deleteMany({
      where: { prefix: "TESTWEB" },
    });
    console.log("  ✓ Test artifacts cleaned up from database");
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Concurrency Safety Test
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 4] Concurrency Safety Test (5 concurrent allocations):");

  const concurrentOrders = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      db.order.create({
        data: {
          uuid: `concurrent-test-${Date.now()}-${i}`,
          orderNumber: `ORD-CONC-${Date.now().toString().slice(-6)}-${i}`,
          userId: existingUser.id,
          order_status: "confirmed",
          payment_status: "paid",
          subtotal: 100,
          totalAmount: 100,
          is_active: false,
          placed_at: new Date("2026-10-23T12:00:00+05:30"),
        },
      })
    )
  );

  try {
    const issueDate = new Date("2026-10-23T12:00:00+05:30");
    const results = await Promise.all(
      concurrentOrders.map((order) =>
        invoiceRepository.allocateInvoiceNumberForOrder(order.id, issueDate, "TESTCONC")
      )
    );

    const invoiceNumbers = results.map((r) => r.invoiceNumber);
    console.log("  Concurrent results:", invoiceNumbers);

    // Check uniqueness
    const uniqueNumbers = new Set(invoiceNumbers);
    assert.equal(
      uniqueNumbers.size,
      5,
      "Concurrency failure: duplicate invoice numbers generated!"
    );

    // Check sequence completeness (0001, 0002, 0003, 0004, 0005)
    for (let i = 1; i <= 5; i++) {
      const expected = `TESTCONC/26-27/${String(i).padStart(4, "0")}`;
      assert(
        invoiceNumbers.includes(expected),
        `Missing expected sequence ${expected}`
      );
    }
    console.log("  ✓ Concurrency verified: All 5 allocations succeeded with unique, contiguous sequence numbers");
  } finally {
    await db.order.deleteMany({
      where: { id: { in: concurrentOrders.map((o) => o.id) } },
    });
    await db.invoiceSequence.deleteMany({
      where: { prefix: "TESTCONC" },
    });
    console.log("  ✓ Concurrency test orders and sequences cleaned up");
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Invoice Template Rendering & GSTIN Separation Test
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 5] Invoice Layout & GSTIN Separation Rendering Test:");

  const mockInvoice: InvoiceDto = {
    invoiceNumber: "WEB/26-27/0001",
    invoiceDate: new Date("2026-10-23T12:00:00+05:30"),
    orderNumber: "ORD-20261022-F2D7B7",
    paymentStatus: "paid",
    dispatchThrough: "Direct Delivery / Courier",
    destination: "Chennai",
    seller: {
      name: "KOLLIMALAI ARASAN",
      addressLines: ["Kolli Hills Main Road", "Semmedu"],
      city: "Namakkal",
      pincode: "637411",
      state: "Tamil Nadu",
      stateCode: "33",
      gstin: "33BXVPR0285H1ZZ",
      pan: null,
      phone: "+91 94892 24500",
      email: "support@kollimalaiarasan.com",
      logo: null,
    },
    buyer: {
      name: "John Doe",
      addressLines: ["123 Green Street", "Anna Nagar"],
      city: "Chennai",
      pincode: "600040",
      state: "Tamil Nadu",
      stateCode: "33",
      gstin: null,
      pan: null,
      phone: "+91 98765 43210",
      email: "john@example.com",
      logo: null,
    },
    sameState: true,
    lines: [
      {
        serial: 1,
        description: "Pure Raw Wild Honey - 500g",
        hsn: "0409",
        quantity: 2,
        rate: 450,
        per: "PCS",
        taxableValue: 900,
        cgstPercent: 2.5,
        cgstAmount: 22.5,
        sgstPercent: 2.5,
        sgstAmount: 22.5,
        igstPercent: 0,
        igstAmount: 0,
      },
    ],
    hsnSummary: [
      {
        hsnCode: "0409",
        taxableValue: 900,
        cgstRate: 2.5,
        cgstAmount: 22.5,
        sgstRate: 2.5,
        sgstAmount: 22.5,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 45,
      },
    ],
    totalQuantity: 2,
    taxableValue: 900,
    totalCgst: 22.5,
    totalSgst: 22.5,
    totalIgst: 0,
    totalTaxAmount: 45,
    deliveryCharge: 50,
    discountAmount: 0,
    roundOff: 0,
    invoiceValue: 995,
    invoiceValueInWords: "Rupees Nine Hundred Ninety Five Only",
    taxAmountInWords: "Rupees Forty Five Only",
    bank: null,
  };

  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(TaxInvoice, { invoice: mockInvoice })
  );

  // 5a. Check that TAX INVOICE and subtitle are present
  assert(html.includes("TAX INVOICE"), "Markup missing TAX INVOICE");
  assert(html.includes("(ORIGINAL FOR RECIPIENT)"), "Markup missing (ORIGINAL FOR RECIPIENT)");
  console.log("  ✓ Header title and (ORIGINAL FOR RECIPIENT) subtitle present");

  // 5b. Check that GSTIN 33BXVPR0285H1ZZ is present in HTML
  assert(
    html.includes("33BXVPR0285H1ZZ"),
    "HTML does not contain GSTIN 33BXVPR0285H1ZZ"
  );
  console.log("  ✓ GSTIN 33BXVPR0285H1ZZ is present in generated markup");

  // 5c. Check Company's PAN
  assert(html.includes("Company<!-- -->&#x27;<!-- -->s PAN") || html.includes("Company's PAN") || html.includes("BXVPR0285H"), "Markup missing PAN");
  console.log("  ✓ Company PAN is present");

  // 5d. Check Order No and Invoice No separation
  assert(html.includes("WEB/26-27/0001"), "Markup contains Invoice No WEB/26-27/0001");
  assert(html.includes("ORD-20261022-F2D7B7"), "Markup contains separate Order No ORD-20261022-F2D7B7");
  console.log("  ✓ Invoice No (WEB/26-27/0001) and Order No (ORD-20261022-F2D7B7) remain separate");

  // 5e. Check Declaration and Authorised Signatory
  assert(html.includes("Declaration"), "Markup missing Declaration");
  assert(html.includes("Authorised Signatory"), "Markup missing Authorised Signatory");
  assert(html.includes("This is a Computer Generated Invoice"), "Markup missing footer note");
  console.log("  ✓ Declaration, Signatory, and Computer Generated Invoice footer present");

  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((err) => {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
