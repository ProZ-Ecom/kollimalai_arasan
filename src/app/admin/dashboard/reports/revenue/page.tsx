"use client";

import { CreditCard, IndianRupee, Receipt, Wallet } from "lucide-react";
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
  TrendChart,
  compareLabelFor,
  count,
  dateLabel,
  formatExportDateTime,
  money,
  moneyExact,
  percent,
} from "@/features/reports/components/report-ui";
import {
  reportErrorMessage,
  useReport,
  useReportOptions,
} from "@/features/reports/hooks/use-report";
import { ORDER_STATUS_LABELS } from "@/features/reports/lib/report-labels";
import type {
  OutstandingRow,
  PaymentMethodRow,
  PaymentStatusRow,
  RevenueReport,
  TaxRow,
} from "@/features/reports/services/revenue-report.service";

const taxColumns: Column<TaxRow>[] = [
  { header: "HSN", cell: (r) => r.hsnCode, exportValue: (r) => r.hsnCode },
  {
    header: "Description",
    cell: (r) => r.description,
    exportValue: (r) => r.description,
  },
  { header: "GST slab", cell: (r) => r.gstName, exportValue: (r) => r.gstName },
  {
    header: "CGST %",
    align: "right",
    cell: (r) => percent(r.cgst),
    exportValue: (r) => r.cgst,
  },
  {
    header: "SGST %",
    align: "right",
    cell: (r) => percent(r.sgst),
    exportValue: (r) => r.sgst,
  },
  {
    header: "IGST %",
    align: "right",
    cell: (r) => percent(r.igst),
    exportValue: (r) => r.igst,
  },
  {
    header: "Units",
    align: "right",
    cell: (r) => count(r.units),
    exportValue: (r) => r.units,
  },
  {
    header: "Taxable value",
    align: "right",
    cell: (r) => moneyExact(r.taxableValue),
    exportValue: (r) => r.taxableValue,
  },
  {
    header: "Tax",
    align: "right",
    cell: (r) => moneyExact(r.taxAmount),
    exportValue: (r) => r.taxAmount,
  },
];

const methodColumns: Column<PaymentMethodRow>[] = [
  { header: "Method", cell: (r) => r.label, exportValue: (r) => r.label },
  {
    header: "Payments",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Collected",
    align: "right",
    cell: (r) => moneyExact(r.amount),
    exportValue: (r) => r.amount,
  },
];

const statusColumns: Column<PaymentStatusRow>[] = [
  {
    header: "Payment status",
    cell: (r) => r.label,
    exportValue: (r) => r.label,
  },
  {
    header: "Orders",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Order value",
    align: "right",
    cell: (r) => moneyExact(r.value),
    exportValue: (r) => r.value,
  },
];

const outstandingColumns: Column<OutstandingRow>[] = [
  {
    header: "Order #",
    cell: (r) => <span className="font-semibold">{r.orderNumber}</span>,
    exportValue: (r) => r.orderNumber,
  },
  {
    header: "Placed",
    cell: (r) => dateLabel(r.placedAt),
    exportValue: (r) => formatExportDateTime(r.placedAt),
  },
  { header: "Customer", cell: (r) => r.customer, exportValue: (r) => r.customer },
  {
    header: "Order status",
    cell: (r) => ORDER_STATUS_LABELS[r.status] ?? r.status,
    exportValue: (r) => ORDER_STATUS_LABELS[r.status] ?? r.status,
  },
  {
    header: "Order value",
    align: "right",
    cell: (r) => moneyExact(r.value),
    exportValue: (r) => r.value,
  },
  {
    header: "Received",
    align: "right",
    cell: (r) => moneyExact(r.paid),
    exportValue: (r) => r.paid,
  },
  {
    header: "Still due",
    align: "right",
    cell: (r) => (
      <span className="font-semibold text-amber-700">{moneyExact(r.due)}</span>
    ),
    exportValue: (r) => r.due,
  },
];

export default function RevenueReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<RevenueReport>("/api/admin/reports/revenue");
  const { data: options } = useReportOptions();

  const compare = data ? compareLabelFor(data.range.days) : undefined;
  const taxTotal = data?.tax.reduce((s, r) => s + r.taxAmount, 0) ?? 0;
  const unmapped = data?.tax.find((r) => r.hsnCode === "Not mapped");

  return (
    <PageContainer
      title="Revenue Report"
      description="Billed revenue, collected payments, refunds, outstanding dues, and HSN-wise GST summary."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Revenue" },
      ]}
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <ReportFilters
            value={filters}
            onChange={setFilters}
            extras={[
              {
                name: "paymentMethod",
                label: "Payment method",
                options: options?.paymentMethods ?? [],
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
                label="Net revenue"
                value={money(data.totals.netRevenue)}
                hint="Billed on non-cancelled orders"
                delta={data.changes.netRevenue}
                compareLabel={compare}
                icon={IndianRupee}
                tone="good"
              />
              <MetricCard
                label="Collected"
                value={money(data.totals.collected)}
                hint="Successful payments received"
                delta={data.changes.collected}
                compareLabel={compare}
                icon={Wallet}
                tone="good"
              />
              <MetricCard
                label="Still to collect"
                value={money(data.totals.outstanding)}
                hint="Net revenue minus collected"
                delta={data.changes.outstanding}
                compareLabel={compare}
                icon={CreditCard}
                tone={data.totals.outstanding > 0 ? "warn" : "default"}
              />
              <MetricCard
                label="Refunded"
                value={money(data.totals.refunded)}
                hint="Completed refunds in period"
                delta={data.changes.refunded}
                compareLabel={compare}
                tone={data.totals.refunded > 0 ? "warn" : "default"}
              />
              <MetricCard
                label="Product value"
                value={money(data.totals.grossSales)}
                hint="Subtotal before discount & tax"
                delta={data.changes.grossSales}
                compareLabel={compare}
              />
              <MetricCard
                label="Discount given"
                value={money(data.totals.discount)}
                hint={`${money(data.totals.coupons)} from coupons`}
                delta={data.changes.discount}
                compareLabel={compare}
                tone="warn"
              />
              <MetricCard
                label="Tax collected"
                value={money(data.totals.tax)}
                hint="GST payable on sold items"
                delta={data.changes.tax}
                compareLabel={compare}
                icon={Receipt}
              />
              <MetricCard
                label="Net cash inflow"
                value={money(data.totals.netInflow)}
                hint="Collected minus completed refunds"
                delta={data.changes.netInflow}
                compareLabel={compare}
                tone={data.totals.netInflow >= 0 ? "good" : "bad"}
              />
            </div>

            <Panel
              title="Revenue over time"
              hint={`Net revenue, tax, and discount per ${data.range.bucket}.`}
            >
              <TrendChart
                data={data.trend}
                bucket={data.range.bucket}
                format={(n) => money(n)}
                series={[
                  {
                    key: "net",
                    label: "Net revenue",
                    value: (r) => r.netRevenue,
                    color: CHART_COLORS.primary,
                  },
                  {
                    key: "tax",
                    label: "Tax",
                    value: (r) => r.tax,
                    color: CHART_COLORS.amber,
                  },
                  {
                    key: "discount",
                    label: "Discount",
                    value: (r) => r.discount,
                    color: CHART_COLORS.rose,
                  },
                ]}
              />
            </Panel>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
              <Panel
                title="Collection by payment method"
                hint="Share of successful payments collected."
              >
                <DonutChart
                  slices={data.paymentMethods.map((m) => ({
                    key: m.code,
                    label: m.label,
                    value: m.amount,
                  }))}
                  format={(n) => money(n)}
                  centerLabel="Collected"
                  empty="No successful payments recorded in this period."
                />
              </Panel>

              <Panel
                title="Top HSN tax contribution"
                hint="Highest tax-generating HSN codes."
              >
                <HorizontalBarChart
                  items={data.tax.map((t) => ({
                    key: t.hsnCode,
                    label: t.hsnCode,
                    sublabel: t.gstName !== "—" ? t.gstName : undefined,
                    value: t.taxAmount,
                  }))}
                  format={(n) => moneyExact(n)}
                  color={CHART_COLORS.amber}
                  empty="No tax collected in this period."
                />
              </Panel>
            </div>

            <Panel
              title="Tax summary by HSN"
              hint={`Taxable value is line total minus tax. Total item tax in period: ${moneyExact(taxTotal)}.`}
              action={
                <ExportButton
                  rows={data.tax}
                  columns={taxColumns}
                  fileName="tax-summary-by-hsn"
                  sheetName="HSN Tax Summary"
                />
              }
            >
              <ReportTable
                rows={data.tax}
                columns={taxColumns}
                rowKey={(r) => r.hsnCode}
                empty="No taxable sales in this period."
                maxHeight="max-h-[28rem]"
              />
            </Panel>

            {unmapped && (
              <Note tone="warn">
                {moneyExact(unmapped.taxableValue)} of taxable value sits under
                “Not mapped” because those products do not have an HSN code
                assigned yet.
              </Note>
            )}

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
              <Panel
                title="By payment method"
                hint="Successful payments recorded in this period."
                action={
                  <ExportButton
                    rows={data.paymentMethods}
                    columns={methodColumns}
                    fileName="payment-methods"
                    sheetName="Payment Methods"
                  />
                }
              >
                <ReportTable
                  rows={data.paymentMethods}
                  columns={methodColumns}
                  rowKey={(r) => r.code}
                  empty="No successful payments recorded in this period."
                />
              </Panel>

              <Panel
                title="Orders by payment status"
                action={
                  <ExportButton
                    rows={data.paymentStatus}
                    columns={statusColumns}
                    fileName="payment-statuses"
                    sheetName="Payment Status"
                  />
                }
              >
                <ReportTable
                  rows={data.paymentStatus}
                  columns={statusColumns}
                  rowKey={(r) => r.status}
                  empty="No orders in this period."
                />
              </Panel>
            </div>

            <Panel
              title="Orders still to collect"
              hint={
                data.outstandingTruncated
                  ? "Showing the top 300 unpaid/partial orders. Narrow the date range to inspect more."
                  : "Non-cancelled orders where successful payments do not yet cover the order total."
              }
              action={
                <ExportButton
                  rows={data.outstanding}
                  columns={outstandingColumns}
                  fileName="outstanding-orders"
                  sheetName="Outstanding Orders"
                />
              }
            >
              <ReportTable
                rows={data.outstanding}
                columns={outstandingColumns}
                rowKey={(r) => r.id}
                empty="All orders in this period are fully paid."
                maxHeight="max-h-[28rem]"
              />
            </Panel>

            <Note>
              Net revenue counts orders placed in this period, whereas refunds
              count completed refund transactions created in this period.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
