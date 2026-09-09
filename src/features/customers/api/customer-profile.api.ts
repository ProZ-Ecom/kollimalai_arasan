import type { CustomerProfileResponse } from "../types";
import type { UpdateCustomerProfileInput } from "../validations/customer-profile.schema";

export const customerProfileApi = {
  async getProfile(): Promise<CustomerProfileResponse> {
    const res = await fetch("/api/customer/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch customer profile");
    }

    return json.data;
  },

  async updateProfile(data: UpdateCustomerProfileInput): Promise<CustomerProfileResponse> {
    const res = await fetch("/api/customer/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to update customer profile");
    }

    return json.data;
  },
};
