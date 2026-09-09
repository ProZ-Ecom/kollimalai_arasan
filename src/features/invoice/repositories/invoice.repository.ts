import { db } from "@/lib/db/prisma";

export const invoiceRepository = {
  /**
   * Loads everything a GST tax invoice needs for one order: the line items with
   * their HSN code and GST slab, plus the billing/shipping addresses.
   */
  async findOrderForInvoice(uuid: string, ownerId?: bigint) {
    return db.order.findFirst({
      where: {
        uuid,
        is_active: true,
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
};
