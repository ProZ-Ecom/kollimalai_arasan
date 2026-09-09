export interface InvoicePartyDto {
  name: string;
  addressLines: string[];
  city: string | null;
  pincode: string | null;
  state: string | null;
  stateCode: string | null;
  gstin: string | null;
  pan: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

export interface InvoiceLineDto {
  serial: number;
  description: string;
  hsn: string | null;
  quantity: number;
  per: string;
  /** Rate per unit, exclusive of GST. */
  rate: number;
  /** Line taxable value (quantity x rate), exclusive of GST. */
  taxableValue: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface InvoiceHsnSummaryDto {
  hsn: string;
  taxableValue: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface InvoiceBankDto {
  bankName: string;
  accountNumber: string;
  branch: string;
  ifsc: string;
}

export interface InvoiceDto {
  invoiceNumber: string;
  invoiceDate: Date;
  orderNumber: string;
  paymentStatus: string;
  dispatchThrough: string | null;
  destination: string | null;
  seller: InvoicePartyDto;
  buyer: InvoicePartyDto;
  sameState: boolean;
  lines: InvoiceLineDto[];
  hsnSummary: InvoiceHsnSummaryDto[];
  totalQuantity: number;
  taxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  roundOff: number;
  invoiceValue: number;
  invoiceValueInWords: string;
  taxAmountInWords: string;
  bank: InvoiceBankDto | null;
}
