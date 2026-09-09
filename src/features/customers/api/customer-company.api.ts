import { apiClient, ApiClientError } from "@/lib/api/api-client";
import type { CompanyResponse } from "@/features/company/types";

export const customerCompanyApi = {
  /**
   * Fetch company details for customer storefront
   * Endpoint: GET /api/customer/company
   * Fallback: GET /api/admin/company
   * Returns null if company has not been initialized yet (404)
   */
  async getCompany(): Promise<CompanyResponse | null> {
    try {
      const response = await apiClient.get<CompanyResponse>("/api/customer/company");
      return response.data;
    } catch {
      try {
        const fallback = await apiClient.get<CompanyResponse>("/api/admin/company");
        return fallback.data;
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return null;
        }
        return null;
      }
    }
  },
};
