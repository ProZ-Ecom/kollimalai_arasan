"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";

export default function InventoryReportPage() {
  return (
    <div>
      <AdminPageHeader
        title="Inventory Report"
        description="Monitor stock levels, movement, and alerts."
        breadcrumbs={
          <AdminBreadcrumb
            items={[
              { label: "Reports", href: "/admin/dashboard/reports" },
              { label: "Inventory Report" },
            ]}
          />
        }
      />

      <AdminContent>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Coming Soon
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This report is currently under development.
              </p>
            </div>
          </CardContent>
        </Card>
      </AdminContent>
    </div>
  );
}
