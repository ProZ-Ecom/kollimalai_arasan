"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, getCoupons } from "@/features/coupons/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { BulkActionsBar } from "@/components/admin/data-table/BulkActionsBar";
import { SearchInput } from "@/components/ui/search-input";
import { ClearFiltersButton } from "@/components/common/clear-filters-button";
import { EXPORT_PRESETS } from "@/lib/export-presets";
import { exportToExcel } from "@/lib/excel-export";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createCouponSchema, type CreateCouponSchemaInput } from "@/features/coupons/validations/coupon.schema";
import type { ColumnDef } from "@tanstack/react-table";
import type { CouponListItem } from "@/features/coupons/types";

const typeBadgeVariant: Record<string, "info" | "success" | "secondary"> = {
  PERCENTAGE: "info",
  percentage: "info",
  FIXED: "success",
  flat: "success",
};

function formatDateForInput(dateVal: Date | string | null | undefined): string | undefined {
  if (!dateVal) return undefined;
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? undefined : d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponListItem | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<CouponListItem[]>([]);

  const { data, isLoading, error, refetch } = useCoupons({
    search: search || undefined,
  });

  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const coupons = data?.data ?? [];

  const filteredCoupons = useMemo(() => {
    return coupons.filter((item) => {
      if (typeFilter && typeFilter !== "all") {
        const itemType = (item.type || "").toUpperCase();
        const expected = typeFilter.toUpperCase();
        if (expected === "FIXED" && itemType !== "FIXED" && itemType !== "FLAT") return false;
        if (expected === "PERCENTAGE" && itemType !== "PERCENTAGE") return false;
      }
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "active" && !item.isActive) return false;
        if (statusFilter === "inactive" && item.isActive) return false;
      }
      return true;
    });
  }, [coupons, typeFilter, statusFilter]);

  const hasActiveFilters = Boolean(search.trim() || typeFilter !== "all" || statusFilter !== "all");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCouponSchemaInput>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: undefined as unknown as number,
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingCoupon) {
      const normalizedType =
        editingCoupon.type?.toUpperCase() === "FLAT" ||
        editingCoupon.type?.toUpperCase() === "FIXED"
          ? "FIXED"
          : "PERCENTAGE";
      reset({
        code: editingCoupon.code,
        type: normalizedType,
        value: editingCoupon.value,
        minOrderAmount: editingCoupon.minOrderAmount ?? undefined,
        maxDiscount: editingCoupon.maxDiscount ?? undefined,
        usageLimit: editingCoupon.usageLimit ?? undefined,
        isActive: editingCoupon.isActive,
        startsAt: formatDateForInput(editingCoupon.startsAt),
        expiresAt: formatDateForInput(editingCoupon.expiresAt),
      });
    } else {
      reset({
        code: "",
        type: "PERCENTAGE",
        value: undefined as unknown as number,
        isActive: true,
      });
    }
  }, [editingCoupon, reset]);

  const onSubmit = (formData: CreateCouponSchemaInput) => {
    if (editingCoupon) {
      const normalizedType =
        editingCoupon.type?.toUpperCase() === "FLAT" ||
        editingCoupon.type?.toUpperCase() === "FIXED"
          ? "FIXED"
          : "PERCENTAGE";

      const origStartsAt = formatDateForInput(editingCoupon.startsAt);
      const origExpiresAt = formatDateForInput(editingCoupon.expiresAt);

      const payload: Partial<CreateCouponSchemaInput> = {};

      if (formData.code?.trim() !== (editingCoupon.code || "").trim()) {
        payload.code = formData.code.trim();
      }
      if (formData.type !== normalizedType) {
        payload.type = formData.type;
      }
      if (Number(formData.value) !== Number(editingCoupon.value)) {
        payload.value = Number(formData.value);
      }
      if (
        formData.minOrderAmount !== undefined &&
        Number(formData.minOrderAmount) !== Number(editingCoupon.minOrderAmount)
      ) {
        payload.minOrderAmount = Number(formData.minOrderAmount);
      }
      if (
        formData.maxDiscount !== undefined &&
        Number(formData.maxDiscount) !== Number(editingCoupon.maxDiscount)
      ) {
        payload.maxDiscount = Number(formData.maxDiscount);
      }
      if (
        formData.usageLimit !== undefined &&
        Number(formData.usageLimit) !== Number(editingCoupon.usageLimit)
      ) {
        payload.usageLimit = Number(formData.usageLimit);
      }
      if (
        formData.isActive !== undefined &&
        formData.isActive !== editingCoupon.isActive
      ) {
        payload.isActive = formData.isActive;
      }
      if (formData.startsAt !== origStartsAt) {
        payload.startsAt = formData.startsAt;
      }
      if (formData.expiresAt !== origExpiresAt) {
        payload.expiresAt = formData.expiresAt;
      }

      if (Object.keys(payload).length === 0) {
        setModalOpen(false);
        setEditingCoupon(null);
        return;
      }

      updateMutation.mutate(
        { id: editingCoupon.id, data: payload },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingCoupon(null);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleOpenModal = (coupon?: CouponListItem) => {
    if (coupon) {
      setEditingCoupon(coupon);
    } else {
      setEditingCoupon(null);
    }
    setModalOpen(true);
  };

  const columns: ColumnDef<CouponListItem, unknown>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <p className="font-mono font-medium">{row.original.code}</p>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const rawType = (row.original.type || "").toLowerCase();
        const isPercentage = rawType === "percentage";
        return (
          <Badge variant={typeBadgeVariant[rawType] ?? (isPercentage ? "info" : "success")}>
            {isPercentage ? "Percentage" : "Flat"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const isPercentage = (row.original.type || "").toLowerCase() === "percentage";
        return (
          <span className="font-medium text-neutral-900">
            {isPercentage
              ? `${row.original.value}%`
              : `₹${Number(row.original.value).toLocaleString("en-IN")}`}
          </span>
        );
      },
    },
    {
      id: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const used = row.original.usedCount ?? 0;
        const limit = row.original.usageLimit;
        return (
          <span className="text-neutral-700">
            {limit != null && limit > 0 ? `${used} / ${limit}` : `${used} / Unlimited`}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expiry",
      cell: ({ row }) => {
        if (!row.original.expiresAt) {
          return <span className="text-neutral-500">No expiry</span>;
        }
        try {
          const d = new Date(row.original.expiresAt);
          if (isNaN(d.getTime())) {
            return <span className="text-neutral-500">No expiry</span>;
          }
          return (
            <span className="text-neutral-700">
              {d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        } catch {
          return <span className="text-neutral-500">No expiry</span>;
        }
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenModal(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-error-600" />
          </Button>
        </div>
      ),
    },
  ];

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) return <AdminTableSkeleton />;
  if (error) return <ErrorState message="Failed to load coupons" onRetry={() => refetch()} />;

  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col">
      <AdminBreadcrumb items={[{ label: "Coupons" }]} />
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons"
      />
      <AdminContent className="flex-1 min-h-0 min-w-0">
        <div className="flex flex-1 min-h-0 min-w-0 flex-col bg-transparent">
          {/* Search + Filter */}
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              <SearchInput
                placeholder="Search coupons by code..."
                value={search}
                onSearch={(val) => setSearch(val)}
                className="w-full max-w-md"
              />

              <div className="w-full sm:w-44">
                <Select
                  value={typeFilter}
                  onValueChange={(val) => setTypeFilter(val)}
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "PERCENTAGE", label: "Percentage" },
                    { value: "FIXED", label: "Fixed Amount" },
                  ]}
                  placeholder="All Types"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  placeholder="All Status"
                  className="h-11 rounded-xl"
                />
              </div>

              {hasActiveFilters && <ClearFiltersButton onClick={handleClearFilters} />}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <ExportExcelButton
                data={filteredCoupons}
                fetchData={async () => {
                  const res = await getCoupons({ search: search || undefined, limit: 10000 });
                  return res?.data ?? [];
                }}
                totalCount={filteredCoupons.length}
                filename="coupons"
                sheetName="Coupons"
                columns={EXPORT_PRESETS.coupons}
              />
              <Button
                type="button"
                onClick={() => handleOpenModal()}
                className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)] shadow-xs"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="mt-3 sm:mt-5 flex-1 min-h-0 min-w-0 flex flex-col">
            <BulkActionsBar
              selectedCount={selectedRows.length}
              entityName="coupon"
              filterNotice={hasActiveFilters ? "Filtered results active" : undefined}
              onClearSelection={() => {
                setSelectedRowIds({});
                setSelectedRows([]);
              }}
              onExport={() => {
                exportToExcel({
                  filename: "selected_coupons",
                  sheetName: "Selected Coupons",
                  data: selectedRows,
                  columns: EXPORT_PRESETS.coupons,
                });
              }}
            />
            <DataTable
              columns={columns}
              data={filteredCoupons}
              tableClassName="min-w-[1100px]"
              pageSize={20}
              selectedRowIds={selectedRowIds}
              onRowSelectionChange={(newSelection, items) => {
                setSelectedRowIds(newSelection);
                setSelectedRows(items);
              }}
              getRowId={(row) => String(row.id)}
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCoupon(null);
        }}
        title={editingCoupon ? "Edit Coupon" : "Add Coupon"}
        description={editingCoupon ? "Update coupon details" : "Create a new coupon"}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCoupon ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code <span className="text-error-600">*</span>
            </label>
            <input
              {...register("code")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="e.g. KOLLI15"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-error-600">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-error-600">*</span>
              </label>
              <Select
                value={watch("type")}
                onValueChange={(val) =>
                  setValue("type", val as "PERCENTAGE" | "FIXED", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                size="sm"
                className="h-10 rounded-lg text-sm"
                options={[
                  { value: "PERCENTAGE", label: "Percentage" },
                  { value: "FIXED", label: "Fixed Amount" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("value", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-error-600">{errors.value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Amount
              </label>
              <input
                type="number"
                step="0.01"
                {...register("minOrderAmount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount
              </label>
              <input
                type="number"
                step="0.01"
                {...register("maxDiscount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              {...register("usageLimit", { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Unlimited"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starts At
              </label>
              <input
                type="date"
                {...register("startsAt")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At
              </label>
              <input
                type="date"
                {...register("expiresAt")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              id="isActive"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
