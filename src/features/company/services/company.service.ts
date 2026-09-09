import { ApiError } from "@/lib/api/api-error";
import { companyRepository } from "../repositories/company.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import { uploadService } from "@/features/uploads/services/upload.service";
import type { CompanyResponse, UpdateCompanyInput } from "../types";

function formatCompanyResponse(c: any): CompanyResponse {
  return {
    id: c.uuid,
    companyName: c.companyName,
    logo: c.logo ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    country: c.country ?? "India",
    pincode: c.pincode ?? null,
    gstNumber: c.gstNumber ?? null,
    panNumber: c.panNumber ?? null,
    website: c.website ?? null,
    isActive: Boolean(c.isActive),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    createdBy: c.users_companies_created_byTousers?.uuid || null,
    updatedBy: c.users_companies_updated_byTousers?.uuid || null,
  };
}

export const companyService = {
  async getCompany(): Promise<CompanyResponse> {
    const company = await companyRepository.getCompany();
    if (!company) {
      throw ApiError.notFound("Company settings not found");
    }
    return formatCompanyResponse(company);
  },

  async updateCompany(
    data: UpdateCompanyInput,
    adminEmail?: string | null
  ): Promise<CompanyResponse> {
    let adminId: bigint | null = null;
    if (adminEmail) {
      const admin = await userRepository.findByEmail(adminEmail);
      if (admin && admin.internalId) adminId = BigInt(admin.internalId);
    }

    const existing = await companyRepository.getCompany();

    let result;
    if (existing) {
      result = await companyRepository.updateCompany(existing.id, data, adminId);
    } else {
      result = await companyRepository.createCompany(data, adminId);
    }

    return formatCompanyResponse(result);
  },

  async uploadLogo(
    formData: FormData,
    adminEmail?: string | null
  ): Promise<{ logo: string; company: CompanyResponse }> {
    // Force folder to "company"
    formData.set("folder", "company");

    const uploadResult = await uploadService.handleSingleFileUpload(formData);
    const newLogoPath = uploadResult.path;

    let adminId: bigint | null = null;
    if (adminEmail) {
      const admin = await userRepository.findByEmail(adminEmail);
      if (admin && admin.internalId) adminId = BigInt(admin.internalId);
    }

    const existing = await companyRepository.getCompany();

    let updatedCompany;
    if (existing) {
      // Clean up previous logo if it existed
      if (existing.logo && existing.logo !== newLogoPath) {
        await uploadService.deleteUploadedFile(existing.logo, "company");
      }
      updatedCompany = await companyRepository.updateCompanyLogo(
        existing.id,
        newLogoPath,
        adminId
      );
    } else {
      updatedCompany = await companyRepository.createCompany(
        {
          companyName: "Rithu Snacks",
          logo: newLogoPath,
        },
        adminId
      );
    }

    return {
      logo: newLogoPath,
      company: formatCompanyResponse(updatedCompany),
    };
  },
};
