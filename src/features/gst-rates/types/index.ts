export interface AdminGstRateResponse {
  id: string; // Public UUID
  name: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  status: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAdminGstRatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
