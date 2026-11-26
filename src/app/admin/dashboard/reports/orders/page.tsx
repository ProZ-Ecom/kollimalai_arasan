"use client";

import { CheckCircle2, Clock, ShoppingCart, Truck, XCircle } from "lucide-react";
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
  TrendChart,
  compareLabelFor,
  count,
  dateLabel,
  days,
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
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from "@/features/reports/lib/report-labels";
import type {
  DeliveryPartnerRow,
  OrderListRow,
  OrdersReport,
  ReturnReasonRow,
  StatusRow,
} from "@/features/reports/services/orders-report.service";

const statusColumns = (header: string): Column<StatusRow>[] => [
  { header, cell: (r) => r.label, exportValue: (r) => r.label },
  {
    header: "Orders",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Value",
    align: "right",
    cell: (r) => moneyExact(r.value),
    exportValue: (r) => r.value,
  },
  {
    header: "Share",
    align: "right",
    cell: (r) => <ShareBar share={r.share} />,
    exportValue: (r) => r.share,
  },
];

const partnerColumns: Column<DeliveryPartnerRow>[] = [
  { header: "Partner", cell: (r) => r.partner, exportValue: (r) => r.partner },
  {
    header: "Shipments",
    align: "right",
    cell: (r) => count(r.shipments),
    exportValue: (r) => r.shipments,
  },
  {
    header: "Delivered",
    align: "right",
    cell: (r) => count(r.delivered),
    exportValue: (r) => r.delivered,
  },
  {
    header: "In transit",
    align: "right",
    cell: (r) => count(r.inTransit),
    exportValue: (r) => r.inTransit,
  },
  {
    header: "Failed",
    align: "right",
    cell: (r) => count(r.failed),
    exportValue: (r) => r.failed,
  },
  {
    header: "Avg delivery",
    align: "right",
    cell: (r) =>
      r.avgDeliveryDays == null
        ? "—"
        : r.avgDeliveryDays < 1
          ? "Same day"
          : days(r.avgDeliveryDays),
    exportValue: (r) => r.avgDeliveryDays,
  },
];

const returnColumns: Column<ReturnReasonRow>[] = [
  { header: "Reason", cell: (r) => r.reason, exportValue: (r) => r.reason },
  { header: "Status", cell: (r) => r.status, exportValue: (r) => r.status },
  {
    header: "Requests",
    align: "right",
    cell: (r) => count(r.requests),
    exportValue: (r) => r.requests,
  },
  {
    header: "Refund value",
    align: "right",
    cell: (r) => moneyExact(r.refundValue),
    exportValue: (r) => r.refundValue,
  },
];

const orderColumns: Column<OrderListRow>[] = [
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
  { header: "Location", cell: (r) => r.location, exportValue: (r) => r.location },
  {
    header: "Status",
    cell: (r) => ORDER_STATUS_LABELS[r.status] ?? r.status,
    exportValue: (r) => ORDER_STATUS_LABELS[r.status] ?? r.status,
  },
  {
    header: "Payment",
    cell: (r) => PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus,
    exportValue: (r) =>
      PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus,
  },
  {
    header: "Items",
    align: "right",
    cell: (r) => count(r.items),
    exportValue: (r) => r.items,
  },
  {
    header: "Value",
    align: "right",
    cell: (r) => moneyExact(r.value),
    exportValue: (r) => r.value,
  },
  {
    header: "Delivered in",
    align: "right",
    cell: (r) =>
      r.deliveryDays == null
        ? "—"
        : r.deliveryDays < 1
          ? "Same day"
          : days(r.deliveryDays),
    exportValue: (r) => r.deliveryDays,
  },
];

export default function OrdersReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<OrdersReport>("/api/admin/reports/orders");
  const { data: options } = useReportOptions();

  const compare = data ? compareLabelFor(data.range.days) : undefined;

  return (
    <PageContainer
      title="Orders Report"
      description="Order pipeline stages, delivery speed, and cancellation/return tracking."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Orders" },
      ]}
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <ReportFilters
            value={filters}
            onChange={setFilters}
            extras={[
              {
                name: "status",
                label: "Order status",
                options: ORDER_STATUS_OPTIONS,
              },
              {
                name: "paymentStatus",
                label: "Payment status",
                options: PAYMENT_STATUS_OPTIONS,
              },
              {
                name: "deliveryPartner",
                label: "Delivery partner",
                options: options?.deliveryPartners ?? [],
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
                label="Total orders"
                value={count(data.totals.orders)}
                hint={money(data.totals.value)}
                delta={data.changes.orders}
                compareLabel={compare}
                icon={ShoppingCart}
              />
              <MetricCard
                label="Delivered"
                value={count(data.totals.delivered)}
                hint={`${percent(data.totals.fulfilmentRate)} fulfilment · ${money(data.totals.deliveredValue)}`}
                delta={data.changes.delivered}
                compareLabel={compare}
                icon={CheckCircle2}
                tone="good"
              />
              <MetricCard
                label="In progress"
                value={count(data.totals.inProgress)}
                hint="Pending through out for delivery"
                delta={data.changes.inProgress}
                compareLabel={compare}
                icon={Clock}
              />
              <MetricCard
                label="Cancelled"
                value={count(data.totals.cancelled)}
                hint={`${percent(data.totals.cancelRate)} of orders · ${money(data.totals.cancelledValue)}`}
                delta={data.changes.cancelled}
                compareLabel={compare}
                icon={XCircle}
                tone={data.totals.cancelled > 0 ? "bad" : "default"}
              />
              <MetricCard
                label="Returned"
                value={count(data.totals.returned)}
                hint={`${percent(data.totals.returnRate)} return rate`}
                delta={data.changes.returned}
                compareLabel={compare}
                tone={data.totals.returned > 0 ? "warn" : "default"}
              />
              <MetricCard
                label="Avg delivery time"
                value={
                  data.totals.avgDeliveryDays == null
                    ? "—"
                    : days(data.totals.avgDeliveryDays)
                }
                hint="Placed to delivered"
                delta={data.changes.avgDeliveryDays}
                compareLabel={compare}
                icon={Truck}
              />
            </div>

            <Panel
              title="Order flow over time"
              hint={`Placed, delivered, and cancelled/returned orders per ${data.range.bucket}.`}
            >
              <TrendChart
                data={data.trend}
                bucket={data.range.bucket}
                format={(n) => count(n)}
                series={[
                  {
                    key: "placed",
                    label: "Placed",
                    value: (r) => r.placed,
                    color: CHART_COLORS.blue,
                    kind: "bar",
                  },
                  {
                    key: "delivered",
                    label: "Delivered",
                    value: (r) => r.delivered,
                    color: CHART_COLORS.primary,
                  },
                  {
                    key: "cancelled",
                    label: "Cancelled / Returned",
                    value: (r) => r.cancelled,
                    color: CHART_COLORS.rose,
                  },
                ]}
              />
            </Panel>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="Order status mix"
                hint="Distribution of orders across fulfilment stages."
              >
                <DonutChart
                  slices={data.byStatus.map((s) => ({
                    key: s.status,
                    label: s.label,
                    value: s.orders,
                    color:
                      s.status === "delivered"
                        ? CHART_COLORS.primary
                        : s.status === "cancelled" || s.status === "returned"
                          ? CHART_COLORS.rose
                          : undefined,
                  }))}
                  format={(n) => count(n)}
                  centerLabel="Orders"
                  empty="No orders in this period."
                />
              </Panel>

              <Panel
                title="Delivery partner volume"
                hint="Shipments handled by each courier partner."
              >
                <HorizontalBarChart
                  items={data.byDeliveryPartner.map((p) => ({
                    key: p.key,
                    label: p.partner,
                    sublabel: `${p.delivered} delivered`,
                    value: p.shipments,
                  }))}
                  format={(n) => `${count(n)} shipments`}
                  color={CHART_COLORS.blue}
                  empty="No shipments in this period."
                />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="By order status"
                action={
                  <ExportButton
                    rows={data.byStatus}
                    columns={statusColumns("Status")}
                    fileName="orders-by-status"
                    sheetName="By Status"
                  />
                }
              >
                <ReportTable
                  rows={data.byStatus}
                  columns={statusColumns("Status")}
                  rowKey={(r) => r.status}
                  empty="No orders in this period."
                />
              </Panel>

              <Panel
                title="By payment status"
                action={
                  <ExportButton
                    rows={data.byPaymentStatus}
                    columns={statusColumns("Payment status")}
                    fileName="orders-by-payment-status"
                    sheetName="By Payment Status"
                  />
                }
              >
                <ReportTable
                  rows={data.byPaymentStatus}
                  columns={statusColumns("Payment status")}
                  rowKey={(r) => r.status}
                  empty="No orders in this period."
                />
              </Panel>

              <Panel
                title="By delivery partner"
                action={
                  <ExportButton
                    rows={data.byDeliveryPartner}
                    columns={partnerColumns}
                    fileName="orders-by-delivery-partner"
                    sheetName="Delivery Partners"
                  />
                }
              >
                <ReportTable
                  rows={data.byDeliveryPartner}
                  columns={partnerColumns}
                  rowKey={(r) => r.key}
                  empty="No shipments in this period."
                />
              </Panel>

              <Panel
                title="Return requests"
                hint="Grouped by customer reason and current request status."
                action={
                  <ExportButton
                    rows={data.returnReasons}
                    columns={returnColumns}
                    fileName="return-reasons"
                    sheetName="Return Reasons"
                  />
                }
              >
                <ReportTable
                  rows={data.returnReasons}
                  columns={returnColumns}
                  rowKey={(r, i) => `${r.reason}-${r.status}-${i}`}
                  empty="No return requests in this period."
                />
              </Panel>
            </div>

            <Panel
              title="Orders in period"
              hint={
                data.ordersTruncated
                  ? "Showing the latest 250 orders. Narrow the date range or filters to inspect older orders."
                  : "All matching orders in the selected period."
              }
              action={
                <ExportButton
                  rows={data.orders}
                  columns={orderColumns}
                  fileName="orders-report"
                  sheetName="Orders"
                />
              }
            >
              <ReportTable
                rows={data.orders}
                columns={orderColumns}
                rowKey={(r) => r.id}
                empty="No orders matched these filters."
                maxHeight="max-h-[30rem]"
              />
            </Panel>

            <Note>
              Unlike the Sales report, the Orders report includes cancelled and
              returned orders so fulfilment and loss rates remain accurate.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
