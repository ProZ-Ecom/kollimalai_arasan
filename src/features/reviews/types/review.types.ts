export interface ReviewUserBasic {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ReviewProductBasic {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
}

export interface ReviewVariantBasic {
  id: string;
  name: string;
  sku: string;
  slug?: string | null;
}

export interface ReviewOrderItemBasic {
  id: string;
  productNameSnapshot: string;
  variantSnapshot: string;
  skuSnapshot: string;
  quantity: number;
}

export interface ReviewResponse {
  id: string;
  productId: string;
  variantId?: string | null;
  variantUnitPriceId?: string | null;
  orderItemId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isApproved: boolean;
  product?: ReviewProductBasic;
  variant?: ReviewVariantBasic;
  orderItem?: ReviewOrderItemBasic;
  customer?: ReviewUserBasic;
  createdAt: Date;
  updatedAt: Date;
}

export type {
  CreateReviewInput,
  UpdateReviewInput,
} from "../validations/review.schema";

export interface PublicReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  customerName: string;
  customerAvatar: string | null;
  variant?: ReviewVariantBasic;
  createdAt: Date;
}

export interface RatingBreakdown {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: RatingBreakdown;
}

export interface PublicReviewsResponse {
  reviews: PublicReviewItem[];
  ratingSummary: RatingSummary;
}

export interface PublicVariantReviewResponse {
  variant: {
    id: string;
    name: string;
    sku: string;
    slug?: string | null;
    product: ReviewProductBasic;
  };
  reviews: PublicReviewItem[];
  ratingSummary: RatingSummary;
}

export interface ReviewModerateResult {
  id: string;
  isApproved: boolean;
  updatedAt: Date;
}

export interface AdminReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  isApproved?: boolean;
  rating?: number;
  productId?: string;
  variantId?: string;
  variantUnitPriceId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  isApproved?: boolean;
  rating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

