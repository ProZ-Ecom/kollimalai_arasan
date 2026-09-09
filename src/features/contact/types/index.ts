export type ContactMessageStatus = "new" | "read" | "replied";

export interface ContactMessageResponse {
  id: string; // Public UUID
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactMessageStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null; // User UUID if any
  updatedBy?: string | null; // User UUID if any
}

export interface AdminContactMessageListItem {
  id: string; // Public UUID
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactMessageStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminContactMessageListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  status?: ContactMessageStatus;
  sortBy?: "name" | "email" | "subject" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface AdminContactMessageListResponse {
  data: AdminContactMessageListItem[];
  meta: {
    page: number;
    limit: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
