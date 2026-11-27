"use client";

import { AlertTriangle, Archive, PackageX, Warehouse } from "lucide-react";
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
  count,
  dateLabel,
  formatExportDateTime,
  money,
  moneyExact,
} from "@/features/reports/components/report-ui";
import {
  reportErrorMessage,
  useReport,
  useReportOptions,
} from "@/features/reports/hooks/use-report";
import { INVENTORY_TX_TYPE_LABELS } from "@/features/reports/lib/report-labels";
import type {
  InventoryReport,
  LedgerRow,
  MovementRow,
  StockRow,
} from "@/features/reports/services/inventory-report.service";

const BUCKET_OPTIONS = [
  { value: "low", label: "Low stock only" },
  { value: "out", label: "Out of stock only" },
  { value: "dead", label: "Dead stock (90d+)" },
];

function StatusPill({ status }: { status: StockRow["status"] }) {
  const map = {
    out: { label: "Out of stock", cls: "bg-rose-50 text-rose-700" },
    low: { label: "Low stock", cls: "bg-amber-50 text-amber-700" },
    ok: { label: "In stock", cls: "bg-emerald-50 text-emerald-700" },
  }[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map.cls}`}
    >
      {map.label}
    </span>
  );
}

const stockColumns: Column<StockRow>[] = [
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
    header: "Status",
    cell: (r) => <StatusPill status={r.status} />,
    exportValue: (r) => r.status,
  },
  {
    header: "On hand",
    align: "right",
    cell: (r) => count(r.onHand),
    exportValue: (r) => r.onHand,
  },
  {
    header: "Reserved",
    align: "right",
    cell: (r) => count(r.reserved),
    exportValue: (r) => r.reserved,
  },
  {
    header: "Sellable",
    align: "right",
    cell: (r) => count(r.sellable),
    exportValue: (r) => r.sellable,
  },
  {
    header: "Reorder at",
    align: "right",
    cell: (r) => count(r.reorderLevel),
    exportValue: (r) => r.reorderLevel,
  },
  {
    header: "Base price",
    align: "right",
    cell: (r) => moneyExact(r.price),
    exportValue: (r) => r.price,
  },
  {
    header: "Stock value",
    align: "right",
    cell: (r) => moneyExact(r.valueAtPrice),
    exportValue: (r) => r.valueAtPrice,
  },
  {
    header: "Sold in period",
    align: "right",
    cell: (r) => count(r.soldInRange),
    exportValue: (r) => r.soldInRange,
  },
  {
    header: "Last movement",
    cell: (r) => dateLabel(r.lastMovementAt),
    exportValue: (r) => formatExportDateTime(r.lastMovementAt),
  },
];

const alertColumns: Column<StockRow>[] = [
  {
    header: "SKU",
    cell: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    exportValue: (r) => r.sku,
  },
  { header: "Product", cell: (r) => r.product, exportValue: (r) => r.product },
  {
    header: "Pack size",
    cell: (r) => r.packSize,
    exportValue: (r) => r.packSize,
  },
  {
    header: "On hand",
    align: "right",
    cell: (r) => count(r.onHand),
    exportValue: (r) => r.onHand,
  },
  {
    header: "Reorder at",
    align: "right",
    cell: (r) => count(r.reorderLevel),
    exportValue: (r) => r.reorderLevel,
  },
  {
    header: "Sold in period",
    align: "right",
    cell: (r) => count(r.soldInRange),
    exportValue: (r) => r.soldInRange,
  },
  {
    header: "Last movement",
    cell: (r) => dateLabel(r.lastMovementAt),
    exportValue: (r) => formatExportDateTime(r.lastMovementAt),
  },
];

const movementColumns: Column<MovementRow>[] = [
  { header: "Movement", cell: (r) => r.label, exportValue: (r) => r.label },
  {
    header: "Entries",
    align: "right",
    cell: (r) => count(r.entries),
    exportValue: (r) => r.entries,
  },
  {
    header: "Units",
    align: "right",
    cell: (r) => count(r.units),
    exportValue: (r) => r.units,
  },
];

const ledgerColumns: Column<LedgerRow>[] = [
  {
    header: "Date",
    cell: (r) => dateLabel(r.at),
    exportValue: (r) => formatExportDateTime(r.at),
  },
  {
    header: "SKU",
    cell: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    exportValue: (r) => r.sku,
  },
  {
    header: "Type",
    cell: (r) => INVENTORY_TX_TYPE_LABELS[r.type] ?? r.type,
    exportValue: (r) => INVENTORY_TX_TYPE_LABELS[r.type] ?? r.type,
  },
  {
    header: "Qty",
    align: "right",
    cell: (r) => (
      <span
        className={
          r.type === "in" || r.type === "released"
            ? "font-semibold text-emerald-700"
            : "font-semibold text-rose-700"
        }
      >
        {r.type === "in" || r.type === "released" ? "+" : "−"}
        {count(Math.abs(r.quantity))}
      </span>
    ),
    exportValue: (r) => r.quantity,
  },
  {
    header: "Reference",
    cell: (r) =>
      r.referenceType
        ? r.referenceId
          ? `${r.referenceType} #${r.referenceId}`
          : r.referenceType
        : "—",
    exportValue: (r) =>
      r.referenceType
        ? r.referenceId
          ? `${r.referenceType} #${r.referenceId}`
          : r.referenceType
        : "",
  },
  { header: "Note", cell: (r) => r.note ?? "—", exportValue: (r) => r.note },
  { header: "By", cell: (r) => r.actor ?? "—", exportValue: (r) => r.actor },
];

export default function InventoryReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<InventoryReport>("/api/admin/reports/inventory");
  const { data: options } = useReportOptions();

  return (
    <PageContainer
      title="Inventory Report"
      description="Live stock health, valuation at retail base price, restock alerts, and movement ledger."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Inventory" },
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
              {
                name: "bucket",
                label: "Stock filter",
                options: BUCKET_OPTIONS,
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Stock value (retail)"
                value={money(data.totals.valueAtPrice)}
                hint={`${count(data.totals.skus)} active SKUs`}
                icon={Warehouse}
                tone="good"
              />
              <MetricCard
                label="Units on hand"
                value={count(data.totals.unitsOnHand)}
                hint={`${count(data.totals.unitsSellable)} sellable · ${count(data.totals.unitsReserved)} reserved`}
              />
              <MetricCard
                label="Out of stock"
                value={count(data.totals.outOfStock)}
                hint="SKUs at 0 available"
                icon={PackageX}
                tone={data.totals.outOfStock > 0 ? "bad" : "default"}
              />
              <MetricCard
                label="Low & dead stock"
                value={`${count(data.totals.lowStock)} / ${count(data.totals.deadStock)}`}
                hint="Low stock / 90-day dead stock"
                icon={AlertTriangle}
                tone={
                  data.totals.lowStock + data.totals.deadStock > 0
                    ? "warn"
                    : "default"
                }
              />
              <MetricCard
                label="Stock in (period)"
                value={count(data.totals.movementIn)}
                hint="Units added/released in period"
                tone="good"
              />
              <MetricCard
                label="Stock out (period)"
                value={count(data.totals.movementOut)}
                hint="Units deducted in period"
                icon={Archive}
              />
            </div>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
              <Panel
                title="Stock health breakdown"
                hint="Active SKUs grouped by current availability status."
              >
                <DonutChart
                  slices={[
                    {
                      key: "healthy",
                      label: "Healthy stock",
                      value: Math.max(
                        0,
                        data.totals.skus -
                          data.totals.outOfStock -
                          data.totals.lowStock
                      ),
                      color: CHART_COLORS.primary,
                    },
                    {
                      key: "low",
                      label: "Low stock",
                      value: data.totals.lowStock,
                      color: CHART_COLORS.amber,
                    },
                    {
                      key: "out",
                      label: "Out of stock",
                      value: data.totals.outOfStock,
                      color: CHART_COLORS.rose,
                    },
                  ]}
                  format={(n) => `${count(n)} SKUs`}
                  centerLabel="Active SKUs"
                  empty="No active SKUs found."
                />
              </Panel>

              <Panel
                title="Top SKUs by stock valuation"
                hint="Highest retail value currently held in inventory."
              >
                <HorizontalBarChart
                  items={data.rows.map((r) => ({
                    key: r.key,
                    label: `${r.product}${r.packSize ? ` · ${r.packSize}` : ""}`,
                    sublabel: `${count(r.onHand)} units`,
                    value: r.valueAtPrice,
                  }))}
                  format={(n) => money(n)}
                  color={CHART_COLORS.teal}
                  empty="No stock valuation data."
                />
              </Panel>
            </div>

            <Panel
              title="Stock valuation & levels"
              hint={
                data.rowsTruncated
                  ? "Showing top 1,000 SKUs by retail stock value."
                  : "Current live inventory quantities across active SKUs."
              }
              action={
                <ExportButton
                  rows={data.rows}
                  columns={stockColumns}
                  fileName="inventory-stock-report"
                  sheetName="Stock Levels"
                />
              }
            >
              <ReportTable
                rows={data.rows}
                columns={stockColumns}
                rowKey={(r) => r.key}
                empty="No SKUs matched these filters."
                maxHeight="max-h-[30rem]"
              />
            </Panel>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
              <Panel
                title="Out of stock alerts"
                action={
                  <ExportButton
                    rows={data.alerts.outOfStock}
                    columns={alertColumns}
                    fileName="out-of-stock-alerts"
                    sheetName="Out of Stock"
                  />
                }
              >
                <ReportTable
                  rows={data.alerts.outOfStock}
                  columns={alertColumns}
                  rowKey={(r) => r.key}
                  empty="No out-of-stock SKUs."
                  maxHeight="max-h-[22rem]"
                />
              </Panel>

              <Panel
                title="Low stock alerts"
                action={
                  <ExportButton
                    rows={data.alerts.lowStock}
                    columns={alertColumns}
                    fileName="low-stock-alerts"
                    sheetName="Low Stock"
                  />
                }
              >
                <ReportTable
                  rows={data.alerts.lowStock}
                  columns={alertColumns}
                  rowKey={(r) => r.key}
                  empty="No low-stock SKUs."
                  maxHeight="max-h-[22rem]"
                />
              </Panel>

              <Panel
                title="Dead stock (90+ days)"
                hint="SKUs with stock on hand, zero sales in period, and no movement for 90+ days."
                action={
                  <ExportButton
                    rows={data.alerts.deadStock}
                    columns={alertColumns}
                    fileName="dead-stock-alerts"
                    sheetName="Dead Stock"
                  />
                }
              >
                <ReportTable
                  rows={data.alerts.deadStock}
                  columns={alertColumns}
                  rowKey={(r) => r.key}
                  empty="No dead stock detected."
                  maxHeight="max-h-[22rem]"
                />
              </Panel>

              <Panel
                title="Movement summary"
                hint="Inventory transactions and manual adjustments in the selected window."
                action={
                  <ExportButton
                    rows={data.movements}
                    columns={movementColumns}
                    fileName="inventory-movements-summary"
                    sheetName="Movements"
                  />
                }
              >
                <ReportTable
                  rows={data.movements}
                  columns={movementColumns}
                  rowKey={(r) => r.key}
                  empty="No stock movements in this period."
                  maxHeight="max-h-[22rem]"
                />
              </Panel>
            </div>

            <Panel
              title="Recent stock ledger"
              hint={
                data.ledgerTruncated
                  ? "Showing the latest 200 inventory transactions in this period."
                  : "All inventory transactions in this period."
              }
              action={
                <ExportButton
                  rows={data.ledger}
                  columns={ledgerColumns}
                  fileName="inventory-ledger"
                  sheetName="Stock Ledger"
                />
              }
            >
              <ReportTable
                rows={data.ledger}
                columns={ledgerColumns}
                rowKey={(r) => r.id}
                empty="No stock transactions recorded in this period."
                maxHeight="max-h-[28rem]"
              />
            </Panel>

            <Note>
              Stock valuation multiplies available units by each pack size&apos;s
              base selling price. Sold-in-period and movement logs follow your
              selected date range.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
