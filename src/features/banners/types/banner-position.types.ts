export interface BannerPositionDto {
  id: string; // Public UUID
  name: string;
  slug: string;
  page: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BannerPositionPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BannerPositionListResponse {
  data: BannerPositionDto[];
  meta: BannerPositionPaginationMeta;
}
