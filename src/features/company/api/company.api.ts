import { apiClient, ApiClientError } from "@/lib/api/api-client";
import type { CompanyResponse, UpdateCompanyInput } from "../types";

export const companyApi = {
  /**
   * Fetch company details for admin settings
   * Postman: GET /api/admin/company
   * Returns null if company has not been initialized yet (404)
   */
  async getCompany(): Promise<CompanyResponse | null> {
    try {
      const response = await apiClient.get<CompanyResponse>("/api/admin/company");
      return response.data;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        return null;
      }
      return null;
    }
  },

  /**
   * Update company details
   * Postman: PUT /api/admin/company
   */
  async updateCompany(data: UpdateCompanyInput): Promise<CompanyResponse> {
    const response = await apiClient.put<CompanyResponse>(
      "/api/admin/company",
      data
    );
    return response.data;
  },

  /**
   * Upload company logo
   * Postman: POST /api/admin/company/logo
   */
  async uploadLogo(file: File): Promise<{ logo: string; company: CompanyResponse }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{
      logo: string;
      company: CompanyResponse;
    }>("/api/admin/company/logo", formData);

    return response.data;
  },
};
