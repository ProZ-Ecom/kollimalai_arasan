"use client";

import React, { useState } from "react";
import type { CustomerProfileResponse } from "../../types";
import type { OrderDetailResponse } from "@/features/orders/types";

interface WalletTabProps {
  profile?: CustomerProfileResponse | null;
  orders?: OrderDetailResponse[];
  isLoading?: boolean;
}

export function WalletTab({
  profile,
  orders = [],
  isLoading = false,
}: WalletTabProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 min-w-0 animate-pulse">
        <div className="h-8 w-48 bg-theme-border rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
            >
              <div className="h-3 w-24 bg-theme-border-subtle rounded-md" />
              <div className="h-8 w-20 bg-theme-border rounded-md" />
              <div className="h-3 w-full bg-theme-border-subtle rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Compute points and tier dynamically from actual orders
  const totalSpend = orders.reduce((sum, o) => {
    const val = typeof o.totalAmount === "number" ? o.totalAmount : Number(o.totalAmount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const coinsBalance = Math.floor(totalSpend * 0.05); // 5% reward on spend
  const tier = totalSpend > 5000 ? "Platinum" : totalSpend > 1000 ? "Gold" : "Silver";
  const nextTierTarget = 5000;
  const progressPercent = Math.min(100, Math.round((totalSpend / nextTierTarget) * 100));

  const referralCode = profile?.referralCode || "RITHU10";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
        Wallet & Rewards
      </h2>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Snack Coins */}
        <div className="bg-gradient-to-br from-theme-primary to-[#8C2A1E] rounded-2xl p-5 sm:p-6 text-white shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-theme-secondary">
            Snack Coins
          </div>
          <div className="text-3xl sm:text-4xl font-bold mt-3">
            ₹{coinsBalance}
          </div>
          <div className="text-xs text-theme-text-gold font-light mt-2">
            Auto-applied at checkout on orders above ₹499
          </div>
        </div>

        {/* Loyalty Tier */}
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-widest text-theme-text-muted">
            Loyalty Tier
          </div>
          <div className="text-2xl sm:text-3xl font-bold uppercase text-theme-primary mt-3">
            {tier}
          </div>
          <div className="text-xs text-theme-text-subtle font-light mt-2">
            {tier === "Platinum" ? "Top tier unlocked!" : `Spend ₹${Math.max(0, nextTierTarget - totalSpend)} more to reach Platinum`}
          </div>
          <div className="h-2 rounded-full bg-theme-border-subtle mt-3 overflow-hidden">
            <div
              className="h-full bg-theme-secondary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-theme-text-muted">
            Referral Code
          </div>
          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="text-xl sm:text-2xl font-bold tracking-wider text-theme-primary font-mono">
              {referralCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-semibold text-theme-primary bg-theme-surface-alt border border-theme-border px-3 py-1.5 rounded-md hover:bg-theme-border-subtle transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="text-xs text-theme-text-subtle font-light mt-2">
            Share with friends: They get 10% off, you earn ₹50 coins!
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
            Coin History
          </h3>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-theme-text-muted">
            No coin transactions yet. Coins earned on orders will appear here.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-theme-border-subtle">
            {orders.slice(0, 5).map((order) => {
              const earnedCoins = Math.floor(
                (typeof order.totalAmount === "number" ? order.totalAmount : Number(order.totalAmount || 0)) * 0.05
              );

              return (
                <div
                  key={order.id}
                  className="flex justify-between items-center gap-4 px-5 py-3.5"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-theme-text-primary">
                      Reward earned on Order {order.orderNumber || `#${order.id}`}
                    </div>
                    <div className="text-xs text-theme-text-muted mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-theme-status-del-fg">
                    +₹{earnedCoins}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
