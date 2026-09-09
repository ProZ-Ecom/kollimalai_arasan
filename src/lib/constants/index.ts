export const APP_NAME = "RithuSnacks";
export const APP_DESCRIPTION = "Premium Snacks - Quality You Can Trust";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  RETURNED: "RETURNED",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

export const PAYMENT_METHODS = [
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "WALLET", label: "Wallet" },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
] as const;

export const ITEMS_PER_PAGE = 12;
export const ADMIN_ITEMS_PER_PAGE = 20;

export const UPLOAD_PATHS = {
  PRODUCTS: "uploads/products",
  CATEGORIES: "uploads/categories",
  BLOGS: "uploads/blogs",
  BANNERS: "uploads/banners",
  AVATARS: "uploads/avatars",
  COMPANY: "uploads/company",
} as const;

export const COOKIE_NAME = "rithu-snacks.session-token";

export const API_SUCCESS_MESSAGES = {
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FETCHED: "Fetched successfully",
} as const;

export const API_ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in",
  FORBIDDEN: "You don't have permission",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation failed",
  INTERNAL_ERROR: "Something went wrong",
} as const;
