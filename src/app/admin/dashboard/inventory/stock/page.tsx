"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FormModal,
} from "@/components/common/FormModal";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import {
  useInventory,
  useAdjustStock,
  useCreateInventory,
} from "@/features/inventory/hooks";
import { formatDate } from "@/lib/utils";
import type {
  InventoryListItem,
  InventoryTransactionType,
  GetInventoryParams,
} from "@/features/inventory/types";

const adjustStockFormSchema = z.object({
  inventoryId: z.number().min(1, "Select an inventory item"),
  type: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGE",
    "TRANSFER",
  ]),
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, "Quantity cannot be zero"),
  notes: z.string().optional(),
});

const createInventoryFormSchema = z.object({
  productId: z.number().min(1, "Select a product"),
  variantId: z.number().optional(),
  quantity: z.number().int().min(0, "Quantity must be at least 0"),
  reorderLevel: z
    .number()
    .int()
    .min(0, "Reorder level must be at least 0")
    .optional(),
});

type AdjustStockForm = z.infer<typeof adjustStockFormSchema>;
type CreateInventoryForm = z.infer<typeof createInventoryFormSchema>;

const transactionTypes: { value: InventoryTransactionType; label: string }[] =
  [
    { value: "PURCHASE", label: "Purchase" },
    { value: "SALE", label: "Sale" },
    { value: "RETURN", label: "Return" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "DAMAGE", label: "Damage" },
    { value: "TRANSFER", label: "Transfer" },
  ];

function getStatusBadge(item: InventoryListItem) {
  if (item.quantity === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (item.quantity <= item.reorderLevel) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
      In Stock
    </Badge>
  );
}

const columns: ColumnDef<InventoryListItem>[] = [
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "variantName",
    header: "Variant",
    cell: ({ row }) => row.original.variantName ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "reservedQuantity",
    header: "Reserved",
  },
  {
    accessorKey: "availableQuantity",
    header: "Available",
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <Button variant="outline" size="sm">
        Adjust Stock
      </Button>
    ),
  },
];

export default function InventoryStockPage() {
  const [params, setParams] = useState<GetInventoryParams>({
    page: 1,
    limit: 10,
  });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useInventory(params);
  const adjustMutation = useAdjustStock();
  const createMutation = useCreateInventory();

  const adjustForm = useForm<AdjustStockForm>({
    resolver: zodResolver(adjustStockFormSchema),
    defaultValues: {
      inventoryId: 0,
      type: "ADJUSTMENT",
      quantity: 0,
      notes: "",
    },
  });

  const createForm = useForm<CreateInventoryForm>({
    resolver: zodResolver(createInventoryFormSchema),
    defaultValues: {
      productId: 0,
      variantId: undefined,
      quantity: 0,
      reorderLevel: 10,
    },
  });

  const handleAdjustSubmit = (values: AdjustStockForm) => {
    adjustMutation.mutate(values, {
      onSuccess: () => {
        setAdjustOpen(false);
        adjustForm.reset();
      },
    });
  };

  const handleCreateSubmit = (values: CreateInventoryForm) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setCreateOpen(false);
        createForm.reset();
      },
    });
  };

  if (isLoading) return <AdminTableSkeleton />;
  if (error) return <ErrorState message={error.message} />;

  const inventoryData = data?.data?.data ?? [];

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Inventory" },
          { label: "Stock" },
        ]}
      />
      <AdminPageHeader
        title="Inventory Stock"
        description="Manage your inventory stock levels"
        actions={
          <Button onClick={() => setCreateOpen(true)}>Add Inventory</Button>
        }
      />
      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <DataTable
            columns={columns}
            data={inventoryData}
            className="bg-white border border-neutral-200"
          />
        </div>
      </AdminContent>

      <FormModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust Stock"
        description="Adjust inventory stock levels"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={adjustForm.handleSubmit(handleAdjustSubmit)} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Inventory Item <span className="text-red-500">*</span></label>
            <select
              className="w-full border rounded-md p-2"
              {...adjustForm.register("inventoryId", { valueAsNumber: true })}
            >
              <option value={0} disabled>
                Select item
              </option>
              {inventoryData?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName}
                  {item.variantName ? ` - ${item.variantName}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Type <span className="text-red-500">*</span></label>
            <select
              className="w-full border rounded-md p-2"
              {...adjustForm.register("type")}
            >
              {transactionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              Quantity (negative for out) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              {...adjustForm.register("quantity", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full border rounded-md p-2"
              {...adjustForm.register("notes")}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Inventory"
        description="Create a new inventory record"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createForm.handleSubmit(handleCreateSubmit)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Product ID <span className="text-red-500">*</span></label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              placeholder="Enter product ID"
              {...createForm.register("productId", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Variant ID (optional)</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              placeholder="Enter variant ID"
              {...createForm.register("variantId", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              {...createForm.register("quantity", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Reorder Level</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              {...createForm.register("reorderLevel", { valueAsNumber: true })}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
