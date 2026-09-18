import { apiClient } from "@/lib/api/api-client";
import type { CustomerProfileResponse } from "../types";
import type { UpdateCustomerProfileInput } from "../validations/customer-profile.schema";

export const customerProfileApi = {
  async getProfile(): Promise<CustomerProfileResponse | null> {
    try {
      const res = await apiClient.get<CustomerProfileResponse>("/api/customer/profile");
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  async updateProfile(data: UpdateCustomerProfileInput): Promise<CustomerProfileResponse> {
    const res = await apiClient.put<CustomerProfileResponse>(
      "/api/customer/profile",
      data
    );
    return res.data!;
  },
};
