export type BulkOrderEnquiryStatus = "new" | "contacted" | "closed";

export interface BulkOrderEnquiryResponse {
  id: string; // Public UUID
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  productInterest: string | null;
  quantity: number;
  message: string | null;
  adminComment: string | null;
  status: BulkOrderEnquiryStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null; // User UUID if any
  updatedBy?: string | null; // User UUID if any
}

export interface AdminBulkOrderListItem {
  id: string; // Public UUID
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  productInterest: string | null;
  quantity: number;
  message: string | null;
  adminComment: string | null;
  status: BulkOrderEnquiryStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBulkOrderListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  status?: BulkOrderEnquiryStatus;
  sortBy?: "name" | "email" | "quantity" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface AdminBulkOrderListResponse {
  data: AdminBulkOrderListItem[];
  meta: {
    page: number;
    limit: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
