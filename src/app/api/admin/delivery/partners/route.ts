import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { db } from "@/lib/db/prisma";

export const GET = createApiHandler(
  {
    GET: async () => {
      let partners = await db.delivery_partners.findMany({
        where: {
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          contact_number: true,
          is_active: true,
        },
        orderBy: { id: "asc" },
      });

      // Ensure ST Courier is active and included so standard prepaid dispatches are always available
      const hasStCourier = partners.some(
        (p) =>
          p.code?.toUpperCase() === "ST_COURIER" ||
          p.code?.toUpperCase() === "ST" ||
          p.name?.toLowerCase().includes("st courier")
      );

      if (!hasStCourier) {
        const existingSt = await db.delivery_partners.findFirst({
          where: {
            OR: [
              { code: "ST_COURIER" },
              { code: "ST" },
              { courier_type: "st_courier" },
              { name: { contains: "ST" } },
            ],
          },
        });

        if (existingSt) {
          const updated = await db.delivery_partners.update({
            where: { id: existingSt.id },
            data: { is_active: true },
            select: {
              id: true,
              name: true,
              code: true,
              contact_number: true,
              is_active: true,
            },
          });
          partners.unshift(updated);
        } else {
          const created = await db.delivery_partners.create({
            data: {
              name: "ST Courier",
              code: "ST_COURIER",
              courier_type: "st_courier",
              contact_number: "044-24614488",
              is_active: true,
            },
            select: {
              id: true,
              name: true,
              code: true,
              contact_number: true,
              is_active: true,
            },
          });
          partners.unshift(created);
        }
      }

      // Ensure Shiprocket is active and included so COD and multi-carrier dispatches are always available
      const hasShiprocket = partners.some(
        (p) =>
          p.code?.toUpperCase() === "SHIPROCKET" ||
          p.name?.toLowerCase().includes("shiprocket")
      );

      if (!hasShiprocket) {
        const existingSr = await db.delivery_partners.findFirst({
          where: {
            OR: [
              { code: "SHIPROCKET" },
              { courier_type: "shiprocket" },
              { name: { contains: "Shiprocket" } },
            ],
          },
        });

        if (existingSr) {
          const updated = await db.delivery_partners.update({
            where: { id: existingSr.id },
            data: { is_active: true },
            select: {
              id: true,
              name: true,
              code: true,
              contact_number: true,
              is_active: true,
            },
          });
          partners.push(updated);
        } else {
          const created = await db.delivery_partners.create({
            data: {
              name: "Shiprocket Express",
              code: "SHIPROCKET",
              courier_type: "shiprocket",
              contact_number: "011-41183344",
              is_active: true,
            },
            select: {
              id: true,
              name: true,
              code: true,
              contact_number: true,
              is_active: true,
            },
          });
          partners.push(created);
        }
      }

      const data = partners.map((p) => ({
        id: String(p.id),
        name: p.name,
        code: p.code,
        contactNumber: p.contact_number,
        isActive: p.is_active,
      }));

      return apiSuccess(data, "Delivery partners fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN", "STAFF"],
  }
);
