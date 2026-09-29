"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  XCircle,
  Printer,
  CheckCircle,
  PackageCheck,
  PlayCircle,
  Loader2,
  ArrowRight,
  Truck,
  Package,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { LoadingState } from "@/components/ui/loading-state";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { ClearFiltersButton } from "@/components/common/clear-filters-button";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ShipOrderModal } from "@/features/orders/components/ShipOrderModal";
import { LiveTrackingModal } from "@/features/orders/components/LiveTrackingModal";
import { ReturnRefundModal } from "@/features/orders/components/ReturnRefundModal";
import { getCourierTrackingInfo } from "@/features/orders/utils/courier-tracking";
import {
  useAdminOrders,
  useAdminOrder,
  useConfirmAdminOrder,
  useProcessAdminOrder,
  usePackAdminOrder,
  useCancelOrderAdmin,
  useDeliverAdminOrder,
  useReturnAdminOrder,
} from "@/features/orders/hooks";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  PAYMENT_STATUS_LABELS,
} from "@/features/orders/components/OrderStatusBadge";
import {
  PAYMENT_STATUSES,
  type OrderListItemResponse,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/orders/types";

interface AdminOrderListTableProps {
  status?: OrderStatus;
  emptyMessage?: string;
}

export function AdminOrderListTable({
  status,
  emptyMessage = "No orders found matching your criteria.",
}: AdminOrderListTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [returnRefundOrder, setReturnRefundOrder] = useState<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus?: string;
    customerName?: string;
  } | null>(null);
  const [shipCourierOrder, setShipCourierOrder] = useState<{
    id: string;
    orderNumber: string;
    customerName?: string;
    partnerCode?: string;
    trackingNumber?: string;
  } | null>(null);
  const [liveTrackingModal, setLiveTrackingModal] = useState<{
    open: boolean;
    awb: string;
    courierName?: string;
    orderNumber?: string;
  }>({ open: false, awb: "" });

  const { data, isLoading, error, refetch } = useAdminOrders({
    page,
    pageSize,
    search: search || undefined,
    status: status || undefined,
    paymentStatus: (paymentFilter || undefined) as PaymentStatus | undefined,
  });

  const { data: orderDetail, isLoading: detailLoading } =
    useAdminOrder(viewOrderId);

  const confirmOrder = useConfirmAdminOrder();
  const processOrder = useProcessAdminOrder();
  const packOrder = usePackAdminOrder();
  const cancelOrder = useCancelOrderAdmin();
  const deliverOrder = useDeliverAdminOrder();
  const returnOrder = useReturnAdminOrder();

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const handleClearFilters = () => {
    setSearch("");
    setPaymentFilter("");
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== "" || paymentFilter !== "";

  const handlePrint = (orderUuid: string) => {
    if (typeof window !== "undefined") {
      window.open(`/invoice/${orderUuid}`, "_blank", "noopener");
    }
  };

  const isTransitionPending =
    confirmOrder.isPending ||
    processOrder.isPending ||
    packOrder.isPending ||
    cancelOrder.isPending ||
    deliverOrder.isPending ||
    returnOrder.isPending;

  const currentDetailStatus = orderDetail?.status?.toLowerCase();
  const isOrderLocked =
    !!orderDetail &&
    ["cancelled", "returned"].includes(currentDetailStatus || "");

  const columns: ColumnDef<OrderListItemResponse, unknown>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="leading-snug">
          <button
            type="button"
            onClick={() => setViewOrderId(row.original.id)}
            className="text-left font-semibold text-neutral-900 hover:text-secondary-600 transition-colors cursor-pointer"
          >
            {row.original.orderNumber}
          </button>
          <div className="text-[11px] text-neutral-400">
            {formatDateTime(row.original.placedAt || row.original.createdAt)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div className="leading-snug max-w-[200px] truncate">
            <div className="font-semibold text-neutral-900 truncate">
              {customer?.name || "Customer"}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono truncate">
              {customer?.phone ||
                customer?.email ||
                (customer?.customerId ? `ID: ${customer.customerId}` : "—")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "totalItems",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-neutral-700">
          {row.original.totalItems}{" "}
          {row.original.totalItems === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900 tabular-nums text-sm">
          {formatPrice(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <div className="space-y-1">
          <PaymentStatusBadge status={row.original.paymentStatus} />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      id: "courierTracking",
      header: "Courier / Tracking",
      cell: ({ row }) => {
        const delivery = row.original.delivery;
        const orderStatus = (row.original.status || "").toLowerCase();

        // 1. Courier Shipment with Tracking Number
        if (delivery?.trackingNumber) {
          const partnerName = delivery.deliveryPartner?.name || "ST Courier";

          return (
            <div className="leading-tight max-w-[190px]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-secondary-800 truncate">
                  {partnerName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setShipCourierOrder({
                      id: row.original.id,
                      orderNumber: row.original.orderNumber,
                      customerName: row.original.customer?.name,
                      partnerCode: delivery.deliveryPartner?.code,
                      trackingNumber: delivery.trackingNumber || "",
                    })
                  }
                  title="Edit Courier Tracking"
                  className="text-[10px] text-neutral-400 hover:text-secondary-600 underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600 font-medium truncate mt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setLiveTrackingModal({
                      open: true,
                      awb: delivery.trackingNumber!,
                      courierName: partnerName,
                      orderNumber: row.original.orderNumber,
                    })
                  }
                  title="Open Live Shipment Tracking (In-App, Ad-Free)"
                  className="text-secondary-700 hover:text-secondary-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>AWB: {delivery.trackingNumber}</span>
                  <ExternalLink className="h-3 w-3 text-secondary-600" />
                </button>
              </div>
            </div>
          );
        }

        // 2. Pending Shipment
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-border">
              <Package className="h-3 w-3 text-neutral-400" />
              Pending Shipment
            </span>
            {["confirmed", "processing", "packed"].includes(orderStatus) && (
              <button
                type="button"
                onClick={() =>
                  setShipCourierOrder({
                    id: row.original.id,
                    orderNumber: row.original.orderNumber,
                    customerName: row.original.customer?.name,
                  })
                }
                title="Ship via ST Courier"
                className="text-[11px] font-semibold text-secondary-700 hover:underline cursor-pointer"
              >
                Ship
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "placedAt",
      header: "Placed At",
      cell: ({ row }) => (
        <div className="leading-snug text-xs text-neutral-700">
          <div>
            {new Date(
              row.original.placedAt || row.original.createdAt
            ).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-[11px] text-neutral-400">
            {new Date(
              row.original.placedAt || row.original.createdAt
            ).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const orderStatus = (row.original.status || "").toLowerCase();
        const isCancellable = !["cancelled", "delivered", "returned"].includes(
          orderStatus
        );

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick advance action button */}
            {orderStatus === "pending" && (
              <button
                type="button"
                onClick={() =>
                  confirmOrder.mutate(
                    { id: row.original.id, note: "Confirmed by admin" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Confirm Order"
                className="grid h-8 w-8 place-items-center rounded-lg border border-secondary-200 bg-secondary-50 text-xs font-semibold text-secondary-600 hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {orderStatus === "confirmed" && (
              <button
                type="button"
                onClick={() =>
                  processOrder.mutate(
                    { id: row.original.id, note: "Processing started" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Start Processing"
                className="grid h-8 w-8 place-items-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <PlayCircle className="h-3.5 w-3.5" />
              </button>
            )}

            {orderStatus === "processing" && (
              <button
                type="button"
                onClick={() =>
                  packOrder.mutate(
                    { id: row.original.id, note: "Marked as packed" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Mark as Packed"
                className="grid h-8 w-8 place-items-center rounded-lg border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <PackageCheck className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Ship via ST Courier Action Button */}
            {["confirmed", "processing", "packed", "shipped"].includes(orderStatus) && (
              <button
                type="button"
                onClick={() =>
                  setShipCourierOrder({
                    id: row.original.id,
                    orderNumber: row.original.orderNumber,
                    customerName: row.original.customer?.name,
                    partnerCode: row.original.delivery?.deliveryPartner?.code,
                    trackingNumber: row.original.delivery?.trackingNumber || "",
                  })
                }
                title={
                  row.original.delivery?.trackingNumber
                    ? "Update ST Courier Tracking"
                    : "Ship with ST Courier"
                }
                className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  orderStatus === "packed"
                    ? "border-secondary-600 bg-secondary-600 text-white hover:bg-secondary-700 shadow-xs"
                    : row.original.delivery?.trackingNumber
                    ? "border-secondary-300 bg-secondary-50 text-secondary-700 hover:bg-secondary-100"
                    : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
                disabled={isTransitionPending}
              >
                <Truck className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Quick Mark as Delivered button for in-transit orders */}
            {["shipped", "out_for_delivery"].includes(orderStatus) && (
              <button
                type="button"
                onClick={() =>
                  deliverOrder.mutate(
                    {
                      id: row.original.id,
                      note: "Order marked as delivered by admin",
                    },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Mark as Delivered"
                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Quick Process Return / Refund button for delivered orders */}
            {orderStatus === "delivered" && (
              <button
                type="button"
                onClick={() =>
                  setReturnRefundOrder({
                    id: row.original.id,
                    orderNumber: row.original.orderNumber,
                    totalAmount: Number(row.original.totalAmount),
                    paymentStatus: row.original.paymentStatus,
                    customerName: row.original.customer?.name,
                  })
                }
                title="Process Return / Refund"
                className="grid h-8 w-8 place-items-center rounded-lg border border-purple-300 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewOrderId(row.original.id)}
              title="View Order Details"
              className="grid h-8 w-8 place-items-center rounded-lg border border-cream-border-subtle bg-white text-xs text-neutral-600 hover:bg-cream-200 hover:text-secondary-800 hover:border-cream-border-hover transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {isCancellable && (
              <button
                type="button"
                onClick={() => setCancelOrderId(row.original.id)}
                title="Cancel Order"
                className="grid h-8 w-8 place-items-center rounded-lg border border-secondary-200 bg-white text-xs text-error-600 hover:bg-error-50 hover:border-error-200 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl bg-transparent">
      {/* Filter and Search Bar */}
      <div className="admin-surface flex-shrink-0 mb-4 flex flex-col gap-3 rounded-xl p-2.5 sm:flex-row sm:items-center sm:justify-between relative z-50">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            placeholder="Search by order number, customer name, email, phone..."
            value={search}
            onSearch={(val) => {
              setSearch(val.trim());
              setPage(1);
            }}
            className="w-full max-w-md bg-cream-50 border-cream-border-subtle"
          />
          {!isLoading && !error && (
            <span className="hidden whitespace-nowrap text-xs font-medium text-neutral-500 lg:inline">
              <span className="font-bold text-neutral-800 tabular-nums">
                {meta?.total ?? orders.length}
              </span>{" "}
              {(meta?.total ?? orders.length) === 1 ? "order" : "orders"}
              {hasActiveFilters ? " found" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 relative z-50">
          <Select
            value={paymentFilter}
            onValueChange={(val) => {
              setPaymentFilter(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Payments" },
              ...PAYMENT_STATUSES.map((ps) => ({
                value: ps,
                label: PAYMENT_STATUS_LABELS[ps] || ps,
              })),
            ]}
            className="w-40 sm:w-44 h-10"
            size="sm"
          />

          {hasActiveFilters && <ClearFiltersButton onClick={handleClearFilters} />}
        </div>
      </div>

      {/* Table & Pagination Content */}
      <div className="w-full flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <AdminTableSkeleton bare rows={8} columns={8} />
        ) : error ? (
          <ErrorState
            message="Failed to load orders. Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            page={meta?.page ?? page}
            totalPages={
              meta?.totalPages ??
              Math.max(1, Math.ceil((meta?.total ?? orders.length) / pageSize))
            }
            totalItems={meta?.total ?? orders.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            className="admin-surface flex-1"
            tableClassName="min-w-[1250px]"
            emptyMessage={emptyMessage}
          />
        )}
      </div>

      {/* Order Detail Modal */}
      <FormModal
        open={!!viewOrderId}
        onClose={() => setViewOrderId(null)}
        title={
          orderDetail ? `Order ${orderDetail.orderNumber}` : "Order Details"
        }
        description="Manage order status and fulfillment"
        size="xl"
        footer={
          <Button variant="outline" onClick={() => setViewOrderId(null)}>
            Close
          </Button>
        }
      >
        {detailLoading || !orderDetail ? (
          <LoadingState text="Loading order details..." />
        ) : (
          <div className="space-y-4">
            {/* Status Workflow Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mr-1">
                  Current Status:
                </span>
                <OrderStatusBadge status={orderDetail.status} />
                {orderDetail.paymentStatus && (
                  <PaymentStatusBadge status={orderDetail.paymentStatus} />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentDetailStatus === "pending" && (
                  <Button
                    size="sm"
                    className="bg-secondary-600 hover:bg-secondary-700 text-white"
                    onClick={() => {
                      confirmOrder.mutate(
                        { id: orderDetail.id, note: "Order confirmed by admin" },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {confirmOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Confirm Order
                  </Button>
                )}

                {currentDetailStatus === "confirmed" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      processOrder.mutate(
                        {
                          id: orderDetail.id,
                          note: "Order processing started by admin",
                        },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {processOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Start Processing
                  </Button>
                )}

                {currentDetailStatus === "processing" && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      packOrder.mutate(
                        { id: orderDetail.id, note: "Order marked as packed" },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {packOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="mr-1.5 h-4 w-4" />
                    )}
                    Mark as Packed
                  </Button>
                )}

                {currentDetailStatus === "packed" && (
                  <Button
                    size="sm"
                    className="bg-secondary-600 hover:bg-secondary-700 text-white"
                    onClick={() => {
                      setShipCourierOrder({
                        id: orderDetail.id,
                        orderNumber: orderDetail.orderNumber,
                        customerName: orderDetail.customer?.name,
                        partnerCode: orderDetail.delivery?.deliveryPartner?.code,
                        trackingNumber: orderDetail.delivery?.trackingNumber || "",
                      });
                    }}
                    disabled={isTransitionPending}
                  >
                    <Truck className="mr-1.5 h-4 w-4" />
                    Ship via ST Courier
                  </Button>
                )}

                {(currentDetailStatus === "shipped" ||
                  currentDetailStatus === "out_for_delivery") && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      deliverOrder.mutate(
                        {
                          id: orderDetail.id,
                          note: "Order marked as delivered by admin",
                        },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {deliverOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Mark Delivered
                  </Button>
                )}

                {/* Refund / Return Manual Action for Admin */}
                {["delivered", "shipped", "out_for_delivery"].includes(
                  currentDetailStatus || ""
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                    onClick={() =>
                      setReturnRefundOrder({
                        id: orderDetail.id,
                        orderNumber: orderDetail.orderNumber,
                        totalAmount: Number(orderDetail.totalAmount),
                        paymentStatus: orderDetail.paymentStatus,
                        customerName: orderDetail.customer?.name,
                      })
                    }
                    disabled={isTransitionPending}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Process Return / Refund
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(orderDetail.id)}
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Invoice
                </Button>

                {!isOrderLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error-600 border-error-200 hover:bg-error-50"
                    onClick={() => setCancelOrderId(orderDetail.id)}
                    disabled={isTransitionPending}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </div>

              {isOrderLocked && (
                <p className="w-full text-xs text-muted-foreground italic pt-1">
                  This order is {orderDetail.status.toLowerCase()} and can no
                  longer be modified.
                </p>
              )}
            </div>

            <OrderDetailView order={orderDetail} />
          </div>
        )}
      </FormModal>

      {/* Ship Order via Courier Modal */}
      <ShipOrderModal
        open={!!shipCourierOrder}
        onClose={() => setShipCourierOrder(null)}
        orderId={shipCourierOrder?.id ?? null}
        orderNumber={shipCourierOrder?.orderNumber}
        customerName={shipCourierOrder?.customerName}
        initialPartnerCode={shipCourierOrder?.partnerCode}
        initialTrackingNumber={shipCourierOrder?.trackingNumber}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        open={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={() => {
          if (cancelOrderId) {
            cancelOrder.mutate(
              { id: cancelOrderId, note: "Cancelled by administrator" },
              {
                onSuccess: () => {
                  setCancelOrderId(null);
                  refetch();
                },
              }
            );
          }
        }}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? This action will mark the order as cancelled in the database."
        confirmText="Cancel Order"
        variant="destructive"
        isLoading={cancelOrder.isPending}
      />

      {/* Return & Refund Dialog with 30%, 40%, 50%, 100% or Custom Partial Refund */}
      <ReturnRefundModal
        open={!!returnRefundOrder}
        onClose={() => setReturnRefundOrder(null)}
        order={returnRefundOrder}
        onSuccess={() => {
          setReturnRefundOrder(null);
          refetch();
        }}
      />

      {/* Live In-App Courier Tracking Modal */}
      <LiveTrackingModal
        open={liveTrackingModal.open}
        onClose={() =>
          setLiveTrackingModal((prev) => ({ ...prev, open: false }))
        }
        awb={liveTrackingModal.awb}
        courierName={liveTrackingModal.courierName}
        orderNumber={liveTrackingModal.orderNumber}
      />
    </div>
  );
}
