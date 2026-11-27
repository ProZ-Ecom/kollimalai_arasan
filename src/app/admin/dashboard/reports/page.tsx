"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminContent,
  AdminPageHeader,
} from "@/components/admin/AdminPageHeader";

const reports = [
  {
    title: "Sales Report",
    question: "How much did we sell, and what drove it?",
    icon: BarChart3,
    href: "/admin/dashboard/reports/sales",
    includes: [
      "Net sales, discounts, tax & order trends",
      "Breakdown by category, brand & coupon",
      "Top selling products & top customers",
    ],
  },
  {
    title: "Orders Report",
    question: "Where are orders in the pipeline, and why do they fall through?",
    icon: ShoppingCart,
    href: "/admin/dashboard/reports/orders",
    includes: [
      "Pipeline breakdown by order & payment status",
      "Delivery partner speed & fulfilment rate",
      "Cancellation, return reasons & order log",
    ],
  },
  {
    title: "Revenue Report",
    question: "What was billed, what came in, and what is still owed?",
    icon: DollarSign,
    href: "/admin/dashboard/reports/revenue",
    includes: [
      "Collected payments vs. outstanding dues & refunds",
      "HSN-wise GST tax summary (CGST/SGST/IGST)",
      "Payment method breakdown & unpaid orders",
    ],
  },
  {
    title: "Products Report",
    question: "What sells best, what gets returned, and what sits idle?",
    icon: Package,
    href: "/admin/dashboard/reports/products",
    includes: [
      "Per-SKU units, revenue, discounts & returns",
      "Category & brand performance share",
      "Best sellers, slow movers & zero-sale SKUs",
    ],
  },
  {
    title: "Customers Report",
    question: "Who buys, who comes back, and who has gone quiet?",
    icon: Users,
    href: "/admin/dashboard/reports/customers",
    includes: [
      "New vs. returning buyers & repeat purchase rate",
      "Top customers by spend & order frequency",
      "State/city demand & 90-day churn-risk list",
    ],
  },
  {
    title: "Inventory Report",
    question: "What stock are we holding, and what needs reordering?",
    icon: Warehouse,
    href: "/admin/dashboard/reports/inventory",
    includes: [
      "On-hand, reserved & sellable stock valuation",
      "Out-of-stock, low-stock & 90-day dead-stock alerts",
      "Stock movement summary & audit ledger",
    ],
  },
];

export default function ReportsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Live store analytics pulled directly from your database. Every report includes period comparisons and Excel export."
        breadcrumbs={
          <AdminBreadcrumb
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Reports" },
            ]}
          />
        }
      />

      <AdminContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:border-secondary-500/50 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 transition-colors group-hover:bg-secondary-600 group-hover:text-white">
                  <report.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold tracking-tight text-neutral-900">
                    {report.title}
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                    {report.question}
                  </p>
                </div>
              </div>

              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {report.includes.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-xs text-neutral-600"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-400"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>

              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-secondary-700">
                Open report
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </AdminContent>
    </div>
  );
}
