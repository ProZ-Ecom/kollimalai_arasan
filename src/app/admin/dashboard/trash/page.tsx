"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/Toast";
import { getImageUrl } from "@/lib/utils";
import Image from "next/image";
import {
  Trash2,
  RotateCcw,
  FolderTree,
  Package,
  Layers,
  AlertTriangle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DeletedCategory {
  id: string;
  uuid: string | null;
  name: string;
  slug: string;
  icon: string | null;
  deletedAt: string | null;
  type: "category";
}

interface DeletedProduct {
  id: string;
  uuid: string | null;
  name: string;
  slug: string;
  image: string | null;
  categoryName: string | null;
  deletedAt: string | null;
  type: "product";
}

interface DeletedVariant {
  id: string;
  uuid: string | null;
  name: string;
  sku: string | null;
  image: string | null;
  productName: string | null;
  productUuid: string | null;
  parentDeleted: boolean;
  deletedAt: string | null;
  type: "variant";
}

interface TrashData {
  categories: DeletedCategory[];
  products: DeletedProduct[];
  variants: DeletedVariant[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TabId = "categories" | "products" | "variants";

const TABS: { id: TabId; label: string; icon: typeof FolderTree }[] = [
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "products", label: "Products", icon: Package },
  { id: "variants", label: "Items", icon: Layers },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("categories");
  const [restoreItem, setRestoreItem] = useState<
    DeletedCategory | DeletedProduct | DeletedVariant | null
  >(null);

  // Fetch
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "trash", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await apiClient.get<TrashData>(`/api/admin/trash${params}`);
      return res.data!;
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (item: DeletedCategory | DeletedProduct | DeletedVariant) => {
      const uuid = item.uuid || item.id;
      if (item.type === "category") {
        return apiClient.post(`/api/admin/categories/${uuid}/restore`, {});
      } else if (item.type === "product") {
        return apiClient.post(`/api/admin/products/${uuid}/restore`, {});
      } else {
        return apiClient.post(`/api/admin/variants/${uuid}/restore`, {});
      }
    },
    onSuccess: (_, item) => {
      const label =
        item.type === "category"
          ? "Category"
          : item.type === "product"
          ? "Product"
          : "Item";
      toast.success(`${label} Restored`, `"${item.name}" has been restored successfully.`);
      setRestoreItem(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: any) => {
      toast.error("Restore Failed", err.message || "Could not restore the item.");
    },
  });

  const categories = data?.categories ?? [];
  const products = data?.products ?? [];
  const variants = data?.variants ?? [];

  const counts: Record<TabId, number> = {
    categories: categories.length,
    products: products.length,
    variants: variants.length,
  };

  const totalItems = counts.categories + counts.products + counts.variants;

  return (
    <div className="flex flex-1 min-h-0 flex-col h-full w-full">
      <AdminPageHeader
        title="Trash"
        description="Recover accidentally deleted categories, products, and items"
      />

      <div className="mt-4 flex flex-1 min-h-0 flex-col">
        {/* Search */}
        <div className="flex-shrink-0 mb-4 flex items-center gap-3">
          <SearchInput
            placeholder="Search deleted items..."
            defaultValue={search}
            onSearch={(val) => setSearch(val)}
            className="w-full max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9.5 border-cream-border text-neutral-600 hover:bg-cream-50 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <LoadingState text="Loading trash..." />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <ErrorState title="Failed to load trash" onRetry={() => refetch()} />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-base font-bold text-neutral-800 mb-1">Trash is empty</h3>
            <p className="text-sm text-neutral-500">No deleted categories, products, or items found.</p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col">
            {/* Tabs */}
            <div className="flex-shrink-0 flex gap-1 mb-4 bg-neutral-100 p-1 rounded-xl w-fit">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {counts[tab.id] > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-secondary-600 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {counts[tab.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content - Table Container */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-cream-border overflow-hidden shadow-xs">
              {activeTab === "categories" && (
                categories.length === 0 ? (
                  <EmptyTab label="deleted categories" />
                ) : (
                  <TrashTable
                    rows={categories.map((c) => ({
                      uuid: c.uuid || c.id,
                      image: c.icon ? getImageUrl(c.icon) : null,
                      name: c.name,
                      subtitle: c.slug,
                      meta: null,
                      deletedAt: c.deletedAt,
                      item: c,
                    }))}
                    onRestore={setRestoreItem}
                    isRestoring={restoreMutation.isPending}
                  />
                )
              )}

              {activeTab === "products" && (
                products.length === 0 ? (
                  <EmptyTab label="deleted products" />
                ) : (
                  <TrashTable
                    rows={products.map((p) => ({
                      uuid: p.uuid || p.id,
                      image: p.image ? getImageUrl(p.image) : null,
                      name: p.name,
                      subtitle: p.slug,
                      meta: p.categoryName ? `Category: ${p.categoryName}` : null,
                      deletedAt: p.deletedAt,
                      item: p,
                    }))}
                    onRestore={setRestoreItem}
                    isRestoring={restoreMutation.isPending}
                  />
                )
              )}

              {activeTab === "variants" && (
                variants.length === 0 ? (
                  <EmptyTab label="deleted items" />
                ) : (
                  <TrashTable
                    rows={variants.map((v) => ({
                      uuid: v.uuid || v.id,
                      image: v.image ? getImageUrl(v.image) : null,
                      name: v.name,
                      subtitle: v.sku ?? "—",
                      meta: v.productName ? `Product: ${v.productName}` : null,
                      deletedAt: v.deletedAt,
                      item: v,
                      warning: v.parentDeleted
                        ? "Parent product is also deleted — restore the product first."
                        : undefined,
                    }))}
                    onRestore={setRestoreItem}
                    isRestoring={restoreMutation.isPending}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={!!restoreItem}
        onClose={() => setRestoreItem(null)}
        onConfirm={() => {
          if (restoreItem) restoreMutation.mutate(restoreItem);
        }}
        title={`Restore ${restoreItem?.type === "category" ? "Category" : restoreItem?.type === "product" ? "Product" : "Item"}`}
        description={
          restoreItem?.type === "category"
            ? `Restore "${restoreItem.name}"? This will also restore all associated products and items that were deleted at the same time.`
            : restoreItem?.type === "product"
            ? `Restore "${restoreItem?.name}"? This will also restore all its items that were deleted at the same time.`
            : `Restore item "${restoreItem?.name}"?`
        }
        confirmText="Restore"
        variant="default"
        isLoading={restoreMutation.isPending}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-sm text-neutral-400">
      No {label} in trash.
    </div>
  );
}

interface TrashRow {
  uuid: string;
  image: string | null;
  name: string;
  subtitle: string;
  meta: string | null;
  deletedAt: string | null;
  item: DeletedCategory | DeletedProduct | DeletedVariant;
  warning?: string;
}

function TrashTable({
  rows,
  onRestore,
  isRestoring,
}: {
  rows: TrashRow[];
  onRestore: (item: DeletedCategory | DeletedProduct | DeletedVariant) => void;
  isRestoring: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-cream-50 shadow-xs">
          <tr>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 w-12 bg-cream-50 border-b border-cream-border" />
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 bg-cream-50 border-b border-cream-border">Name</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 hidden sm:table-cell bg-cream-50 border-b border-cream-border">Details</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell bg-cream-50 border-b border-cream-border">Deleted At</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 bg-cream-50 border-b border-cream-border">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map((row) => (
            <tr key={row.uuid} className="hover:bg-cream-50/80 transition-colors">
              {/* Image */}
              <td className="px-5 py-3 border-b border-cream-border">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
                  {row.image ? (
                    <Image
                      src={row.image}
                      alt={row.name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-neutral-300" />
                  )}
                </div>
              </td>

              {/* Name + subtitle */}
              <td className="px-5 py-3 border-b border-cream-border">
                <div className="font-semibold text-neutral-800 text-sm">{row.name}</div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{row.subtitle}</div>
                {row.warning && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-medium">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {row.warning}
                  </div>
                )}
              </td>

              {/* Meta */}
              <td className="px-5 py-3 border-b border-cream-border hidden sm:table-cell text-neutral-500 text-xs">
                {row.meta ?? "—"}
              </td>

              {/* Deleted At */}
              <td className="px-5 py-3 border-b border-cream-border hidden md:table-cell text-neutral-400 text-xs">
                {formatDate(row.deletedAt)}
              </td>

              {/* Action */}
              <td className="px-5 py-3 border-b border-cream-border text-left">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isRestoring}
                  onClick={() => onRestore(row.item)}
                  className="h-8 rounded-lg border-secondary-200 text-secondary-700 hover:bg-secondary-50 text-xs font-semibold"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Restore
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
