import { db } from "@/lib/db/prisma";
import {
  getIndianFinancialYear,
  formatInvoiceNumber,
} from "../utils/financial-year";

export const invoiceRepository = {
  /**
   * Loads everything a GST tax invoice needs for one order: the line items with
   * their HSN code and GST slab, plus the billing/shipping addresses.
   */
  async findOrderForInvoice(orderIdentifier: string, ownerId?: bigint) {
    if (!orderIdentifier || orderIdentifier === "undefined" || orderIdentifier === "null") {
      return null;
    }
    const isNumeric = /^\d+$/.test(orderIdentifier);
    return db.order.findFirst({
      where: {
        is_active: true,
        OR: [
          { uuid: orderIdentifier },
          { orderNumber: orderIdentifier },
          ...(isNumeric ? [{ id: BigInt(orderIdentifier) }] : []),
        ],
        ...(ownerId ? { userId: ownerId } : {}),
      },
      include: {
        user: {
          select: { name: true, email: true, phone: true, cust_id: true },
        },
        address: true,
        items: {
          where: { is_active: true },
          orderBy: { id: "asc" },
          include: {
            variant_unit_price: {
              select: {
                unit_value: true,
                weight_kg: true,
                product_units: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
            product: {
              select: {
                name: true,
                product_hsn_codes: {
                  select: {
                    code: true,
                    product_gst_rates: {
                      select: {
                        cgst_percent: true,
                        sgst_percent: true,
                        igst_percent: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  async getCompany() {
    return db.company.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
  },

  /**
   * Atomically allocates a sequential invoice number for an order in a database transaction.
   * If the order already has an assigned invoice number, it returns the existing one without advancing the sequence.
   */
  async allocateInvoiceNumberForOrder(
    orderId: bigint,
    issueDate: Date = new Date(),
    prefix = "WEB"
  ): Promise<{ invoiceNumber: string; invoiceDate: Date }> {
    return db.$transaction(async (tx) => {
      // 1. Re-check order with fresh read inside transaction to prevent concurrent duplicate allocation
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          placed_at: true,
          createdAt: true,
        },
      });

      if (!existing) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      if (existing.invoiceNumber) {
        return {
          invoiceNumber: existing.invoiceNumber,
          invoiceDate:
            existing.invoiceDate ||
            existing.placed_at ||
            existing.createdAt ||
            issueDate,
        };
      }

      // 2. Determine Financial Year from actual invoice issue date
      const financialYear = getIndianFinancialYear(issueDate);

      // 3. Atomically initialize sequence row if not present, then lock and increment
      // Ensure seed is at least the highest existing sequence in orders to prevent duplicate collisions
      const maxRows = await tx.$queryRawUnsafe<Array<{ max_num: number | bigint | null }>>(
        `SELECT MAX(CAST(SUBSTRING_INDEX(invoice_number, '/', -1) AS UNSIGNED)) as max_num
         FROM orders
         WHERE invoice_number LIKE CONCAT(?, '/', ?, '/%')`,
        prefix,
        financialYear
      );
      const initialSeed = Number(maxRows[0]?.max_num ?? 0);

      await tx.$executeRawUnsafe(
        `INSERT INTO invoice_sequences (prefix, financial_year, last_number, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE id = id`,
        prefix,
        financialYear,
        initialSeed
      );

      const seqRows = await tx.$queryRawUnsafe<
        Array<{ id: bigint; last_number: number }>
      >(
        `SELECT id, last_number FROM invoice_sequences WHERE prefix = ? AND financial_year = ? FOR UPDATE`,
        prefix,
        financialYear
      );

      const row = seqRows[0];
      const currentLast = Math.max(Number(row.last_number), initialSeed);
      const nextSeq = currentLast + 1;
      await tx.$executeRawUnsafe(
        `UPDATE invoice_sequences SET last_number = ?, updated_at = NOW() WHERE id = ?`,
        nextSeq,
        row.id
      );

      const invoiceNumber = formatInvoiceNumber(prefix, financialYear, nextSeq);

      // 4. Update the order with allocated invoice number and invoice date
      await tx.order.update({
        where: { id: orderId },
        data: {
          invoiceNumber,
          invoiceDate: issueDate,
        },
      });

      return {
        invoiceNumber,
        invoiceDate: issueDate,
      };
    });
  },
};
