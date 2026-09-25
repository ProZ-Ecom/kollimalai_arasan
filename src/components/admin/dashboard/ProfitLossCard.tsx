"use client";

import { DollarSign, TrendingUp, AlertCircle, Percent, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DashboardFinancials } from "@/features/dashboard/api/get-stats";

interface ProfitLossCardProps {
  financials: DashboardFinancials;
  periodLabel: string;
}

export function ProfitLossCard({ financials, periodLabel }: ProfitLossCardProps) {
  const {
    grossSales,
    discounts,
    cancelledLoss,
    refundsTotal,
    tax,
    shipping,
    netRealizedRevenue,
    realizationRate,
  } = financials;

  const totalLoss = cancelledLoss + refundsTotal;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-neutral-100)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Profit & Loss Overview
              </h3>
              <p className="text-xs text-neutral-500">{periodLabel} Performance</p>
            </div>
          </div>

        </div>

        {/* Big Net Revenue Callout */}
        <div className="my-5 rounded-xl bg-gradient-to-br from-secondary-50/70 via-cream-50 to-primary-50/50 p-4 border border-secondary-100/60">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Net Realized Operating Revenue
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-neutral-900">
              {formatPrice(netRealizedRevenue)}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-secondary-700">
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              Healthy Inflow
            </span>
          </div>
          {/* Progress retention bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Gross Sales Retained</span>
              <span className="font-semibold text-neutral-700">{realizationRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-secondary-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, realizationRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ledger Breakdown */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between py-1 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-600">
              <ArrowUpRight className="h-4 w-4 text-secondary-600" />
              <span>Gross Sales (Completed & Active)</span>
            </div>
            <span className="font-semibold text-neutral-900">{formatPrice(grossSales)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-600">
              <ArrowDownRight className="h-4 w-4 text-amber-600" />
              <span>Discounts & Promotional Deductions</span>
            </div>
            <span className="font-medium text-amber-700">
              {discounts > 0 ? `-${formatPrice(discounts)}` : "₹0.00"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-600">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Cancellations, Returns & Refunds</span>
            </div>
            <span className="font-medium text-red-600">
              {totalLoss > 0 ? `-${formatPrice(totalLoss)}` : "₹0.00"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-neutral-100 text-xs text-neutral-500">
            <span>GST / Tax Collected</span>
            <span className="font-medium text-neutral-700">{formatPrice(tax)}</span>
          </div>

          <div className="flex items-center justify-between py-1 text-xs text-neutral-500">
            <span>Shipping / Delivery Collected</span>
            <span className="font-medium text-neutral-700">{formatPrice(shipping)}</span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
        Calculated from live orders in {periodLabel}. Net Inflow = Gross Orders minus Discounts and
        Refunds/Cancellations.
      </div>
    </div>
  );
}
