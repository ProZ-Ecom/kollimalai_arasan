"use client";

import * as React from "react";
import type {
  AdminCustomerDetailDto,
  AdminCustomerListItemDto,
  AdminCustomerOrderItemDto,
} from "../../types/admin-customer.types";

interface CustomerActivityCardProps {
  customer?: AdminCustomerListItemDto | AdminCustomerDetailDto;
  orders?: AdminCustomerOrderItemDto[];
}

export function CustomerActivityCard({
  customer,
  orders = [],
}: CustomerActivityCardProps) {
  // Check if we have recent orders to incorporate into activity
  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-cream-border bg-white p-6 shadow-xs">
      <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-6">
        Recent Activity
      </h3>

      <div className="relative pl-6 space-y-6">
        {/* Vertical connecting line */}
        <div className="absolute left-[4.5px] top-2 bottom-2 w-[1px] bg-neutral-200" />

        {/* Activity Item 1 */}
        <div className="relative group">
          {/* Burgundy dot */}
          <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-secondary-600 ring-4 ring-white" />
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 font-medium">
              Today, 10:42 AM
            </p>
            <p className="text-sm text-neutral-800 leading-snug">
              Viewed product{" "}
              <span className="font-medium text-secondary-600">
                Himalayan Salted Caramel Almonds
              </span>
            </p>
          </div>
        </div>

        {/* Activity Item 2 */}
        <div className="relative group">
          {/* Soft rose dot */}
          <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-secondary-300 ring-4 ring-white" />
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 font-medium">
              {latestOrder?.placedAt || latestOrder?.createdAt
                ? new Date(
                    latestOrder.placedAt || latestOrder.createdAt
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "Oct 24, 2023"}
            </p>
            <p className="text-sm text-neutral-800 leading-snug">
              Order{" "}
              <span className="font-medium text-secondary-600">
                #{latestOrder?.orderNumber || "ORD-9824"}
              </span>{" "}
              was{" "}
              {latestOrder?.status
                ? latestOrder.status.toLowerCase()
                : "delivered"}
              .
            </p>
          </div>
        </div>

        {/* Activity Item 3 */}
        <div className="relative group">
          {/* Soft rose dot */}
          <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-secondary-300 ring-4 ring-white" />
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 font-medium">
              Oct 21, 2023
            </p>
            <p className="text-sm text-neutral-800 leading-snug">
              Contacted support regarding shipping delay.{" "}
              <span className="font-medium text-secondary-600 hover:underline cursor-pointer">
                View Ticket
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
