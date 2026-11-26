"use client";

import { Package, PackageX, Percent, RotateCcw } from "lucide-react";
import { PageContainer } from "@/components/admin/PageContainer";
import {
  CHART_COLORS,
  type Column,
  DonutChart,
  ExportButton,
  HorizontalBarChart,
  MetricCard,
  Note,
  Panel,
  RangeCaption,
  ReportError,
  ReportFilters,
  ReportSkeleton,
  ReportTable,
  ShareBar,
  count,
  money,
  moneyExact,
  percent,
} from "@/features/reports/components/report-ui";
import {
  reportErrorMessage,
  useReport,
  useReportOptions,
} from "@/features/reports/hooks/use-report";
import type {
  GroupRow,
  ProductsReport,
  SkuRow,
} from "@/features/reports/services/products-report.service";

const skuColumns: Column<SkuRow>[] = [
  {
    header: "SKU",
    cell: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    exportValue: (r) => r.sku,
  },
  { header: "Product", cell: (r) => r.product, exportValue: (r) => r.product },
  { header: "Variant", cell: (r) => r.variant, exportValue: (r) => r.variant },
  {
    header: "Pack size",
    cell: (r) => r.packSize,
    exportValue: (r) => r.packSize,
  },
  { header: "Category", cell: (r) => r.category, exportValue: (r) => r.category },
  { header: "Brand", cell: (r) => r.brand, exportValue: (r) => r.brand },
  {
    header: "Units",
    align: "right",
    cell: (r) => count(r.units),
    exportValue: (r) => r.units,
  },
  {
    header: "Orders",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Revenue",
    align: "right",
    cell: (r) => moneyExact(r.revenue),
    exportValue: (r) => r.revenue,
  },
  {
    header: "Discounts",
    align: "right",
    cell: (r) => moneyExact(r.discounts),
    exportValue: (r) => r.discounts,
  },
  {
    header: "Returned",
    align: "right",
    cell: (r) => count(r.returnedUnits),
    exportValue: (r) => r.returnedUnits,
  },
  {
    header: "In stock",
    align: "right",
    cell: (r) => count(r.stock),
    exportValue: (r) => r.stock,
  },
];

const groupColumns = (header: string): Column<GroupRow>[] => [
  { header, cell: (r) => r.label, exportValue: (r) => r.label },
  {
    header: "SKUs",
    align: "right",
    cell: (r) => count(r.skus),
    exportValue: (r) => r.skus,
  },
  {
    header: "Units",
    align: "right",
    cell: (r) => count(r.units),
    exportValue: (r) => r.units,
  },
  {
    header: "Revenue",
    align: "right",
    cell: (r) => moneyExact(r.revenue),
    exportValue: (r) => r.revenue,
  },
  {
    header: "Share",
    align: "right",
    cell: (r) => <ShareBar share={r.share} />,
    exportValue: (r) => r.share,
  },
];

export default function ProductsReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<ProductsReport>("/api/admin/reports/products");
  const { data: options } = useReportOptions();

  return (
    <PageContainer
      title="Products Report"
      description="SKU-level sales performance, category/brand share, returns, and zero-sale items."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Products" },
      ]}
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <ReportFilters
            value={filters}
            onChange={setFilters}
            extras={[
              {
                name: "category",
                label: "Category",
                options: options?.categories ?? [],
              },
              {
                name: "brand",
                label: "Brand",
                options: options?.brands ?? [],
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
                label="SKUs sold"
                value={count(data.totals.skusSold)}
                hint={`${count(data.totals.units)} total units`}
                icon={Package}
              />
              <MetricCard
                label="Item revenue"
                value={money(data.totals.revenue)}
                hint="Total item price across sold lines"
                tone="good"
              />
              <MetricCard
                label="Item discounts"
                value={money(data.totals.discounts)}
                hint="Line-level discounts applied"
                tone="warn"
              />
              <MetricCard
                label="Item tax"
                value={money(data.totals.tax)}
                hint="GST collected on sold items"
                icon={Percent}
              />
              <MetricCard
                label="Returned units"
                value={count(data.totals.returnedUnits)}
                hint={`${percent(data.totals.returnRate)} return rate`}
                icon={RotateCcw}
                tone={data.totals.returnedUnits > 0 ? "warn" : "default"}
              />
              <MetricCard
                label="Zero-sale SKUs"
                value={count(data.totals.zeroSaleSkus)}
                hint="Active SKUs with 0 units sold"
                icon={PackageX}
                tone={data.totals.zeroSaleSkus > 0 ? "warn" : "default"}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="Top selling SKUs"
                hint="Highest revenue-generating SKUs in this period."
              >
                <HorizontalBarChart
                  items={data.bestSellers.map((s) => ({
                    key: s.key,
                    label: `${s.product}${s.packSize !== "—" ? ` · ${s.packSize}` : ""}`,
                    sublabel: `${count(s.units)} units`,
                    value: s.revenue,
                  }))}
                  format={(n) => moneyExact(n)}
                  color={CHART_COLORS.primary}
                  empty="No SKUs sold in this period."
                />
              </Panel>

              <Panel
                title="Revenue share by category"
                hint="Distribution of item revenue across categories."
              >
                <DonutChart
                  slices={data.byCategory.map((c) => ({
                    key: c.key,
                    label: c.label,
                    value: c.revenue,
                  }))}
                  format={(n) => money(n)}
                  centerLabel="Revenue"
                  empty="No category sales in this period."
                />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="By category"
                action={
                  <ExportButton
                    rows={data.byCategory}
                    columns={groupColumns("Category")}
                    fileName="products-by-category"
                    sheetName="By Category"
                  />
                }
              >
                <ReportTable
                  rows={data.byCategory}
                  columns={groupColumns("Category")}
                  rowKey={(r) => r.key}
                  empty="No category sales in this period."
                />
              </Panel>

              <Panel
                title="By brand"
                action={
                  <ExportButton
                    rows={data.byBrand}
                    columns={groupColumns("Brand")}
                    fileName="products-by-brand"
                    sheetName="By Brand"
                  />
                }
              >
                <ReportTable
                  rows={data.byBrand}
                  columns={groupColumns("Brand")}
                  rowKey={(r) => r.key}
                  empty="No brand sales in this period."
                />
              </Panel>

              <Panel
                title="Best sellers"
                hint="Top 10 SKUs by revenue."
                action={
                  <ExportButton
                    rows={data.bestSellers}
                    columns={skuColumns}
                    fileName="best-selling-skus"
                    sheetName="Best Sellers"
                  />
                }
              >
                <ReportTable
                  rows={data.bestSellers}
                  columns={skuColumns}
                  rowKey={(r) => r.key}
                  empty="No SKUs sold in this period."
                />
              </Panel>

              <Panel
                title="Slow movers"
                hint="Lowest-volume SKUs among items that sold at least once."
                action={
                  <ExportButton
                    rows={data.slowMovers}
                    columns={skuColumns}
                    fileName="slow-moving-skus"
                    sheetName="Slow Movers"
                  />
                }
              >
                <ReportTable
                  rows={data.slowMovers}
                  columns={skuColumns}
                  rowKey={(r) => r.key}
                  empty="No SKUs sold in this period."
                />
              </Panel>
            </div>

            <Panel
              title="All sold SKUs"
              hint={
                data.skusTruncated
                  ? "Showing the top 1,000 SKUs by revenue."
                  : "Every SKU with at least one sale in this period."
              }
              action={
                <ExportButton
                  rows={data.skus}
                  columns={skuColumns}
                  fileName="products-sku-report"
                  sheetName="Sold SKUs"
                />
              }
            >
              <ReportTable
                rows={data.skus}
                columns={skuColumns}
                rowKey={(r) => r.key}
                empty="No SKU sales in this period."
                maxHeight="max-h-[30rem]"
              />
            </Panel>

            <Panel
              title="Zero-sale active SKUs"
              hint={
                data.zeroSaleTruncated
                  ? "Showing the first 100 active SKUs with zero sales."
                  : "Active SKUs that received zero orders in this period."
              }
              action={
                <ExportButton
                  rows={data.zeroSale}
                  columns={skuColumns}
                  fileName="zero-sale-skus"
                  sheetName="Zero Sale SKUs"
                />
              }
            >
              <ReportTable
                rows={data.zeroSale}
                columns={skuColumns}
                rowKey={(r) => r.key}
                empty="Every active SKU sold at least once in this period."
                maxHeight="max-h-[26rem]"
              />
            </Panel>

            <Note>
              Sales figures use line snapshots from non-cancelled orders. Stock
              reflects current live warehouse quantities.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
