import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { UpdateCompanyInput } from "../types";

const companyInclude = Prisma.validator<Prisma.CompanyInclude>()({
  users_companies_created_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
  users_companies_updated_byTousers: {
    select: {
      uuid: true,
      name: true,
      email: true,
    },
  },
});

export const companyRepository = {
  async getCompany() {
    return db.company.findFirst({
      orderBy: { id: "asc" },
      include: companyInclude,
    });
  },

  async createCompany(data: UpdateCompanyInput, adminId?: bigint | null) {
    const uuid = crypto.randomUUID();
    return db.company.create({
      data: {
        uuid,
        companyName: data.companyName || "Rithu Snacks",
        logo: data.logo ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        country: data.country ?? "India",
        pincode: data.pincode ?? null,
        gstNumber: data.gstNumber ?? null,
        panNumber: data.panNumber ?? null,
        website: data.website ?? null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        ...(adminId ? { createdBy: adminId, updatedBy: adminId } : {}),
      },
      include: companyInclude,
    });
  },

  async updateCompany(
    id: bigint,
    data: UpdateCompanyInput,
    adminId?: bigint | null
  ) {
    const updateData: Prisma.CompanyUpdateInput = {};

    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber;
    if (data.panNumber !== undefined) updateData.panNumber = data.panNumber;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (adminId) {
      updateData.users_companies_updated_byTousers = {
        connect: { id: adminId },
      };
    }

    return db.company.update({
      where: { id },
      data: updateData,
      include: companyInclude,
    });
  },

  async updateCompanyLogo(
    id: bigint,
    logoPath: string,
    adminId?: bigint | null
  ) {
    const updateData: Prisma.CompanyUpdateInput = {
      logo: logoPath,
    };

    if (adminId) {
      updateData.users_companies_updated_byTousers = {
        connect: { id: adminId },
      };
    }

    return db.company.update({
      where: { id },
      data: updateData,
      include: companyInclude,
    });
  },
};
