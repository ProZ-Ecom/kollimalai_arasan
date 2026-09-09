export interface AdminHsnCodeResponse {
  id: string; // Public HSN UUID
  code: string;
  description: string | null;
  gstRateId: string | null; // Public GST Rate UUID
  status: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAdminHsnCodesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
