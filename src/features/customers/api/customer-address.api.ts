import type {
  CustomerAddressResponse,
  CustomerAddressListResult,
} from "../types/customer-address.types";
import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "../validations/customer-address.schema";

export const customerAddressApi = {
  async getAddresses(): Promise<CustomerAddressResponse[]> {
    const res = await fetch("/api/customer/addresses", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch addresses");
    }

    return json.data || [];
  },

  async createAddress(
    data: CreateCustomerAddressInput
  ): Promise<CustomerAddressResponse> {
    const res = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      const errorMsg =
        json.errors && json.errors.length > 0
          ? json.errors.join(", ")
          : json.message || "Failed to create address";
      throw new Error(errorMsg);
    }

    return json.data;
  },

  async updateAddress(
    uuid: string,
    data: UpdateCustomerAddressInput
  ): Promise<CustomerAddressResponse> {
    const res = await fetch(`/api/customer/addresses/${uuid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      const errorMsg =
        json.errors && json.errors.length > 0
          ? json.errors.join(", ")
          : json.message || "Failed to update address";
      throw new Error(errorMsg);
    }

    return json.data;
  },

  async deleteAddress(uuid: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/customer/addresses/${uuid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to delete address");
    }

    return { success: true };
  },
};
