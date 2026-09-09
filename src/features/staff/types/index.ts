export interface StaffResponse {
  id: string; // Public User UUID
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string; // "STAFF"
  status: string; // "active" | "inactive" | "banned"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetStaffParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "email" | "phone" | "createdAt" | "updatedAt" | "isActive";
  sortOrder?: "asc" | "desc";
}

export interface GetStaffResult {
  data: StaffResponse[];
  meta: {
    page: number;
    limit: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminStaffCountResponse {
  active: number;
  inactive: number;
  all: number;
}


