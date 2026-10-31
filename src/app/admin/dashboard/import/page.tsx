"use client";

import Link from "next/link";
import {
  FolderTree,
  Package,
  Layers,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/button";

export default function BulkImportRedirectPage() {
  const modules = [
    {
      title: "Categories",
      description:
        "Import your product categories in bulk. Validates category names, category codes, sort orders, and descriptions.",
      href: "/admin/dashboard/categories",
      icon: FolderTree,
      badge: "Module Import Available",
      color: "emerald",
    },
    {
      title: "Products",
      description:
        "Import master products in bulk. Validates product codes, category matching, and HSN codes.",
      href: "/admin/dashboard/products",
      icon: Package,
      badge: "Module Import Available",
      color: "green",
    },
    {
      title: "Items (Variants)",
      description:
        "Import individual items, pack sizes, unit values, SKUs, base prices, and initial stock quantities per product.",
      href: "/admin/dashboard/variants",
      icon: Layers,
      badge: "Module Import Available",
      color: "teal",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bulk Import"
        description="Bulk import has been modularized. Each module now features its own dedicated import with exact form validations and live preview."
        breadcrumbs={
          <AdminBreadcrumb
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Bulk Import" },
            ]}
          />
        }
      />

      <AdminContent>
        <div className="max-w-4xl space-y-6">
          <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-950">
                Modular Bulk Import Enabled
              </h2>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Rather than bundling everything into a single complex spreadsheet, you can now download sample Excel templates and upload data directly inside each respective module. Each module performs real-time validation matching form rules and provides instant error feedback.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--color-neutral-200)] bg-white p-6 shadow-xs hover:border-[var(--color-secondary-300)] hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary-50)] text-[var(--color-secondary-600)]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">
                        {m.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-neutral-600)] leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Link href={m.href} className="w-full block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 rounded-xl text-sm font-semibold hover:bg-[var(--color-secondary-50)] hover:text-[var(--color-secondary-700)] hover:border-[var(--color-secondary-300)]"
                      >
                        Go to {m.title}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminContent>
    </div>
  );
}
