"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Calendar, User } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useBlogs, useCreateBlog, useUpdateBlog, useDeleteBlog } from "@/features/blogs/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { SearchInput } from "@/components/ui/search-input";
import { ClearFiltersButton } from "@/components/common/clear-filters-button";
import { toast } from "@/components/ui/Toast";
import { BlogForm } from "@/features/blogs/components/BlogForm";
import { getImageUrl, formatDate } from "@/lib/utils";
import type { BlogListItem } from "@/features/blogs/types";
import type { CreateBlogSchemaInput } from "@/features/blogs/validations/blog.schema";

const statusBadgeVariant: Record<string, "secondary" | "success" | "warning"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default function AdminBlogsPage() {
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatusFilter]);

  const { data, isLoading, error, refetch } = useBlogs({
    page,
    limit: pageSize,
    search: search || undefined,
    status: selectedStatusFilter || undefined,
  });

  const createMutation = useCreateBlog();
  const updateMutation = useUpdateBlog();
  const deleteMutation = useDeleteBlog();

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatusFilter("");
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== "" || selectedStatusFilter !== "";
  const blogs = data?.data ?? [];

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: "All Statuses" },
      { value: "PUBLISHED", label: "Published" },
      { value: "DRAFT", label: "Draft" },
      { value: "ARCHIVED", label: "Archived" },
    ],
    []
  );

  const columns: ColumnDef<BlogListItem, unknown>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const img = row.original.image;
        return (
          <div className="relative aspect-[16/9] w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)]">
            {img ? (
              <Image
                src={getImageUrl(img)}
                alt={row.original.title || "Blog cover"}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <span className="text-[10px] text-[var(--color-neutral-400)]">No image</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-md">
          <p className="font-semibold text-[var(--color-neutral-900)] line-clamp-1">
            {row.original.title}
          </p>
          {/* <p className="text-xs text-[var(--color-neutral-500)] font-mono mt-0.5">
            /{row.original.slug}
          </p> */}
        </div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-700)]">
          <User className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
          <span>{row.original.author?.name ?? "Admin"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={statusBadgeVariant[row.original.status] ?? "secondary"}
          className="text-xs capitalize"
        >
          {row.original.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "Published Date",
      cell: ({ row }) => {
        const pubDate = row.original.publishedAt;
        if (!pubDate) {
          return (
            <span className="text-xs text-[var(--color-neutral-400)] italic">
              Draft (Not published)
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-600)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
            <span>{formatDate(pubDate, { style: "medium" })}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const blog = row.original;
        return (
          <div className="flex items-center gap-1 justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBlog(blog);
                setIsEditOpen(true);
              }}
              className="h-8 w-8 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]"
              title="Edit Blog"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDeleteTarget({
                  id: blog.id,
                  title: blog.title || "Untitled Blog",
                })
              }
              className="h-8 w-8 text-[var(--color-error-500)] hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-700)]"
              title="Delete Blog"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading && !data) {
    return <AdminTableSkeleton />;
  }

  if (error) {
    return <ErrorState message="Failed to load blogs" onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminPageHeader
        title="Blog Management"
        description="Manage your blog posts, articles, and content shown across the storefront."
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-transparent py-1 rounded-2xl">
          {/* Top Bar: Search, Status Filter, Add Blog Button */}
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                placeholder="Search blogs by title..."
                value={search}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                className="w-full max-w-md"
              />

              <div className="w-full sm:w-56">
                <Select
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={statusFilterOptions}
                  placeholder="All Statuses"
                  className="h-11 rounded-xl"
                />
              </div>

              {hasActiveFilters && <ClearFiltersButton onClick={handleClearFilters} />}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Blog
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            <DataTable
              columns={columns}
              data={blogs}
              tableClassName="min-w-[1050px]"
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 30, 50]}
              page={data?.meta?.page ?? page}
              totalPages={
                data?.meta?.totalPages ??
                Math.max(1, Math.ceil((data?.meta?.total ?? blogs.length) / pageSize))
              }
              totalItems={data?.meta?.total ?? blogs.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      {/* CREATE BLOG MODAL */}
      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Blog Post"
        description="Write a new article, upload a cover image with crop, and set its publishing status."
        size="lg"
      >
        <BlogForm
          isLoading={createMutation.isPending}
          submitLabel="Create Blog Post"
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={async (formData: CreateBlogSchemaInput) => {
            await createMutation.mutateAsync(formData);
            setIsCreateOpen(false);
            refetch();
          }}
        />
      </FormModal>

      {/* EDIT BLOG MODAL */}
      <FormModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedBlog(null);
        }}
        title="Edit Blog Post"
        description="Update article details, replace cover image, or change status."
        size="lg"
      >
        {selectedBlog && (
          <BlogForm
            initialData={selectedBlog}
            isEditing
            isLoading={updateMutation.isPending}
            submitLabel="Update Blog Post"
            onCancel={() => {
              setIsEditOpen(false);
              setSelectedBlog(null);
            }}
            onSubmit={async (formData: CreateBlogSchemaInput) => {
              const payload: Partial<CreateBlogSchemaInput> = {};

              if (formData.title?.trim() !== (selectedBlog.title || "").trim()) {
                payload.title = formData.title.trim();
              }
              if (formData.content?.trim() !== (selectedBlog.content || "").trim()) {
                payload.content = formData.content.trim();
              }
              const formExcerpt = formData.excerpt?.trim() || "";
              const origExcerpt = selectedBlog.excerpt?.trim() || "";
              if (formExcerpt !== origExcerpt) {
                payload.excerpt = formExcerpt;
              }
              const formImage = formData.image?.trim() || "";
              const origImage = selectedBlog.image?.trim() || "";
              if (formImage !== origImage) {
                payload.image = formImage;
              }
              if (formData.status && formData.status !== selectedBlog.status) {
                payload.status = formData.status;
              }
              const formMetaTitle = formData.metaTitle?.trim() || "";
              const origMetaTitle = selectedBlog.metaTitle?.trim() || "";
              if (formMetaTitle !== origMetaTitle) {
                payload.metaTitle = formMetaTitle;
              }
              const formMetaDesc = formData.metaDescription?.trim() || "";
              const origMetaDesc = selectedBlog.metaDescription?.trim() || "";
              if (formMetaDesc !== origMetaDesc) {
                payload.metaDescription = formMetaDesc;
              }

              if (Object.keys(payload).length === 0) {
                setIsEditOpen(false);
                setSelectedBlog(null);
                return;
              }

              await updateMutation.mutateAsync({
                id: selectedBlog.id,
                data: payload,
              });
              setIsEditOpen(false);
              setSelectedBlog(null);
              refetch();
            }}
          />
        )}
      </FormModal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            refetch();
          }
        }}
        title="Delete Blog Post"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Blog"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
