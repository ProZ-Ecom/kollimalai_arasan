"use client";

import { BarChart3, IndianRupee, Package, ShoppingCart } from "lucide-react";
import { PageContainer } from "@/components/admin/PageContainer";
import {
  CHART_COLORS,
  type Column,
  DonutChart,
  ExportButton,
  MetricCard,
  Note,
  Panel,
  RangeCaption,
  ReportError,
  ReportFilters,
  ReportSkeleton,
  ReportTable,
  ShareBar,
  TrendChart,
  compareLabelFor,
  count,
  money,
  moneyExact,
} from "@/features/reports/components/report-ui";
import {
  reportErrorMessage,
  useReport,
  useReportOptions,
} from "@/features/reports/hooks/use-report";
import type {
  CouponBreakdownRow,
  SalesBreakdownRow,
  SalesReport,
} from "@/features/reports/services/sales-report.service";

function breakdownColumns(
  firstHeader: string,
  showUnits = true
): Column<SalesBreakdownRow>[] {
  return [
    { header: firstHeader, cell: (r) => r.label, exportValue: (r) => r.label },
    {
      header: "Orders",
      align: "right",
      cell: (r) => count(r.orders),
      exportValue: (r) => r.orders,
    },
    ...(showUnits
      ? [
        {
          header: "Units",
          align: "right" as const,
          cell: (r: SalesBreakdownRow) => count(r.units),
          exportValue: (r: SalesBreakdownRow) => r.units,
        },
      ]
      : []),
    {
      header: "Sales",
      align: "right",
      cell: (r) => moneyExact(r.netSales),
      exportValue: (r) => r.netSales,
    },
    {
      header: "Share",
      align: "right",
      cell: (r) => <ShareBar share={r.share} />,
      exportValue: (r) => r.share,
    },
  ];
}

const couponColumns: Column<CouponBreakdownRow>[] = [
  {
    header: "Coupon",
    cell: (r) => <span className="font-mono text-xs font-semibold">{r.code}</span>,
    exportValue: (r) => r.code,
  },
  {
    header: "Orders",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Discount given",
    align: "right",
    cell: (r) => moneyExact(r.discountGiven),
    exportValue: (r) => r.discountGiven,
  },
  {
    header: "Net sales",
    align: "right",
    cell: (r) => moneyExact(r.netSales),
    exportValue: (r) => r.netSales,
  },
  {
    header: "Share",
    align: "right",
    cell: (r) => <ShareBar share={r.share} />,
    exportValue: (r) => r.share,
  },
];

export default function SalesReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<SalesReport>("/api/admin/reports/sales");
  const { data: options } = useReportOptions();

  const compare = data ? compareLabelFor(data.range.days) : undefined;

  return (
    <PageContainer
      title="Sales Report"
      description="How much you sold, what drove it, and how it compares with the previous period."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Sales" },
      ]}
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <ReportFilters
            value={filters}
            onChange={setFilters}
            extras={[
              {
                name: "coupon",
                label: "Coupon",
                options: options?.coupons ?? [],
              },
            ]}
          />
        </Panel>

        {error ? (
          <ReportError
            message={reportErrorMessage(error)}
            onRetry={() => refetch()}
          />
        ) : isLoading || !data ? (
          <ReportSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RangeCaption
                from={data.range.from}
                to={data.range.to}
                days={data.range.days}
              />
              {isFetching && (
                <span className="text-xs text-neutral-400">Updating…</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Net sales"
                value={money(data.totals.netSales)}
                hint="Total billed, delivery included"
                delta={data.changes.netSales}
                compareLabel={compare}
                icon={IndianRupee}
                tone="good"
              />
              <MetricCard
                label="Orders"
                value={count(data.totals.orders)}
                hint="Excludes cancelled & returned"
                delta={data.changes.orders}
                compareLabel={compare}
                icon={ShoppingCart}
              />
              <MetricCard
                label="Average order"
                value={money(data.totals.avgOrderValue)}
                hint="Net sales ÷ orders"
                delta={data.changes.avgOrderValue}
                compareLabel={compare}
                icon={BarChart3}
              />
              <MetricCard
                label="Units sold"
                value={count(data.totals.units)}
                hint="Across all order items"
                delta={data.changes.units}
                compareLabel={compare}
                icon={Package}
              />
              <MetricCard
                label="Product value"
                value={money(data.totals.grossSales)}
                hint="Subtotal before discount & delivery"
                delta={data.changes.grossSales}
                compareLabel={compare}
              />
              <MetricCard
                label="Discount given"
                value={money(data.totals.discount)}
                hint="Coupons and offers combined"
                delta={data.changes.discount}
                compareLabel={compare}
                tone="warn"
              />
              <MetricCard
                label="Tax collected"
                value={money(data.totals.tax)}
                delta={data.changes.tax}
                compareLabel={compare}
              />
              <MetricCard
                label="Delivery charged"
                value={money(data.totals.shipping)}
                delta={data.changes.shipping}
                compareLabel={compare}
              />
            </div>

            <Panel
              title="Sales over time"
              hint={`Grouped by ${data.range.bucket}. Hover to inspect exact figures.`}
            >
              <TrendChart
                data={data.trend}
                bucket={data.range.bucket}
                format={(n) => money(n)}
                series={[
                  {
                    key: "net",
                    label: "Net sales",
                    value: (r) => r.netSales,
                    color: CHART_COLORS.primary,
                  },
                  {
                    key: "gross",
                    label: "Product value",
                    value: (r) => r.grossSales,
                    color: CHART_COLORS.teal,
                  },
                ]}
              />
            </Panel>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="Orders over time"
                hint={`Order volume per ${data.range.bucket}.`}
              >
                <TrendChart
                  data={data.trend}
                  bucket={data.range.bucket}
                  format={(n) => count(n)}
                  height={230}
                  series={[
                    {
                      key: "orders",
                      label: "Orders",
                      value: (r) => r.orders,
                      color: CHART_COLORS.violet,
                      kind: "bar",
                    },
                  ]}
                />
              </Panel>

              <Panel
                title="Category sales share"
                hint="Proportion of item sales across categories."
              >
                <DonutChart
                  slices={data.byCategory.map((c) => ({
                    key: c.key,
                    label: c.label,
                    value: c.netSales,
                  }))}
                  format={(n) => money(n)}
                  centerLabel="Item Sales"
                  empty="No category sales in this period."
                />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="By category"
                hint="Share is calculated on item sales value."
                action={
                  <ExportButton
                    rows={data.byCategory}
                    columns={breakdownColumns("Category")}
                    fileName="sales-by-category"
                    sheetName="By Category"
                  />
                }
              >
                <ReportTable
                  rows={data.byCategory}
                  columns={breakdownColumns("Category")}
                  rowKey={(r) => r.key}
                  empty="No category sales in this period."
                />
              </Panel>

              <Panel
                title="By brand"
                action={
                  <ExportButton
                    rows={data.byBrand}
                    columns={breakdownColumns("Brand")}
                    fileName="sales-by-brand"
                    sheetName="By Brand"
                  />
                }
              >
                <ReportTable
                  rows={data.byBrand}
                  columns={breakdownColumns("Brand")}
                  rowKey={(r) => r.key}
                  empty="No brand sales in this period."
                />
              </Panel>

              <Panel
                title="By coupon"
                hint="Orders that used a promo code in this period."
                action={
                  <ExportButton
                    rows={data.byCoupon}
                    columns={couponColumns}
                    fileName="sales-by-coupon"
                    sheetName="By Coupon"
                  />
                }
              >
                <ReportTable
                  rows={data.byCoupon}
                  columns={couponColumns}
                  rowKey={(r) => r.key}
                  empty="No coupon orders in this period."
                />
              </Panel>

              <Panel
                title="Top products"
                hint="Top 10 products by item revenue."
                action={
                  <ExportButton
                    rows={data.topProducts}
                    columns={breakdownColumns("Product")}
                    fileName="top-products"
                    sheetName="Top Products"
                  />
                }
              >
                <ReportTable
                  rows={data.topProducts}
                  columns={breakdownColumns("Product")}
                  rowKey={(r) => r.key}
                  empty="No products sold in this period."
                />
              </Panel>

              <Panel
                title="Top customers"
                hint="Top 10 buyers by net spend in this period."
                className="lg:col-span-2"
                action={
                  <ExportButton
                    rows={data.topCustomers}
                    columns={breakdownColumns("Customer", false)}
                    fileName="top-customers"
                    sheetName="Top Customers"
                  />
                }
              >
                <ReportTable
                  rows={data.topCustomers}
                  columns={breakdownColumns("Customer", false)}
                  rowKey={(r) => r.key}
                  empty="No customer orders in this period."
                />
              </Panel>
            </div>

            <Note>
              Cancelled and returned orders are excluded from every figure on this
              page. Open the Orders report to inspect cancellations and returns.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
