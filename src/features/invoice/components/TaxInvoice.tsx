import { formatDate, getImageUrl } from "@/lib/utils";
import type { InvoiceDto } from "../types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const percent = (value: number) => `${Number(value).toFixed(2)} %`;


function PartyAddress({
  lines,
  city,
  pincode,
}: {
  lines: string[];
  city: string | null;
  pincode: string | null;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {(city || pincode) && <p>{[city, pincode].filter(Boolean).join(" - ")}</p>}
    </>
  );
}

/** Used until a logo is uploaded in Company Settings. */
const FALLBACK_LOGO = "/logo.svg";

export function TaxInvoice({ invoice }: { invoice: InvoiceDto }) {
  const { seller, buyer, sameState } = invoice;
  const logoSrc = seller.logo ? getImageUrl(seller.logo) : FALLBACK_LOGO;

  return (
    <div className="ti-page">
      <h1 className="ti-title">Tax Invoice</h1>

      {/* Parties + invoice meta */}
      <table className="ti-box ti-head">
        <tbody>
          <tr>
            <td className="ti-party">
              <div className="ti-pad">
                <div className="ti-seller-head">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="ti-logo" src={logoSrc} alt={seller.name} />
                  <div>
                    <p className="ti-name ti-seller-name">{seller.name}</p>
                    <PartyAddress
                      lines={seller.addressLines}
                      city={seller.city}
                      pincode={seller.pincode}
                    />
                    {seller.gstin && <p>GSTIN/UIN: {seller.gstin}</p>}
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
              </div>

              <div className="ti-divider" />

              <div className="ti-pad">
                <p>Buyer (Bill to)</p>
                <p className="ti-name">{buyer.name}</p>
                <PartyAddress
                  lines={buyer.addressLines}
                  city={buyer.city}
                  pincode={buyer.pincode}
                />
                {buyer.phone && <p>Contact: {buyer.phone}</p>}
                {buyer.gstin && <p>GSTIN/UIN: {buyer.gstin}</p>}
                {buyer.state && (
                  <p>
                    State Name: {buyer.state}
                    {buyer.stateCode ? `, Code : ${buyer.stateCode}` : ""}
                  </p>
                )}
              </div>
            </td>

            <td className="ti-meta">
              <table className="ti-meta-table">
                <tbody>
                  <tr>
                    <td>
                      <span className="ti-label">Invoice No.</span>
                      <span className="ti-value">{invoice.invoiceNumber}</span>
                    </td>
                    <td>
                      <span className="ti-label">Dated</span>
                      <span className="ti-value">
                        {formatDate(invoice.invoiceDate, { locale: "en-GB", dateOptions: { day: "2-digit", month: "short", year: "numeric" } })}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ti-label">Order No.</span>
                      <span className="ti-value">{invoice.orderNumber}</span>
                    </td>
                    <td>
                      <span className="ti-label">Payment Status</span>
                      <span className="ti-value ti-upper">
                        {invoice.paymentStatus}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="ti-label">Dispatch Through</span>
                      <span className="ti-value">
                        {invoice.dispatchThrough || " "}
                      </span>
                    </td>
                    <td>
                      <span className="ti-label">Destination</span>
                      <span className="ti-value">
                        {invoice.destination || " "}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items */}
      <table className="ti-box ti-items">
        <thead>
          <tr>
            <td className="c">S.No</td>
            <td>Description of Goods</td>
            <td className="c">HSN/SAC</td>
            <td className="c">Quantity</td>
            <td className="r">Rate</td>
            <td className="c">Per</td>
            <td className="r">Amount</td>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.serial}>
              <td className="c">{line.serial}</td>
              <td className="ti-name">{line.description}</td>
              <td className="c">{line.hsn || "-"}</td>
              <td className="c">{line.quantity} Nos</td>
              <td className="r">{money(line.rate)}</td>
              <td className="c">{line.per}</td>
              <td className="r">{money(line.taxableValue)}</td>
            </tr>
          ))}

          {sameState ? (
            <>
              <tr>
                <td />
                <td className="r">CGST</td>
                <td colSpan={4} />
                <td className="r">{money(invoice.totalCgst)}</td>
              </tr>
              <tr>
                <td />
                <td className="r">SGST</td>
                <td colSpan={4} />
                <td className="r">{money(invoice.totalSgst)}</td>
              </tr>
            </>
          ) : (
            <tr>
              <td />
              <td className="r">IGST</td>
              <td colSpan={4} />
              <td className="r">{money(invoice.totalIgst)}</td>
            </tr>
          )}

          {invoice.deliveryCharge > 0 && (
            <tr>
              <td />
              <td className="r">Delivery Charges</td>
              <td colSpan={4} />
              <td className="r">{money(invoice.deliveryCharge)}</td>
            </tr>
          )}

          {invoice.roundOff !== 0 && (
            <tr>
              <td />
              <td className="r">Round Off</td>
              <td colSpan={4} />
              <td className="r">{money(invoice.roundOff)}</td>
            </tr>
          )}

          <tr className="ti-spacer">
            <td colSpan={7} />
          </tr>

          <tr className="ti-total">
            <td />
            <td className="r">Total</td>
            <td />
            <td className="c">{invoice.totalQuantity} Nos</td>
            <td colSpan={2} />
            <td className="r">&#8377; {money(invoice.invoiceValue)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words */}
      <div className="ti-box ti-pad">
        <div className="ti-row-between">
          <span>Amount Chargeable (in words)</span>
          <span>E &amp; O.E</span>
        </div>
        <p className="ti-name">
          Indian Rupees {invoice.invoiceValueInWords} Only
        </p>
      </div>

      {/* Tax summary */}
      <table className="ti-box ti-tax">
        <thead>
          <tr>
            <td rowSpan={2}>HSN/SAC</td>
            <td rowSpan={2}>Taxable Value</td>
            {sameState ? (
              <>
                <td colSpan={2}>CGST</td>
                <td colSpan={2}>SGST</td>
              </>
            ) : (
              <td colSpan={2}>IGST</td>
            )}
            <td rowSpan={2}>Total Tax Amount</td>
          </tr>
          <tr>
            <td>Rate</td>
            <td>Amount</td>
            {sameState && (
              <>
                <td>Rate</td>
                <td>Amount</td>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {invoice.hsnSummary.map((row, i) => (
            <tr key={`${row.hsn}-${i}`}>
              <td>{row.hsn}</td>
              <td className="r">{money(row.taxableValue)}</td>
              {sameState ? (
                <>
                  <td>{percent(row.cgstPercent)}</td>
                  <td className="r">{money(row.cgstAmount)}</td>
                  <td>{percent(row.sgstPercent)}</td>
                  <td className="r">{money(row.sgstAmount)}</td>
                </>
              ) : (
                <>
                  <td>{percent(row.igstPercent)}</td>
                  <td className="r">{money(row.igstAmount)}</td>
                </>
              )}
              <td className="r">{money(row.totalTaxAmount)}</td>
            </tr>
          ))}
          <tr className="ti-total">
            <td>Total</td>
            <td className="r">{money(invoice.taxableValue)}</td>
            {sameState ? (
              <>
                <td />
                <td className="r">{money(invoice.totalCgst)}</td>
                <td />
                <td className="r">{money(invoice.totalSgst)}</td>
              </>
            ) : (
              <>
                <td />
                <td className="r">{money(invoice.totalIgst)}</td>
              </>
            )}
            <td className="r">{money(invoice.totalTaxAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Declaration + signatory */}
      <div className="ti-box">
        <p className="ti-pad">
          Tax Amount (in words):{" "}
          <span className="ti-name">
            Indian Rupees {invoice.taxAmountInWords} Only
          </span>
        </p>

        <table className="ti-footer">
          <tbody>
            {(seller.pan || invoice.bank) && (
              <tr>
                <td>{seller.pan ? "Company's PAN" : ""}</td>
                <td className="ti-name ti-upper">
                  {seller.pan ? `: ${seller.pan}` : ""}
                </td>
                <td colSpan={2}>{invoice.bank ? "Company Bank Details" : ""}</td>
              </tr>
            )}
            {invoice.bank && (
              <>
                <tr>
                  <td colSpan={2} />
                  <td>Bank Name</td>
                  <td className="ti-name">: {invoice.bank.bankName}</td>
                </tr>
                <tr>
                  <td colSpan={2} />
                  <td>Account Number</td>
                  <td className="ti-name">: {invoice.bank.accountNumber}</td>
                </tr>
                <tr>
                  <td colSpan={2} />
                  <td>Branch &amp; IFSC Code</td>
                  <td className="ti-name">
                    : {invoice.bank.branch} &amp; {invoice.bank.ifsc}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td colSpan={2} className="ti-declaration">
                Declaration
                <br />
                We declare that this invoice shows the actual price of the goods
                described and that all particulars are true and correct.
              </td>
              <td colSpan={2} className="ti-sign">
                <p>for {seller.name}</p>
                <p className="ti-sign-line">Authorised Signatory</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="ti-footer-note">This is a Computer Generated Invoice</p>
    </div>
  );
}
