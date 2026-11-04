import { formatDate, getImageUrl } from "@/lib/utils";
import type { InvoiceDto } from "../types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const percent = (value: number) => `${Number(value).toFixed(2)} %`;

function formatAddressLines(
  lines: string[],
  city: string | null,
  pincode: string | null
): string[] {
  const filtered = (lines || [])
    .map((l) => l?.trim())
    .filter((l): l is string => Boolean(l))
    .filter(
      (l) =>
        !l.toLowerCase().includes("gstin") &&
        !l.includes("33BXVPR0285H1ZZ")
    );

  // Group multiple comma fragments into 2 readable lines if fragmented
  let formatted: string[] = [];
  if (filtered.length > 3) {
    const mid = Math.ceil(filtered.length / 2);
    formatted = [
      filtered.slice(0, mid).join(", "),
      filtered.slice(mid).join(", "),
    ];
  } else {
    formatted = [...filtered];
  }

  // Ensure city and pincode are represented without duplicating if already in address
  const combined = formatted.join(" ").toLowerCase();
  const cityStr = city?.toLowerCase();
  const pinStr = pincode?.trim();

  const missingCity = Boolean(cityStr && !combined.includes(cityStr));
  const missingPin = Boolean(pinStr && !combined.includes(pinStr));

  if (missingCity || missingPin) {
    const extra = [city, pincode].filter(Boolean).join(" - ");
    if (extra) formatted.push(extra);
  }

  return formatted;
}

/** Fallback logo if company hasn't uploaded one */
const FALLBACK_LOGO = "/logos/logo.svg";

export function TaxInvoice({ invoice }: { invoice: InvoiceDto }) {
  const { seller, buyer, sameState } = invoice;
  const logoSrc =
    seller.logo && !seller.logo.includes("snack")
      ? getImageUrl(seller.logo)
      : FALLBACK_LOGO;

  // Derive PAN from seller PAN or from the 10-char PAN slice of GSTIN (e.g., 33BXVPR0285H1ZZ -> BXVPR0285H)
  const panNumber =
    seller.pan ||
    (seller.gstin && seller.gstin.length >= 12
      ? seller.gstin.slice(2, 12)
      : "BXVPR0285H");

  // Ensure clean, human-readable address formatting without duplicates
  const sellerAddressLines = formatAddressLines(
    seller.addressLines,
    seller.city,
    seller.pincode
  );

  const buyerAddressLines = formatAddressLines(
    buyer.addressLines,
    buyer.city,
    buyer.pincode
  );

  const destinationText =
    invoice.destination ||
    buyer.city ||
    buyer.state ||
    "Tamil Nadu";

  // Compact spacer rows matching reference PDF visual balance without excess dead space
  const targetRows = Math.min(3, Math.max(invoice.lines.length, 2));
  const blankRowsCount = Math.max(0, targetRows - invoice.lines.length);

  return (
    <div className="ti-page">
      {/* Document Header */}
      <div className="ti-header-section">
        <h1 className="ti-doc-title">TAX INVOICE</h1>
        <p className="ti-doc-subtitle">(ORIGINAL FOR RECIPIENT)</p>
      </div>

      {/* Top Box: Parties & Metadata Grid (2-row structure eliminating dead space below dispatch) */}
      <table className="ti-box ti-top-grid">
        <tbody>
          {/* Row 1: Seller Block on Left, Invoice Metadata on Right */}
          <tr>
            <td className="ti-seller-col">
              <div className="ti-seller-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ti-seller-logo" src={logoSrc} alt={seller.name} />
                <div className="ti-seller-info">
                  <p className="ti-brand-name">{seller.name || "KOLLIMALAI ARASAN"}</p>
                  {sellerAddressLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {seller.state && (
                    <p>
                      State Name: {seller.state}
                      {seller.stateCode ? `, Code : ${seller.stateCode}` : ""}
                    </p>
                  )}
                  {seller.phone && <p>Contact: {seller.phone}</p>}
                  {seller.email && <p>E-Mail: {seller.email}</p>}
                </div>
              </div>
            </td>
            <td className="ti-meta-top-col" colSpan={2}>
              <table className="ti-meta-subtable">
                <tbody>
                  <tr>
                    <td>
                      <span className="ti-meta-label">Invoice No.</span>
                      <span className="ti-meta-val">{invoice.invoiceNumber}</span>
                    </td>
                    <td>
                      <span className="ti-meta-label">Dated</span>
                      <span className="ti-meta-val">
                        {formatDate(invoice.invoiceDate, { style: "medium" })}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ti-meta-label">GSTIN</span>
                      <span className="ti-meta-val">{seller.gstin || "33BXVPR0285H1ZZ"}</span>
                    </td>
                    <td>
                      <span className="ti-meta-label">Order No.</span>
                      <span className="ti-meta-val">{invoice.orderNumber}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ti-meta-label">Payment Status</span>
                      <span className="ti-meta-val ti-upper">{invoice.paymentStatus}</span>
                    </td>
                    <td>
                      <span className="ti-meta-label">Destination</span>
                      <span className="ti-meta-val">{destinationText}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Row 2: Buyer Block on Left, Dispatch & Terms on Right as direct cells */}
          <tr>
            <td className="ti-buyer-col">
              <div className="ti-buyer-block">
                <p className="ti-buyer-heading">Buyer (Bill to)</p>
                <p className="ti-buyer-name">{buyer.name}</p>
                {buyerAddressLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {buyer.phone && <p>Contact: {buyer.phone}</p>}
                {buyer.state && (
                  <p>
                    State Name: {buyer.state}
                    {buyer.stateCode ? `, Code : ${buyer.stateCode}` : ""}
                  </p>
                )}
                {buyer.gstin && <p>GSTIN/UIN: {buyer.gstin}</p>}
              </div>
            </td>
            <td className="ti-dispatch-col">
              <span className="ti-meta-label">Dispatch Through</span>
              <span className="ti-meta-val">
                {invoice.dispatchThrough || "Direct Delivery / Courier"}
              </span>
            </td>
            <td className="ti-terms-col">
              <span className="ti-meta-label">Terms of Delivery</span>
              <span className="ti-meta-val">Standard Delivery</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table className="ti-box ti-items-table">
        <thead>
          <tr>
            <th style={{ width: "4%" }} className="c">Sl.<br />No</th>
            <th style={{ width: "31%" }} className="l">Description</th>
            <th style={{ width: "7%" }} className="c">Weight</th>
            <th style={{ width: "10%" }} className="r">Unit Price</th>
            <th style={{ width: "5%" }} className="c">Qty</th>
            <th style={{ width: "10%" }} className="r">Net Amount</th>
            <th style={{ width: "6%" }} className="c">Tax<br />Rate</th>
            <th style={{ width: "10%" }} className="c">Tax Type</th>
            <th style={{ width: "8%" }} className="r">Tax Amount</th>
            <th style={{ width: "9%" }} className="r">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => {
            const taxRatePercent = line.cgstPercent + line.sgstPercent + line.igstPercent;
            const taxTypeLabel = sameState ? "CGST + SGST" : "IGST";
            const lineTotal = line.taxableValue + line.totalTaxAmount;
            return (
              <tr key={line.serial} className="ti-item-row">
                <td className="c">{line.serial}</td>
                <td className="l">
                  <span className="ti-item-desc">{line.description}</span>
                  <span className="ti-item-hsn">HSN: {line.hsn || "-"}</span>
                </td>
                <td className="c">{line.weight || "-"}</td>
                <td className="r">&#8377;{money(line.rate)}</td>
                <td className="c">{line.quantity}</td>
                <td className="r">&#8377;{money(line.taxableValue)}</td>
                <td className="c">{taxRatePercent}%</td>
                <td className="c">{taxTypeLabel}</td>
                <td className="r">&#8377;{money(line.totalTaxAmount)}</td>
                <td className="r">&#8377;{money(lineTotal)}</td>
              </tr>
            );
          })}

          {/* Delivery Charges row if applicable */}
          {invoice.deliveryCharge > 0 && (
            <tr className="ti-item-row">
              <td className="c">{invoice.lines.length + 1}</td>
              <td className="l">
                <span className="ti-item-desc">Delivery Charges / Shipping</span>
              </td>
              <td className="c">-</td>
              <td className="r">&#8377;{money(invoice.deliveryCharge)}</td>
              <td className="c">1</td>
              <td className="r">&#8377;{money(invoice.deliveryCharge)}</td>
              <td className="c">0%</td>
              <td className="c">-</td>
              <td className="r">&#8377;0.00</td>
              <td className="r">&#8377;{money(invoice.deliveryCharge)}</td>
            </tr>
          )}

          {/* Spacer rows matching the screenshot visual height */}
          {Array.from({ length: blankRowsCount }).map((_, idx) => (
            <tr key={`blank-${idx}`} className="ti-blank-row">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}

          {/* Table Total Row */}
          <tr className="ti-total-row">
            <td colSpan={4} className="r ti-total-label">Total</td>
            <td className="c">{invoice.totalQuantity}</td>
            <td className="r">&#8377;{money(invoice.taxableValue + invoice.deliveryCharge)}</td>
            <td className="c"></td>
            <td className="c"></td>
            <td className="r">&#8377;{money(invoice.totalTaxAmount)}</td>
            <td className="r ti-grand-total">&#8377;{money(invoice.invoiceValue)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount Chargeable (in words) Box */}
      <div className="ti-box ti-amount-words-box">
        <div className="ti-words-top">
          <span className="ti-words-title">Amount Chargeable (in words)</span>
          <span className="ti-eoe">E &amp; O.E</span>
        </div>
        <p className="ti-words-bold">
          Indian Rupees {invoice.invoiceValueInWords} Only
        </p>
      </div>

      {/* HSN / Tax Breakdown Summary Table */}
      <table className="ti-box ti-hsn-table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "16%" }} className="c">HSN/SAC</th>
            <th rowSpan={2} style={{ width: "16%" }} className="c">Taxable Value</th>
            {sameState ? (
              <>
                <th colSpan={2} style={{ width: "24%" }} className="c">CGST</th>
                <th colSpan={2} style={{ width: "24%" }} className="c">SGST</th>
              </>
            ) : (
              <th colSpan={2} style={{ width: "48%" }} className="c">IGST</th>
            )}
            <th rowSpan={2} style={{ width: "20%" }} className="c">Total Tax Amount</th>
          </tr>
          <tr>
            {sameState ? (
              <>
                <th className="c">Rate</th>
                <th className="c">Amount</th>
                <th className="c">Rate</th>
                <th className="c">Amount</th>
              </>
            ) : (
              <>
                <th className="c">Rate</th>
                <th className="c">Amount</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {invoice.hsnSummary.map((row, i) => (
            <tr key={`${row.hsn}-${i}`}>
              <td className="c">{row.hsn || "-"}</td>
              <td className="r">{money(row.taxableValue)}</td>
              {sameState ? (
                <>
                  <td className="c">{percent(row.cgstPercent)}</td>
                  <td className="r">{money(row.cgstAmount)}</td>
                  <td className="c">{percent(row.sgstPercent)}</td>
                  <td className="r">{money(row.sgstAmount)}</td>
                </>
              ) : (
                <>
                  <td className="c">{percent(row.igstPercent)}</td>
                  <td className="r">{money(row.igstAmount)}</td>
                </>
              )}
              <td className="r">{money(row.totalTaxAmount)}</td>
            </tr>
          ))}
          <tr className="ti-total-row">
            <td className="c ti-total-label">Total</td>
            <td className="r">{money(invoice.taxableValue)}</td>
            {sameState ? (
              <>
                <td className="c"></td>
                <td className="r">{money(invoice.totalCgst)}</td>
                <td className="c"></td>
                <td className="r">{money(invoice.totalSgst)}</td>
              </>
            ) : (
              <>
                <td className="c"></td>
                <td className="r">{money(invoice.totalIgst)}</td>
              </>
            )}
            <td className="r">{money(invoice.totalTaxAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Tax in words and Company's PAN */}
      <div className="ti-box ti-tax-words-box">
        <p className="ti-tax-words-line">
          Tax Amount (in words): <strong>Indian Rupees {invoice.taxAmountInWords} Only</strong>
        </p>
        <p className="ti-pan-line">
          Company&apos;s PAN <span className="ti-pan-val">: {panNumber}</span>
        </p>
      </div>

      {/* Declaration & Signature Box */}
      <div className="ti-box ti-declaration-box">
        <div className="ti-declaration-col">
          <p className="ti-declaration-title">Declaration</p>
          <p className="ti-declaration-text">
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </p>
        </div>
        <div className="ti-signatory-col">
          <p className="ti-sign-for">for {seller.name || "Kollimalai Arasan"}</p>
          <div className="ti-sign-space" />
          <p className="ti-sign-label">Authorised Signatory</p>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <p className="ti-footer-note">This is a Computer Generated Invoice</p>
    </div>
  );
}
