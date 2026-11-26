import { db } from "@/lib/db/prisma";

export interface ReportOption {
  value: string;
  label: string;
}

export interface ReportOptions {
  categories: ReportOption[];
  brands: ReportOption[];
  coupons: ReportOption[];
  paymentMethods: ReportOption[];
  deliveryPartners: ReportOption[];
}

/**
 * Loads all active filter dropdown options for the report pages in a single query batch.
 * Uses public UUID/code identifiers rather than internal database BigInt IDs where available.
 */
export const reportOptionsService = {
  async all(): Promise<ReportOptions> {
    const [categories, brands, coupons, paymentMethods, deliveryPartners] =
      await Promise.all([
        db.productCategory.findMany({
          where: { isActive: true, deleted_at: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { uuid: true, id: true, name: true, parentId: true },
        }),
        db.productBrand.findMany({
          where: { isActive: true, deleted_at: null },
          orderBy: { name: "asc" },
          select: { uuid: true, id: true, name: true },
        }),
        db.coupon.findMany({
          orderBy: { code: "asc" },
          select: { uuid: true, id: true, code: true, isActive: true },
        }),
        db.payment_methods.findMany({
          where: { is_active: true },
          orderBy: { name: "asc" },
          select: { id: true, code: true, name: true },
        }),
        db.delivery_partners.findMany({
          where: { is_active: true },
          orderBy: { name: "asc" },
          select: { id: true, code: true, name: true },
        }),
      ]);

    const nameById = new Map(categories.map((c) => [String(c.id), c.name]));
    const duplicated = new Set(
      categories
        .map((c) => c.name)
        .filter((name, i, all) => all.indexOf(name) !== i)
    );

    return {
      categories: categories.map((c) => {
        const parent = c.parentId != null ? nameById.get(String(c.parentId)) : null;
        return {
          value: c.uuid ?? String(c.id),
          label: duplicated.has(c.name) && parent ? `${parent} › ${c.name}` : c.name,
        };
      }),
      brands: brands.map((b) => ({
        value: b.uuid ?? String(b.id),
        label: b.name,
      })),
      coupons: coupons.map((c) => ({
        value: c.uuid ?? c.code,
        label: c.isActive ? c.code : `${c.code} (Inactive)`,
      })),
      paymentMethods: paymentMethods.map((m) => ({
        value: m.code,
        label: m.name,
      })),
      deliveryPartners: deliveryPartners.map((d) => ({
        value: d.code,
        label: d.name,
      })),
    };
  },
};
