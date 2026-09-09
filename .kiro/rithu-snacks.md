# Rithu Snacks - Project Memory

> **Auto-generated comprehensive project reference for rithu-snacks (Admin + Backend).**
> This document captures architecture, conventions, patterns, and domain knowledge for fast onboarding.

---

## 1. Project Identity

- **Name:** rithu-snacks (shopify-style Indian snacks e-commerce)
- **Monorepo packages:** `apps/web` (Next.js 16 App Router), `packages/admin` (React 19 + Vite), `packages/shared` (shared types, utils, UI)
- **Root dir (workspace):** `D:\Monisha\codes\rithu-snaks\code\rithu-snacks` (note: parent folder has typo "rithu-snaks", workspace root is "rithu-snacks")
- **Language:** TypeScript (strict), React 19, Next.js 16 (App Router, RSC), Node.js
- **Styling:** Tailwind CSS v4, shadcn/ui components, Lucide React icons
- **State/data:** React Query (TanStack Query) for server state, react-hook-form + Zod for forms
- **Database:** Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Auth:** Custom session-based auth with bcrypt, lucia for token generation, cookies
- **Payments:** Razorpay integration

---

## 2. High-Level Architecture

```
D:\Monisha\codes\rithu-snaks\code\rithu-snacks\
├── apps/
│   ├── web/          # Customer-facing Next.js app (port 3000)
│   └── backend/      # Express.js backend server (port 5000) [NOT started in this session]
├── packages/
│   ├── admin/        # Admin panel (React 19 + Vite, port 5173)
│   └── shared/       # Shared types, utils, UI components
├── prisma/           # Database schema + migrations + seeds
├── turbo.json        # Turborepo config
├── package.json      # Root package.json with workspace scripts
├── .eslintrc.cjs     # ESLint config
└── README.md         # Project setup instructions
```

---

## 3. Key Commands

```bash
# Development
pnpm install                          # Install all dependencies
pnpm dev                              # Start ALL packages (web + admin + backend) via turbo
pnpm --filter web dev                 # Start only customer web app
pnpm --filter @rithu-snacks/admin dev # Start only admin panel

# Database
pnpm prisma generate                  # Generate Prisma client
pnpm prisma migrate dev               # Run migrations
pnpm prisma db seed                   # Seed database (auto-runs after migrate)
pnpm prisma studio                    # Open Prisma Studio

# Build
pnpm build                            # Build all packages

# Lint
pnpm lint                             # ESLint across all packages
```

---

## 4. Database Schema (Prisma)

**File:** `prisma/schema.prisma`

### Core Models

#### User
- `id` (String, CUID), `email` (unique), `name`, `phone` (unique), `passwordHash`, `role` (enum: ADMIN, STAFF, CUSTOMER, default CUSTOMER), `avatar`, `isActive` (default true), `isEmailVerified` (default false), `createdAt`, `updatedAt`
- Relations: addresses, orders, sessions, cartItems, wishlistItems, reviews, notifications

#### Category
- `id` (String, CUID), `name`, `slug` (unique), `description`, `image`, `parentId` (self-relation), `isActive`, `sortOrder`, `createdAt`, `updatedAt`
- Relations: products, children (subcategories), parent

#### Product
- `id` (String, CUID), `name`, `slug` (unique), `description`, `shortDescription`, `sku` (unique), `barcode`, `price` (Decimal), `compareAtPrice` (Decimal), `costPrice` (Decimal), `categoryId`, `brandId`, `isFeatured`, `isActive`, `createdAt`, `updatedAt`
- Relations: images, variants, category, brand, orderItems, cartItems, wishlistItems, reviews

#### ProductVariant
- `id` (String, CUID), `name`, `sku` (unique), `price` (Decimal), `compareAtPrice`, `stock`, `weight`, `unit`, `isActive`, `productId`, `createdAt`, `updatedAt`
- Relations: product, orderItems, cartItems

#### ProductImage
- `id` (String, CUID), `url`, `alt`, `sortOrder`, `isPrimary`, `productId`, `createdAt`, `updatedAt`
- Relations: product

#### Brand
- `id` (String, CUID), `name`, `slug` (unique), `description`, `logo`, `website`, `isActive`, `createdAt`, `updatedAt`
- Relations: products

#### Customer
- `id` (String, CUID), `userId` (unique), `phone`, `dateOfBirth`, `gender`, `createdAt`, `updatedAt`
- Relations: user, addresses, orders

#### Address
- `id` (String, CUID), `customerId`, `title`, `recipientName`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `isDefault`, `createdAt`, `updatedAt`
- Relations: customer

#### Order
- `id` (String, CUID), `orderNumber` (unique), `customerId`, `userId`, `status` (enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED), `paymentStatus` (enum: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED), `paymentMethod`, `subtotal`, `tax`, `shipping`, `discount`, `total`, `notes`, `shippingAddressId`, `billingAddressId`, `createdAt`, `updatedAt`
- Relations: customer, user, items, shippingAddress, billingAddress, transactions

#### OrderItem
- `id` (String, CUID), `orderId`, `productId`, `variantId`, `quantity`, `price`, `total`, `createdAt`, `updatedAt`
- Relations: order, product, variant

#### Transaction
- `id` (String, CUID), `orderId`, `amount`, `method`, `status`, `reference`, `gatewayResponse` (JSON), `createdAt`, `updatedAt`
- Relations: order

#### Coupon
- `id` (String, CUID), `code` (unique), `description`, `discountType` (enum: PERCENTAGE, FIXED), `discountValue` (Decimal), `minOrderAmount`, `maxDiscountAmount`, `usageLimit`, `usedCount`, `isActive`, `expiresAt`, `createdAt`, `updatedAt`

#### Banner
- `id` (Int, autoincrement), `title`, `subtitle`, `image`, `link`, `position`, `isActive` (default true), `sortOrder` (default 0), `startsAt`, `expiresAt`, `createdAt`, `updatedAt`

#### CartItem
- `id` (String, CUID), `userId`, `productId`, `variantId`, `quantity`, `createdAt`, `updatedAt`

#### WishlistItem
- `id` (String, CUID), `userId`, `productId`, `createdAt`

#### Review
- `id` (String, CUID), `rating` (1-5), `title`, `comment`, `productId`, `userId`, `createdAt`, `updatedAt`

#### Notification
- `id` (String, CUID), `userId`, `type` (enum: ORDER_UPDATE, PAYMENT, PROMOTION, SYSTEM), `title`, `message`, `isRead`, `data` (JSON), `createdAt`, `updatedAt`

#### Setting
- `id` (String, CUID), `key` (unique), `value` (JSON), `updatedAt`

#### Page
- `id` (String, CUID), `title`, `slug` (unique), `content` (JSON), `excerpt`, `featuredImage`, `isPublished`, `publishedAt`, `createdAt`, `updatedAt`

**Note:** Banner uses `Int` id (autoincrement), not `String` CUID like other models.

---

## 5. Backend Architecture (apps/backend)

### Entry & Server
- **File:** `apps/backend/src/index.ts` → starts server
- **File:** `apps/backend/src/server.ts` → Express server setup
- Express with CORS, JSON body parsing, cookie parser, request logger
- Health check endpoint: `GET /api/health`
- Graceful shutdown handling

### API Structure (`apps/backend/src/api/`)
```
api/
├── index.ts              # Mounts all routes under /api
├── middlewares/
│   ├── auth.ts           # Session cookie auth middleware
│   ├── role.ts           # Role-based access control
│   ├── validation.ts     # Zod request validation
│   └── errorHandler.ts   # Global error handler
├── routes/
│   ├── index.ts          # Route registry
│   ├── auth.routes.ts    # Auth routes (login, register, logout, session)
│   ├── user.routes.ts    # User management (admin/staff)
│   ├── category.routes.ts
│   ├── product.routes.ts
│   ├── brand.routes.ts
│   ├── customer.routes.ts
│   ├── order.routes.ts
│   ├── coupon.routes.ts
│   ├── dashboard.routes.ts
│   ├── upload.routes.ts
│   └── analytics.routes.ts
├── controllers/          # Route handlers
├── services/             # Business logic
├── repositories/         # Database queries (Prisma)
└── types/                # API-specific types, route type map
```

### Route Type Map Pattern
```typescript
// apps/backend/src/api/types/index.ts
import type { AuthRoutes } from "../routes/auth.routes";

export interface RouteMap {
  auth: AuthRoutes;
  // ... other route maps
}
```

### Route Handler Pattern
```typescript
import { Router, Request, Response } from "express";
import { AuthController } from "../controllers/auth.controller";

export interface AuthRoutes {
  login: {
    method: "POST";
    body: { email: string; password: string };
    response: { user: UserWithRoles; token: string };
  };
  // ...
}

const router = Router();
router.post("/login", async (req: Request, res: Response) => {
  await AuthController.login(req, res);
});
export default router;
```

### Auth System
- **File:** `apps/backend/src/lib/auth.ts` → lucia token management
- **File:** `apps/backend/src/lib/password.ts` → bcrypt hash/verify
- **File:** `apps/backend/src/middlewares/auth.ts` → session cookie auth middleware
- **File:** `apps/backend/src/middlewares/role.ts` → role-based access (admin/staff checks)
- Sessions stored in `sessions` table with token, userId, expiresAt
- Cookies: `session` token (httpOnly, secure, sameSite lax, maxAge 7 days)
- Password validation: min 8 chars, uppercase, lowercase, number, special char
- Login returns: `{ success, data: { user, token }, message }`
- Register returns: `{ success, data: { user, token }, message }`

### File Upload System
- **File:** `apps/backend/src/config/upload.ts` → multer config
- **File:** `apps/backend/src/lib/file-upload.ts` → upload/delete local files
- **File:** `apps/backend/src/api/routes/upload.routes.ts` → upload endpoints
- Storage: `apps/backend/uploads/` directory (created on first upload)
- Endpoints:
  - `POST /api/upload/image` → single image
  - `POST /api/upload/images` → multiple images (max 10)
  - `DELETE /api/upload/:filename` → delete file
  - `GET /api/upload/serve/:filename` → serve file with proper Content-Type
- URL format: `http://localhost:5000/uploads/filename.ext`
- Allowed types: JPEG, PNG, GIF, WebP (max 5MB)

### Request Logging Middleware
- **File:** `apps/backend/src/middlewares/request-logger.ts`
- Logs method, URL, status, response time, request ID
- Includes `X-Request-Id` header in responses

### Seed Script
- **File:** `prisma/seed.ts`
- Creates admin user, roles, sample data (categories, brands, products, customers, orders, coupons, banners, settings, pages)
- Admin credentials: `admin@rithusnacks.com` / `Admin@123`
- Run via `pnpm prisma db seed` or `tsx prisma/seed.ts`

---

## 6. Admin Panel Architecture (packages/admin)

### Entry & Config
- **File:** `packages/admin/src/main.tsx` → React root + router
- **File:** `packages/admin/src/App.tsx` → React Router routes
- **File:** `packages/admin/src/config/index.ts` → environment config
- **File:** `packages/admin/vite.config.ts` → Vite config (port 5173)

### Tech Stack
- React 19, React Router 7 (HashRouter)
- TanStack Query v5 for server state
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- shadcn/ui components (customized for React 19)
- Zustand for local state (authStore, uiStore)
- React Hook Form + Zod for forms
- Lucide React icons
- date-fns for date formatting
- Axios for HTTP requests

### Directory Structure
```
packages/admin/src/
├── main.tsx                     # Root + React Router
├── App.tsx                      # Route definitions
├── config/index.ts              # API base URL config
├── lib/
│   ├── axios.ts                 # Axios instance with interceptors
│   └── utils.ts                 # cn() utility
├── stores/
│   ├── auth-store.ts            # Zustand auth state
│   └── ui-store.ts              # Sidebar state
├── hooks/
│   ├── use-auth.ts              # Auth hook (uses authStore)
│   ├── use-auth-query.ts        # React Query auth check
│   ├── use-debounce.ts          # Debounce hook
│   ├── use-mobile.ts            # Mobile detection
│   └── use-toast.ts             # Toast notifications
├── api/                         # API client modules
│   ├── auth.api.ts              # Login/logout/register
│   ├── user.api.ts              # User CRUD
│   ├── category.api.ts          # Category CRUD
│   ├── product.api.ts           # Product CRUD
│   ├── customer.api.ts          # Customer CRUD
│   ├── brand.api.ts             # Brand CRUD
│   ├── order.api.ts             # Order CRUD
│   ├── coupon.api.ts            # Coupon CRUD
│   ├── dashboard.api.ts         # Dashboard stats
│   ├── analytics.api.ts         # Analytics data
│   └── banner.api.ts            # Banner CRUD
├── components/                  # Reusable UI components
│   ├── ui/                      # shadcn/ui primitives (button, input, dialog, table, etc.)
│   ├── layout/                  # AdminLayout, AdminHeader, AdminSidebar
│   ├── navigation/              # AdminBreadcrumb
│   ├── feedback/                # LoadingState, ErrorState, EmptyState, ConfirmDialog, StatusBadge
│   ├── data-table/              # DataTable, Pagination, SearchInput, SortHeader
│   ├── forms/                   # ImageUpload, FormModal
│   └── dashboard/               # DashboardStats, DashboardCharts
├── pages/                       # Page components (lazy-loaded)
│   ├── auth/                    # LoginPage, RegisterPage
│   ├── dashboard/               # DashboardPage
│   ├── users/                   # UsersPage, UserFormModal
│   ├── categories/              # CategoriesPage, CategoryFormModal
│   ├── brands/                  # BrandsPage, BrandFormModal
│   ├── products/                # ProductsPage, ProductFormModal, ProductDetailPage
│   ├── customers/               # CustomersPage, CustomerFormModal, CustomerDetailPage
│   ├── orders/                  # OrdersPage, OrderDetailPage, OrderStatusBadge
│   ├── coupons/                 # CouponsPage, CouponFormModal
│   ├── banners/                 # BannersPage
│   ├── analytics/               # AnalyticsPage
│   ├── settings/                # SettingsPage
│   └── errors/                  # NotFoundPage, ErrorPage
```

### Route Definitions (App.tsx)
```typescript
// Public routes
/login                           → LoginPage
/register                        → RegisterPage
/unauthorized                    → UnauthorizedPage

// Protected routes (RequireAuth wraps all)
/                                → DashboardPage
/users                          → UsersPage
/categories                     → CategoriesPage
/brands                         → BrandsPage
/products                       → ProductsPage
/products/:id                   → ProductDetailPage
/customers                      → CustomersPage
/customers/:id                  → CustomerDetailPage
/orders                         → OrdersPage
/orders/:id                     → OrderDetailPage
/coupons                        → CouponsPage
/banners                        → BannersPage
/analytics                      → AnalyticsPage
/settings                       → SettingsPage
*                               → NotFoundPage
```

### Authentication Flow
1. **RequireAuth** component checks `useAuthQuery()` (which calls `authApi.getMe()`)
2. If not authenticated → redirect to `/login`
3. Login form → `authApi.login()` → stores user in `authStore` → redirect to `/`
4. **AuthStore** (Zustand): user, token, isAuthenticated, login(), logout()
5. Token stored in Zustand (not localStorage) — re-auth on page load via `getMe()`
6. **Axios interceptor** (`lib/axios.ts`) automatically attaches `Authorization: Bearer <token>` header

### Layout Pattern
```
AdminLayout
├── AdminHeader (mobile menu toggle, user info, logout)
├── AdminSidebar (navigation links, collapsible)
└── main content area (Outlet from React Router)
    └── AdminPageWrapper (page title, breadcrumbs, actions)
        └── AdminContent (padding wrapper)
            └── children (actual page content)
```

### Navigation Items
```typescript
// packages/admin/src/components/layout/admin-sidebar.tsx
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Users", icon: Users, href: "/users", roles: ["ADMIN"] },
  { label: "Categories", icon: FolderTree, href: "/categories" },
  { label: "Brands", icon: Tag, href: "/brands" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Coupons", icon: Ticket, href: "/coupons" },
  { label: "Banners", icon: Image, href: "/banners" },
  { label: "Analytics", icon: BarChart3, href: "/analytics", roles: ["ADMIN"] },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["ADMIN"] },
];
```

### Component Patterns

#### DataTable Pattern
```typescript
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<DataType>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
          <Trash2 className="h-4 w-4 text-error-600" />
        </Button>
      </div>
    ),
  },
];

<DataTable columns={columns} data={data ?? []} searchPlaceholder="Search..." />
```

#### FormModal Pattern
```typescript
import { FormModal } from "@/components/forms";

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  title={editingItem ? "Edit Item" : "Create Item"}
  description={editingItem ? "Update the item details" : "Add a new item"}
  onSubmit={handleSubmit(onSubmit)}
  isLoading={isSubmitting}
>
  {/* form fields */}
</FormModal>
```

#### ImageUpload Pattern
```typescript
import { ImageUpload } from "@/components/forms";

<ImageUpload
  value={currentImage}
  onChange={(url) => setValue("image", url)}
  onRemove={() => setValue("image", "")}
/>
```

#### Loading/Error/Empty States
```typescript
import { LoadingState, ErrorState, EmptyState } from "@/components/feedback";

if (isLoading) return <LoadingState />;
if (error) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState title="No items found" description="Create your first item" />;
```

#### ConfirmDialog Pattern
```typescript
import { ConfirmDialog } from "@/components/feedback";

<ConfirmDialog
  isOpen={!!deletingId}
  onClose={() => setDeletingId(null)}
  onConfirm={handleConfirmDelete}
  title="Delete Item"
  description="Are you sure? This cannot be undone."
  variant="destructive"
/>
```

#### StatusBadge Pattern
```typescript
import { StatusBadge } from "@/components/feedback";

const orderStatusConfig = {
  pending: { label: "Pending", variant: "warning" as const },
  confirmed: { label: "Confirmed", variant: "info" as const },
  processing: { label: "Processing", variant: "default" as const },
  shipped: { label: "Shipped", variant: "info" as const },
  delivered: { label: "Delivered", variant: "success" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
  refunded: { label: "Refunded", variant: "secondary" as const },
};

<StatusBadge status={order.status} config={orderStatusConfig} />
```

---

## 7. Customer Web App (apps/web)

### Tech Stack
- Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS v4)
- React Query (TanStack Query) for server state
- React Hook Form + Zod for forms
- Zustand for local state (auth, cart, UI)
- Lucide React icons
- Framer Motion (animations)

### Directory Structure
```
apps/web/src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (globals.css, Providers, AuthInitializer, GoogleOneTap)
│   ├── page.tsx                   # Home page (redirects to /home)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (shop)/
│   │   ├── layout.tsx             # Shop layout (Header + Footer)
│   │   ├── home/page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/[slug]/page.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   └── api/                       # Next.js API routes (backend-for-frontend)
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── user/route.ts
│       ├── products/route.ts
│       ├── products/[id]/route.ts
│       ├── categories/route.ts
│       └── categories/[slug]/route.ts
├── components/
│   ├── providers.tsx              # QueryClientProvider
│   ├── auth-initializer.tsx       # Syncs auth state from cookies on load
│   ├── google-one-tap.tsx         # Google authentication
│   ├── header.tsx                 # Site header with navigation, cart, user menu
│   ├── footer.tsx                 # Site footer
│   ├── ui/                        # shadcn/ui components (button, input, card, badge, dialog, etc.)
│   ├── auth/                      # AuthForm, SocialLoginButtons, PasswordInput, PasswordStrengthIndicator
│   ├── products/                  # ProductCard, ProductGrid, ProductFilters, ProductQuickView
│   ├── checkout/                  # AddressForm, PaymentForm, OrderSummary
│   └── cart/                      # CartItem, CartSummary
├── lib/
│   ├── utils.ts                   # cn(), formatPrice(), formatDate(), formatDateShort(), generateOrderNumber()
│   ├── axios.ts                   # Axios instance for customer API
│   └── validators.ts              # Zod schemas: loginSchema, registerSchema, profileUpdateSchema
├── hooks/
│   ├── use-auth.ts                # Auth hook (uses authStore)
│   ├── use-cart.ts                # Cart operations (uses cartStore)
│   ├── use-products.ts            # React Query hooks for products
│   └── use-categories.ts          # React Query hooks for categories
├── stores/
│   ├── auth-store.ts              # Zustand auth state
│   ├── cart-store.ts              # Zustand cart state (localStorage persistence)
│   └── ui-store.ts                # UI state
├── types/                         # TypeScript type definitions
│   └── api.ts                     # API response types (ApiResponse, User, etc.)
└── styles/
    └── globals.css                # Global styles + CSS variables
```

### Customer App Conventions
- **File naming:** PascalCase for components (ProductCard.tsx), kebab-case for others
- **No trailing slashes** in routes
- **Server Components** by default, "use client" only when needed
- **Zod** for all form validation
- **React Query** for server state management
- **Zustand** for client-side state
- **API routes** in Next.js act as BFF (backend-for-frontend)

### Providers Pattern
```typescript
// apps/web/src/app/layout.tsx
<html>
  <body>
    <Providers>
      {children}
      <AuthInitializer />
      <GoogleOneTap />
    </Providers>
  </body>
</html>
```

### Cart Pattern
- Cart state persisted to localStorage via Zustand persist
- Cart items synced to server when user is authenticated
- Cart summary with subtotal, shipping, tax, discount calculation

### Home Page Sections
- HeroSection (banner + CTA)
- FeaturedCategories (grid of category cards)
- FeaturedProducts (carousel of product cards)
- WhyChooseUs (feature highlights)
- CustomerReviews (testimonials)
- InstagramFeed (social proof)
- Newsletter (email signup)

---

## 8. Shared Package (packages/shared)

### Purpose
Common types, utilities, and UI components shared between web and admin.

### Types
```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  roles?: Role[];
}

// packages/shared/src/types/product.ts
export interface Product { id, name, slug, description, ... }
export interface ProductVariant { id, name, sku, price, stock, ... }
export interface ProductImage { id, url, alt, sortOrder, isPrimary, ... }
export interface Category { id, name, slug, description, image, children?, ... }
export interface Brand { id, name, slug, description, logo, ... }
```

### Utils
- `formatPrice(amount: number): string` — formats as ₹X,XXX.XX
- `formatDate(date: Date | string): string` — "MMM dd, yyyy"
- `formatDateShort(date: Date | string): string` — "dd/MM/yyyy"
- `generateOrderNumber(): string` — "ORD-" + YYYYMMDD + 6-digit random
- `cn(...inputs)` — clsx + tailwind-merge

### UI Components
- Button, Input, Label, Textarea, Checkbox, RadioGroup, Switch
- Card, Badge, Separator, Avatar, Tooltip
- Dialog, AlertDialog, Sheet, DropdownMenu, Select, Tabs
- Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- Form, FormControl, FormField, FormItem, FormLabel, FormMessage
- Calendar, Popover, Command, Skeleton, ScrollArea
- AlertDialog components (for confirmations)

---

## 9. Common Patterns Across the Codebase

### API Response Format
```typescript
// Standard response
{ success: true, data: T, message: string }
// Error response
{ success: false, error: string, message: string }
```

### Pagination Response
```typescript
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

### React Query Pattern
```typescript
// Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['resource', params],
  queryFn: () => api.getResources(params),
});

// Mutation
const createResource = useMutation({
  mutationFn: (data) => api.createResource(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
    toast({ title: "Success", description: "Resource created" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

### Zod Validation Pattern
```typescript
import { z } from "zod";

export const createResourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  isActive: z.boolean().default(true),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
```

### Form Pattern (react-hook-form + zod)
```typescript
const form = useForm<CreateResourceInput>({
  resolver: zodResolver(createResourceSchema),
  defaultValues: {
    name: "",
    description: "",
    price: 0,
    isActive: true,
  },
});

const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form;

<form onSubmit={handleSubmit(onSubmit)}>
  <FormField
    control={control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</form>
```

### Component Export Pattern
```typescript
// Named exports only (no default exports for components)
export function MyComponent() { ... }
// Or
export const MyComponent = () => { ... }
```

### Lazy Loading (Admin)
```typescript
// packages/admin/src/App.tsx
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const UsersPage = lazy(() => import("@/pages/users"));
// ...
<Suspense fallback={<LoadingState />}>
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    ...
  </Routes>
</Suspense>
```

---

## 10. Development Workflow

### Git Branches
```
main                    # Production
├── develop            # Development
│   ├── feature/*      # Feature branches
│   ├── bugfix/*       # Bug fixes
│   └── hotfix/*       # Production fixes
```

### Commit Messages
```
feat: add new feature
fix: resolve bug
refactor: improve code structure
docs: update documentation
style: formatting changes
test: add/update tests
chore: maintenance tasks
```

### Code Review
- Self-review before committing
- Test all changes thoroughly
- Follow project coding standards
- Update documentation as needed

---

## 11. Environment Variables

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
DATABASE_URL="file:./dev.db"
```

### apps/backend/.env
```
PORT=5000
DATABASE_URL="file:./dev.db"
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SESSION_SECRET=your_session_secret
```

---

## 12. Deployment

### Production Build
```bash
pnpm build
```

### Docker (planned)
```dockerfile
FROM node:18-alpine AS base
# ... multi-stage build for web + admin
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure database URL
3. Set Razorpay credentials
4. Configure CORS origins
5. Set session secrets

---

## 13. Key Files Reference

| File | Purpose |
|------|---------|
| `apps/web/src/app/layout.tsx` | Root layout with providers |
| `apps/web/src/app/page.tsx` | Home page |
| `apps/web/src/components/header.tsx` | Site header |
| `apps/web/src/components/footer.tsx` | Site footer |
| `apps/web/src/lib/axios.ts` | Axios instance |
| `apps/web/src/stores/auth-store.ts` | Auth state |
| `apps/web/src/stores/cart-store.ts` | Cart state |
| `apps/web/src/hooks/use-auth.ts` | Auth hook |
| `apps/web/src/hooks/use-cart.ts` | Cart hook |
| `apps/admin/src/main.tsx` | Admin entry |
| `apps/admin/src/App.tsx` | Admin routes |
| `apps/admin/src/components/layout/admin-layout.tsx` | Admin layout |
| `apps/admin/src/api/auth.api.ts` | Auth API |
| `apps/admin/src/api/user.api.ts` | User API |
| `apps/admin/src/api/product.api.ts` | Product API |
| `apps/admin/src/pages/dashboard/index.tsx` | Dashboard |
| `apps/backend/src/server.ts` | Backend server |
| `apps/backend/src/api/index.ts` | API routes |
| `apps/backend/src/lib/auth.ts` | Auth logic |
| `apps/backend/src/middlewares/auth.ts` | Auth middleware |
| `apps/backend/src/config/upload.ts` | Upload config |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Database seed |
| `turbo.json` | Turborepo config |

---

## 14. Common Pitfalls & Solutions

### Prisma Client Not Found
```bash
pnpm prisma generate
```

### Database Connection Issues
```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### Port Conflicts
- Web: 3000
- Admin: 5173
- Backend: 5000
Change in respective config files if needed.

### Type Errors
```bash
pnpm prisma generate  # Regenerate Prisma client
# Check tsconfig.json paths
# Ensure shared package is built: pnpm --filter @rithu-snacks/shared build
```

### Authentication Issues
- Clear browser cookies/localStorage
- Check CORS configuration in backend
- Verify session token isn't expired (7-day maxAge)
- Ensure `getMe()` endpoint is working

### File Upload Issues
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP
- Ensure `uploads/` directory exists (auto-created on first upload)
- Check backend is serving static files from `/uploads/`

### Tailwind CSS v4 Issues
- Uses `@tailwindcss/vite` plugin (not PostCSS)
- CSS variables defined in `globals.css` using `@theme inline`
- Custom fonts: Inter (sans), Playfair Display (serif), Space Grotesk (mono)

---

## 15. Domain Knowledge

### Business Model
- Indian snacks e-commerce (Rithu Snacks)
- Product categories: Savory Snacks, Sweet Delights, Beverages, Combo Offers, Festival Specials
- Brands: Rithu Originals, Grandma's Recipe, Spice Masters, Coastal Treats
- Payment: Razorpay (UPI, Cards, NetBanking, Wallets)
- Delivery: Free above ₹500, standard ₹49, express ₹99
- Tax: 5% GST

### Order Status Flow
```
Pending → Confirmed → Processing → Shipped → Delivered
                                          → Cancelled
                                          → Refunded
```

### User Roles
- **ADMIN:** Full access (users, analytics, settings)
- **STAFF:** Most features except user management, analytics, settings
- **CUSTOMER:** Shopping, orders, profile management

### Product Data
- 30+ products seeded (chips, namkeen, sweets, murukku, banana chips, etc.)
- Price range: ₹45 - ₹450
- Each product has variants (Small/Medium/Large or 200g/500g/1kg)
- Primary + additional images per product

### Coupon System
- Percentage or fixed discount
- Min order amount
- Max discount amount (for percentage)
- Usage limits
- Expiration dates
- Active/inactive toggle

### Banner System
- Homepage banners with image, title, subtitle
- Link to products/categories
- Sort order for display
- Active/inactive toggle
- Position field for placement

---

## 16. Testing Strategy

### Backend Tests
```bash
pnpm --filter @rithu-snacks/backend test
```
- Unit tests for services and utilities
- Integration tests for API endpoints
- Test database with SQLite

### Frontend Tests
```bash
pnpm --filter @rithu-snacks/web test
pnpm --filter @rithu-snacks/admin test
```
- Component tests with React Testing Library
- E2E tests with Playwright (planned)

### Test File Locations
- Backend: `apps/backend/src/**/*.test.ts`
- Web: `apps/web/src/**/*.test.tsx`
- Admin: `apps/admin/src/**/*.test.tsx`

---

## 17. Recent Updates (This Session)

### Implemented Features
1. **Admin Panel Complete** — Full CRUD for all entities
2. **User Management** — Admin/staff roles, authentication
3. **Product Management** — CRUD with variants, images, categories, brands
4. **Category Management** — Hierarchical categories with subcategories
5. **Brand Management** — Brand CRUD with logo upload
6. **Customer Management** — Customer profiles with order history
7. **Order Management** — Order listing, detail view, status updates
8. **Coupon Management** — Discount codes with validation
9. **Banner Management** — Homepage banner CRUD
10. **Dashboard** — Stats, recent orders, top products, revenue charts
11. **Analytics** — Sales, customers, products analytics
12. **File Upload System** — Image upload with local storage
13. **Authentication System** — Login, register, session management
14. **Customer Web App** — Home, products, cart, checkout (partial)

### Key Technical Decisions
- **HashRouter** for admin (simpler deployment)
- **Zustand** over Context for state management
- **TanStack Query** for all server state
- **Zod** for all validation (shared schemas)
- **shadcn/ui** for component library
- **Prisma** with SQLite for dev, PostgreSQL for prod
- **Razorpay** for payments (Indian market)
- **Custom auth** over NextAuth (more control)

### Known Issues
- Backend server not started in this session (Express setup exists but not run)
- Some admin pages may need backend to fully function
- Google One Tap authentication requires Google Cloud Console setup
- File upload serves from backend, not Next.js

---

## 18. Performance Optimizations

### Implemented
- Lazy loading for admin pages
- Image optimization (Next.js Image component)
- React Query caching with staleTime
- Debounced search inputs
- Virtualized lists for large datasets (planned)

### Planned
- Redis caching for frequently accessed data
- CDN for static assets
- Database indexing optimization
- Code splitting for customer app
- Service worker for offline support

---

## 19. Security Measures

### Authentication
- Bcrypt password hashing (10 rounds)
- Session tokens with expiration (7 days)
- HttpOnly cookies (prevents XSS)
- Secure cookies in production
- CSRF protection via SameSite cookies

### Authorization
- Role-based access control (ADMIN, STAFF, CUSTOMER)
- Middleware checks on protected routes
- Frontend route guards (RequireAuth component)

### Data Validation
- Zod schemas for all inputs
- SQL injection prevention (Prisma ORM)
- XSS prevention (React auto-escaping)
- File upload validation (type, size)

### API Security
- CORS configuration
- Rate limiting (planned)
- Request logging for auditing
- Input sanitization

---

## 20. Monitoring & Logging

### Backend Logging
- Request/response logging middleware
- Error logging with stack traces
- Performance logging (response times)

### Frontend Monitoring
- React Query devtools
- Error boundaries
- Console logging in development

### Planned
- Sentry integration
- APM tools
- Log aggregation
- Health check endpoints

---

## 21. Documentation

### Existing Docs
- `README.md` — Project setup and overview
- This file (`rithu-snacks.md`) — Comprehensive project reference

### Code Documentation
- JSDoc comments for complex functions
- TypeScript types serve as documentation
- Inline comments for non-obvious logic

### API Documentation
- Swagger/OpenAPI (planned)
- Postman collection (planned)

---

## 22. Future Roadmap

### Short Term (1-2 weeks)
- [ ] Complete backend server startup and testing
- [ ] Finish customer checkout flow
- [ ] Add payment integration (Razorpay)
- [ ] Order confirmation emails
- [ ] Product search and filtering

### Medium Term (1 month)
- [ ] Admin dashboard analytics
- [ ] Inventory management
- [ ] Bulk operations (import/export)
- [ ] Multi-language support (Hindi, English)
- [ ] Mobile app (React Native)

### Long Term (3 months)
- [ ] Multi-vendor support
- [ ] Subscription boxes
- [ ] Loyalty program
- [ ] Advanced analytics
- [ ] AI-powered recommendations

---

## 23. Team Conventions

### Code Style
- **Indentation:** 2 spaces
- **Semicolons:** Yes (TypeScript)
- **Quotes:** Double quotes for JSX, single for JS
- **Trailing commas:** Yes
- **Line length:** 100 chars max
- **File naming:** PascalCase for components, kebab-case for others

### Git Workflow
- Feature branches from `develop`
- Squash and merge to `develop`
- No direct commits to `main`
- Descriptive commit messages

### Code Review
- Self-review before PR
- Test all changes
- Follow existing patterns
- Update documentation

---

## 24. Quick Reference

### Common Imports
```typescript
// React
import { useState, useEffect, useCallback, useMemo } from "react";

// React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Forms
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import { Plus, Pencil, Trash2, Search, Filter, Download, MoreVertical } from "lucide-react";

// Utils
import { cn, formatPrice, formatDate } from "@/lib/utils";

// API
import { api } from "@/lib/axios";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
```

### Common Patterns
```typescript
// Loading state
if (isLoading) return <LoadingState />;

// Error state
if (error) return <ErrorState onRetry={refetch} />;

// Empty state
if (data.length === 0) return <EmptyState title="No items" description="Create your first item" />;

// Conditional rendering
{isAuthenticated && <Button>Logout</Button>}
{user?.role === "ADMIN" && <NavLink href="/users">Users</NavLink>}

// Form submission
const onSubmit = async (data: FormData) => {
  try {
    await createResource.mutateAsync(data);
    toast({ title: "Success", description: "Resource created" });
    onClose();
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
};
```

---

## 25. Important Notes

### Directory Path Typo
- Parent folder: `D:\Monisha\codes\rithu-snaks` (typo: "snaks")
- Workspace root: `D:\Monisha\codes\rithu-snaks\code\rithu-snacks` (correct: "snacks")
- All imports use `@/` path alias (maps to `src/`)

### Backend Not Started
- Express backend exists at `apps/backend/` but was not started in this session
- Customer web app uses Next.js API routes as BFF
- Admin panel calls backend directly via axios

### Prisma Client
- Generated client is at `node_modules/.prisma/client`
- Import from `@prisma/client`
- Schema at `prisma/schema.prisma`

### Environment Variables
- Web: `NEXT_PUBLIC_*` prefix for client-side
- Backend: No prefix needed
- Never commit `.env` files

### File Uploads
- Stored in `apps/backend/uploads/`
- Served at `http://localhost:5000/uploads/`
- Max size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

### Authentication Tokens
- Stored in Zustand (not localStorage)
- Sent via `Authorization: Bearer <token>` header
- HttpOnly cookie for session
- 7-day expiration

---

*Last updated: 2026-08-04*
*Generated for rithu-snacks admin + backend project*
