import type { PaginationMeta } from "@/lib/api/api-response";

export type AddressType = "shipping" | "billing";

export interface CustomerAddressResponse {
  id: string; // Public UUID
  label: string | null;
  addressType: AddressType;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddressListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  addressType?: AddressType;
}

export interface CustomerAddressListResult {
  data: CustomerAddressResponse[];
  meta?: PaginationMeta;
}
