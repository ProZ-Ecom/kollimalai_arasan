# RithuSnacks

A reusable, scalable, and production-ready full-stack e-commerce application built with Next.js, TypeScript, Prisma, and Auth.js.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MySQL 8
- **ORM:** Prisma 7
- **Validation:** Zod
- **Authentication:** Auth.js v5 (NextAuth)
- **Server State:** TanStack Query
- **Admin Tables:** TanStack Table
- **Styling:** Tailwind CSS v4
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8
- npm

### 1. Clone and Install

```bash
git clone <repo-url>
cd rithu-snacks
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="mysql://root:password@localhost:3306/rithu_snacks"
AUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE rithu_snacks"

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Login Credentials (from seed)

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@rithusnacks.com  | admin123    |
| Customer | customer@example.com   | customer123|

## Project Structure

```
src/
├── app/
│   ├── (store)/          # Customer-facing pages
│   │   ├── page.tsx      # Home
│   │   ├── products/     # Product listing & detail
│   │   ├── categories/   # Category listing & detail
│   │   ├── cart/         # Shopping cart
│   │   ├── wishlist/     # Wishlist
│   │   ├── checkout/     # Checkout
│   │   ├── orders/       # Order history
│   │   └── profile/      # User profile
│   ├── (auth)/           # Auth pages
│   │   ├── login/        # Customer login
│   │   └── register/     # Customer registration
│   ├── admin/            # Admin area
│   │   ├── login/        # Admin login
│   │   └── dashboard/    # Admin dashboard
│   └── api/              # API routes
│       ├── auth/         # Auth.js endpoints
│       ├── products/     # Product APIs
│       ├── categories/   # Category APIs
│       ├── cart/         # Cart APIs
│       ├── wishlist/     # Wishlist APIs
│       └── orders/       # Order APIs
├── components/
│   ├── ui/               # Reusable UI components
│   ├── forms/            # React Hook Form components
│   ├── common/           # Common components
│   ├── layout/           # Layout components
│   ├── product/          # Product components
│   └── admin/            # Admin components
├── features/             # Feature modules
├── hooks/                # Custom hooks
├── lib/
│   ├── api/              # API helpers
│   ├── auth/             # Auth config
│   ├── db/               # Database client
│   ├── validations/      # Zod schemas
│   ├── permissions/      # Permission helpers
│   ├── constants/        # App constants
│   └── utils.ts          # Utility functions
├── providers/            # React providers
├── types/                # TypeScript types
└── config/               # Configuration
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed script
```

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio
```

## Key Features

- **Reusable architecture** - Generic components and utilities reusable across projects
- **Role-based auth** - Customer, Staff, Admin roles with Auth.js
- **Type-safe** - Full TypeScript with Prisma-generated types
- **API standardization** - Consistent response format across all APIs
- **Zod validation** - Input validation on both client and server
- **Server-first** - Server Components by default, Client Components only when needed
- **Responsive design** - Mobile-first with Tailwind CSS
- **Admin dashboard** - Separate admin area with sidebar navigation
