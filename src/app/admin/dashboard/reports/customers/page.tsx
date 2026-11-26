"use client";

import { Repeat, UserPlus, Users } from "lucide-react";
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
import { reportErrorMessage, useReport } from "@/features/reports/hooks/use-report";
import type {
  CustomersReport,
  GeoRow,
  TopCustomerRow,
} from "@/features/reports/services/customers-report.service";

const customerColumns: Column<TopCustomerRow>[] = [
  { header: "Customer", cell: (r) => r.name, exportValue: (r) => r.name },
  {
    header: "Cust ID",
    cell: (r) => r.custId ?? "—",
    exportValue: (r) => r.custId,
  },
  {
    header: "Phone",
    cell: (r) => r.phone ?? "—",
    exportValue: (r) => r.phone,
  },
  { header: "City", cell: (r) => r.city ?? "—", exportValue: (r) => r.city },
  {
    header: "Orders",
    align: "right",
    cell: (r) => count(r.orders),
    exportValue: (r) => r.orders,
  },
  {
    header: "Spent",
    align: "right",
    cell: (r) => moneyExact(r.revenue),
    exportValue: (r) => r.revenue,
  },
  {
    header: "Avg order",
    align: "right",
    cell: (r) => moneyExact(r.avgOrderValue),
    exportValue: (r) => r.avgOrderValue,
  },
  {
    header: "Last order",
    cell: (r) => dateLabel(r.lastOrderAt),
    exportValue: (r) => formatExportDateTime(r.lastOrderAt),
  },
  {
    header: "Since last order",
    align: "right",
    cell: (r) =>
      r.daysSinceLastOrder == null
        ? "—"
        : r.daysSinceLastOrder === 0
          ? "Today"
          : days(r.daysSinceLastOrder),
    exportValue: (r) => r.daysSinceLastOrder,
  },
];

const geoColumns = (header: string): Column<GeoRow>[] => [
  { header, cell: (r) => r.label, exportValue: (r) => r.label },
  {
    header: "Customers",
    align: "right",
    cell: (r) => count(r.customers),
    exportValue: (r) => r.customers,
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
    header: "Share",
    align: "right",
    cell: (r) => <ShareBar share={r.share} />,
    exportValue: (r) => r.share,
  },
];

export default function CustomersReportPage() {
  const { filters, setFilters, data, isLoading, isFetching, error, refetch } =
    useReport<CustomersReport>("/api/admin/reports/customers");

  const compare = data ? compareLabelFor(data.range.days) : undefined;

  return (
    <PageContainer
      title="Customers Report"
      description="Customer acquisition, repeat buying behavior, geographic reach, and retention risk."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Reports", href: "/admin/dashboard/reports" },
        { label: "Customers" },
      ]}
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <ReportFilters value={filters} onChange={setFilters} />
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
                label="New signups"
                value={count(data.totals.signups)}
                hint="Customer accounts created"
                delta={data.changes.signups}
                compareLabel={compare}
                icon={UserPlus}
              />
              <MetricCard
                label="Active buyers"
                value={count(data.totals.buyers)}
                hint={`${count(data.totals.newBuyers)} new · ${count(data.totals.returningBuyers)} returning`}
                delta={data.changes.buyers}
                compareLabel={compare}
                icon={Users}
              />
              <MetricCard
                label="Repeat rate"
                value={percent(data.totals.repeatRate)}
                hint="Share of buyers who ordered before"
                delta={data.changes.repeatRate}
                compareLabel={compare}
                icon={Repeat}
                tone="good"
              />
              <MetricCard
                label="Revenue per buyer"
                value={money(data.totals.revenuePerBuyer)}
                hint={`${data.totals.avgOrdersPerBuyer} avg orders / buyer`}
                delta={data.changes.revenuePerBuyer}
                compareLabel={compare}
                tone="good"
              />
            </div>

            <Panel
              title="Signups & buyers over time"
              hint={`Grouped by ${data.range.bucket}. New vs. returning buyers are classified against lifetime first order.`}
            >
              <TrendChart
                data={data.trend}
                bucket={data.range.bucket}
                format={(n) => count(n)}
                series={[
                  {
                    key: "signups",
                    label: "Signups",
                    value: (r) => r.signups,
                    color: CHART_COLORS.blue,
                    kind: "bar",
                  },
                  {
                    key: "newBuyers",
                    label: "New buyers",
                    value: (r) => r.newBuyers,
                    color: CHART_COLORS.primary,
                  },
                  {
                    key: "returningBuyers",
                    label: "Returning buyers",
                    value: (r) => r.returningBuyers,
                    color: CHART_COLORS.violet,
                  },
                ]}
              />
            </Panel>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="New vs. returning buyers"
                hint="Buyer mix in the selected period."
              >
                <DonutChart
                  slices={[
                    {
                      key: "new",
                      label: "New buyers",
                      value: data.totals.newBuyers,
                      color: CHART_COLORS.primary,
                    },
                    {
                      key: "returning",
                      label: "Returning buyers",
                      value: data.totals.returningBuyers,
                      color: CHART_COLORS.violet,
                    },
                  ]}
                  format={(n) => count(n)}
                  centerLabel="Buyers"
                  empty="No buyers in this period."
                />
              </Panel>

              <Panel
                title="Top states by revenue"
                hint="Highest-ordering shipping states."
              >
                <HorizontalBarChart
                  items={data.byState.map((s) => ({
                    key: s.key,
                    label: s.label,
                    sublabel: `${count(s.orders)} orders`,
                    value: s.revenue,
                  }))}
                  format={(n) => money(n)}
                  color={CHART_COLORS.teal}
                  empty="No state delivery data in this period."
                />
              </Panel>
            </div>

            <Panel
              title="Top customers"
              hint="Top 25 buyers by spend in this period."
              action={
                <ExportButton
                  rows={data.topCustomers}
                  columns={customerColumns}
                  fileName="top-customers-report"
                  sheetName="Top Customers"
                />
              }
            >
              <ReportTable
                rows={data.topCustomers}
                columns={customerColumns}
                rowKey={(r) => r.id}
                empty="No customers placed orders in this period."
                maxHeight="max-h-[28rem]"
              />
            </Panel>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel
                title="By state"
                hint="Based on shipping addresses on orders."
                action={
                  <ExportButton
                    rows={data.byState}
                    columns={geoColumns("State")}
                    fileName="customers-by-state"
                    sheetName="By State"
                  />
                }
              >
                <ReportTable
                  rows={data.byState}
                  columns={geoColumns("State")}
                  rowKey={(r) => r.key}
                  empty="No state delivery data in this period."
                />
              </Panel>

              <Panel
                title="By city"
                action={
                  <ExportButton
                    rows={data.byCity}
                    columns={geoColumns("City")}
                    fileName="customers-by-city"
                    sheetName="By City"
                  />
                }
              >
                <ReportTable
                  rows={data.byCity}
                  columns={geoColumns("City")}
                  rowKey={(r) => r.key}
                  empty="No city delivery data in this period."
                />
              </Panel>
            </div>

            <Panel
              title="Churn-risk customers"
              hint="Past buyers with no order in the last 90 days, ranked by lifetime spend."
              action={
                <ExportButton
                  rows={data.churnRisk}
                  columns={customerColumns}
                  fileName="churn-risk-customers"
                  sheetName="Churn Risk"
                />
              }
            >
              <ReportTable
                rows={data.churnRisk}
                columns={customerColumns}
                rowKey={(r) => r.id}
                empty="No inactive repeat buyers beyond 90 days."
                maxHeight="max-h-[26rem]"
              />
            </Panel>

            <Note>
              A buyer is counted as “new” when their first non-cancelled order
              falls inside the selected date window.
            </Note>
          </>
        )}
      </div>
    </PageContainer>
  );
}
