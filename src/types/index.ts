export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  status: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId: number;
  brandId?: number | null;
  sku: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  taxRate: number;
  discountPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithRelations extends Product {
  category?: ProductCategory;
  brand?: ProductBrand;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  _count?: {
    reviews?: number;
    orderItems?: number;
  };
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: number | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    products?: number;
    children?: number;
  };
}

export interface ProductBrand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  isActive: boolean;
  _count?: {
    products?: number;
  };
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number | null;
  stockQuantity: number;
  weight?: number | null;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  variantId?: number | null;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Cart {
  id: number;
  userId?: number | null;
  sessionId?: string | null;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  price: number;
  product?: ProductWithRelations;
  variant?: ProductVariant;
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
  product?: ProductWithRelations;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithRelations extends Order {
  items?: OrderItem[];
  address?: OrderAddress;
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  price: number;
  total: number;
  product?: ProductWithRelations;
  variant?: ProductVariant;
}

export interface OrderAddress {
  id: number;
  orderId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Payment {
  id: number;
  orderId: number;
  method: string;
  status: string;
  amount: number;
  currency: string;
  reference?: string | null;
  createdAt: string;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isApproved: boolean;
  createdAt: string;
  user?: User;
  images?: ReviewImage[];
}

export interface ReviewImage {
  id: number;
  reviewId: number;
  url: string;
}

export interface CustomerAddress {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
