import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { invoiceRepository } from "../repositories/invoice.repository";
import { rupeesInWords } from "../utils/amount-in-words";
import { isSameState, resolveStateCode } from "../utils/state-codes";
import type {
  InvoiceBankDto,
  InvoiceDto,
  InvoiceHsnSummaryDto,
  InvoiceLineDto,
  InvoicePartyDto,
} from "../types";

/**
 * Catalogue prices are stored GST-inclusive (that is what the customer pays at
 * checkout), so the invoice back-calculates the taxable value out of the paid
 * amount. Flip this to false if prices ever become tax-exclusive.
 */
const PRICES_ARE_TAX_INCLUSIVE = true;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const toNumber = (value: unknown) => Number(value ?? 0) || 0;

function readBankDetails(): InvoiceBankDto | null {
  const bankName = process.env.INVOICE_BANK_NAME?.trim();
  if (!bankName) return null;
  return {
    bankName,
    accountNumber: process.env.INVOICE_BANK_ACCOUNT?.trim() || "",
    branch: process.env.INVOICE_BANK_BRANCH?.trim() || "",
    ifsc: process.env.INVOICE_BANK_IFSC?.trim() || "",
  };
}

function formatItemWeight(item: any): string | null {
  const vup = item.variant_unit_price;
  if (!vup) {
    // Graceful fallback for legacy records without variant_unit_price
    const match = item.variant_snapshot?.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|ml|l|ltr)\b/i);
    if (match) {
      const num = match[1];
      const unit =
        match[2].toLowerCase() === "kg"
          ? "Kg"
          : match[2].toLowerCase() === "gm" || match[2].toLowerCase() === "gms"
          ? "g"
          : match[2];
      return `${num} ${unit}`;
    }
    return null;
  }

  const unitVal = Number(vup.unit_value);
  const unitCode = vup.product_units?.code?.trim();
  const unitName = vup.product_units?.name?.trim();

  if (unitVal > 0 && (unitCode || unitName)) {
    const rawUnit = unitCode || unitName;
    const formattedUnit =
      rawUnit.toLowerCase() === "kg" || rawUnit.toLowerCase() === "kilogram"
        ? "Kg"
        : rawUnit.toLowerCase() === "g" ||
          rawUnit.toLowerCase() === "gram" ||
          rawUnit.toLowerCase() === "grams"
        ? "g"
        : rawUnit;
    return `${unitVal} ${formattedUnit}`;
  }

  const weightKg = Number(vup.weight_kg);
  if (weightKg > 0) {
    if (weightKg >= 1) {
      return `${weightKg % 1 === 0 ? weightKg : weightKg.toFixed(2)} Kg`;
    } else {
      return `${Math.round(weightKg * 1000)} g`;
    }
  }

  return null;
}

export const invoiceService = {
  /**
   * @param ownerUserId When given (a customer viewing their own invoice), the
   * order must belong to that user; admins pass nothing and can print any order.
   */
  async getOrderInvoice(
    orderUuid: string,
    ownerUserId?: string,
    options?: { forceAllocate?: boolean }
  ): Promise<InvoiceDto> {
    let ownerId: bigint | undefined;
    if (ownerUserId) {
      const user = await userRepository.findById(ownerUserId);
      if (!user?.internalId) throw ApiError.unauthorized("User not found");
      ownerId = BigInt(user.internalId);
    }

    const [order, company] = await Promise.all([
      invoiceRepository.findOrderForInvoice(orderUuid, ownerId),
      invoiceRepository.getCompany(),
    ]);

    if (!order) throw ApiError.notFound("Order not found");

    // Ensure order has an officially allocated invoice number & issue date
    let invoiceNumber = order.invoiceNumber;
    let invoiceDate = order.invoiceDate;

    if (!invoiceNumber) {
      const seriesCutoffStr = process.env.INVOICE_SERIES_START_DATE;
      const orderDate = order.placed_at ?? order.createdAt ?? new Date();
      const isHistorical =
        Boolean(seriesCutoffStr) &&
        orderDate < new Date(seriesCutoffStr as string);

      if (isHistorical && !options?.forceAllocate) {
        // Historical order issued before new series activation: preserve legacy order number
        invoiceNumber = order.orderNumber;
        invoiceDate = orderDate;
      } else {
        // New order or series active: atomically allocate from official WEB/YY-YY/XXXX series
        const prefix = process.env.INVOICE_SERIES_PREFIX?.trim() || "WEB";
        const issueDate = new Date();
        const allocated = await invoiceRepository.allocateInvoiceNumberForOrder(
          order.id,
          issueDate,
          prefix
        );
        invoiceNumber = allocated.invoiceNumber;
        invoiceDate = allocated.invoiceDate;
      }
    }

    const sellerCompany = {
      companyName: company?.companyName || "Kollimalai Arasan",
      address: company?.address || "Kolli Hills Main Road, Semmedu",
      city: company?.city || "Namakkal",
      pincode: company?.pincode || "637411",
      state: company?.state || "Tamil Nadu",
      gstNumber: company?.gstNumber || "33BXVPR0285H1ZZ",
      panNumber: company?.panNumber || null,
      phone: company?.phone || null,
      email: company?.email || "support@kollimalaiarasan.com",
      logo: company?.logo || null,
    };

    const billing =
      order.address.find((a) => a.type === "billing") ?? order.address[0] ?? null;
    const shipping =
      order.address.find((a) => a.type === "shipping") ?? billing;

    const sellerStateCode = resolveStateCode(sellerCompany.state, sellerCompany.gstNumber);
    const buyerStateCode = resolveStateCode(billing?.state);

    const seller: InvoicePartyDto = {
      name: sellerCompany.companyName,
      addressLines: (sellerCompany.address || "")
        .split(/\r?\n|,/)
        .map((line) => line.trim())
        .filter(Boolean),
      city: sellerCompany.city,
      pincode: sellerCompany.pincode,
      state: sellerCompany.state,
      stateCode: sellerStateCode,
      gstin: sellerCompany.gstNumber,
      pan: sellerCompany.panNumber,
      phone: sellerCompany.phone,
      email: sellerCompany.email,
      logo: sellerCompany.logo,
    };

    const buyer: InvoicePartyDto = {
      name: billing?.full_name || order.user.name,
      addressLines: [billing?.address_line1, billing?.address_line2, billing?.landmark]
        .map((line) => line?.trim())
        .filter((line): line is string => Boolean(line)),
      city: billing?.city ?? null,
      pincode: billing?.pincode ?? null,
      state: billing?.state ?? null,
      stateCode: buyerStateCode,
      gstin: null,
      pan: null,
      phone: billing?.phone || order.user.phone,
      email: order.user.email,
      logo: null,
    };

    const sameState = isSameState(sellerCompany.state, billing?.state);

    const lines: InvoiceLineDto[] = order.items.map((item, index) => {
      const hsn = item.product.product_hsn_codes;
      const slab = hsn?.product_gst_rates;

      const cgstPercent = sameState ? toNumber(slab?.cgst_percent) : 0;
      const sgstPercent = sameState ? toNumber(slab?.sgst_percent) : 0;
      const igstPercent = sameState ? 0 : toNumber(slab?.igst_percent);
      const totalPercent = cgstPercent + sgstPercent + igstPercent;

      // What the customer actually paid for this line, after any offer.
      const paid = toNumber(item.total_price);
      const taxableValue = PRICES_ARE_TAX_INCLUSIVE
        ? round2(paid / (1 + totalPercent / 100))
        : round2(paid);

      const cgstAmount = round2((taxableValue * cgstPercent) / 100);
      const sgstAmount = round2((taxableValue * sgstPercent) / 100);
      const igstAmount = round2((taxableValue * igstPercent) / 100);
      const quantity = item.quantity;
      const weight = formatItemWeight(item);

      return {
        serial: index + 1,
        description: [item.product_name_snapshot, item.variant_snapshot]
          .filter(Boolean)
          .join(" - "),
        hsn: hsn?.code ?? null,
        weight,
        quantity,
        per: "Nos",
        rate: quantity ? round2(taxableValue / quantity) : 0,
        taxableValue,
        cgstPercent,
        cgstAmount,
        sgstPercent,
        sgstAmount,
        igstPercent,
        igstAmount,
        totalTaxAmount: round2(cgstAmount + sgstAmount + igstAmount),
      };
    });

    // One row per HSN/SAC + rate combination, as the GST tax summary requires.
    const summaryMap = new Map<string, InvoiceHsnSummaryDto>();
    for (const line of lines) {
      const hsn = line.hsn || "-";
      const key = `${hsn}|${line.cgstPercent}|${line.sgstPercent}|${line.igstPercent}`;
      const existing = summaryMap.get(key);
      if (existing) {
        existing.taxableValue = round2(existing.taxableValue + line.taxableValue);
        existing.cgstAmount = round2(existing.cgstAmount + line.cgstAmount);
        existing.sgstAmount = round2(existing.sgstAmount + line.sgstAmount);
        existing.igstAmount = round2(existing.igstAmount + line.igstAmount);
        existing.totalTaxAmount = round2(
          existing.totalTaxAmount + line.totalTaxAmount
        );
      } else {
        summaryMap.set(key, {
          hsn,
          taxableValue: line.taxableValue,
          cgstPercent: line.cgstPercent,
          cgstAmount: line.cgstAmount,
          sgstPercent: line.sgstPercent,
          sgstAmount: line.sgstAmount,
          igstPercent: line.igstPercent,
          igstAmount: line.igstAmount,
          totalTaxAmount: line.totalTaxAmount,
        });
      }
    }

    const sum = (pick: (line: InvoiceLineDto) => number) =>
      round2(lines.reduce((acc, line) => acc + pick(line), 0));

    const taxableValue = sum((l) => l.taxableValue);
    const totalCgst = sum((l) => l.cgstAmount);
    const totalSgst = sum((l) => l.sgstAmount);
    const totalIgst = sum((l) => l.igstAmount);
    const totalTaxAmount = round2(totalCgst + totalSgst + totalIgst);
    const deliveryCharge = toNumber(order.shipping_charge);

    const beforeRounding = round2(taxableValue + totalTaxAmount + deliveryCharge);
    const invoiceValue = Math.round(beforeRounding);
    const roundOff = round2(invoiceValue - beforeRounding);

    const finalInvoiceDate =
      invoiceDate ?? order.placed_at ?? order.createdAt ?? new Date();

    return {
      invoiceNumber: invoiceNumber || order.orderNumber,
      invoiceDate: finalInvoiceDate,
      orderNumber: order.orderNumber,
      paymentStatus: order.payment_status,
      dispatchThrough: null,
      destination: shipping?.city ?? null,
      seller,
      buyer,
      sameState,
      lines,
      hsnSummary: Array.from(summaryMap.values()),
      totalQuantity: lines.reduce((acc, line) => acc + line.quantity, 0),
      taxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTaxAmount,
      deliveryCharge,
      discountAmount: toNumber(order.discountAmount),
      roundOff,
      invoiceValue,
      invoiceValueInWords: rupeesInWords(invoiceValue),
      taxAmountInWords: rupeesInWords(totalTaxAmount),
      bank: readBankDetails(),
    };
  },
};
