"use client";

import Link from "next/link";
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";

const reports = [
  {
    title: "Sales Report",
    description: "View comprehensive sales analytics and trends",
    icon: BarChart3,
    href: "/admin/dashboard/reports/sales",
  },
  {
    title: "Orders Report",
    description: "Track order status, fulfillment, and history",
    icon: ShoppingCart,
    href: "/admin/dashboard/reports/orders",
  },
  {
    title: "Products Report",
    description: "Analyze product performance and inventory levels",
    icon: Package,
    href: "/admin/dashboard/reports/products",
  },
  {
    title: "Customers Report",
    description: "Understand customer behavior and demographics",
    icon: Users,
    href: "/admin/dashboard/reports/customers",
  },
  {
    title: "Revenue Report",
    description: "Detailed revenue breakdown and financial insights",
    icon: DollarSign,
    href: "/admin/dashboard/reports/revenue",
  },
  {
    title: "Inventory Report",
    description: "Monitor stock levels, movement, and alerts",
    icon: Warehouse,
    href: "/admin/dashboard/reports/inventory",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Access detailed analytics and reports for your store."
        breadcrumbs={
          <AdminBreadcrumb items={[{ label: "Reports" }]} />
        }
      />

      <AdminContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="rounded-md bg-muted p-2">
                    <report.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </AdminContent>
    </div>
  );
}
