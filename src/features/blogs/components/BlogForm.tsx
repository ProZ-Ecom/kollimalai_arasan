"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBlogSchema, type CreateBlogSchemaInput } from "../validations/blog.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormImageUpload } from "@/components/forms/form-image-upload";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { BlogListItem } from "../types";

export interface BlogFormProps {
  initialData?: BlogListItem | null;
  isEditing?: boolean;
  onSubmit: (data: CreateBlogSchemaInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function BlogForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Blog",
}: BlogFormProps) {
  const methods = useForm<CreateBlogSchemaInput>({
    resolver: zodResolver(createBlogSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: initialData?.title ?? "",
      content: initialData?.content ?? "",
      excerpt: initialData?.excerpt ?? "",
      image: initialData?.image ?? "",
      status: (initialData?.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") ?? "DRAFT",
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
    },
  });

  const watchTitle = methods.watch("title");
  const slugPreview = slugify(watchTitle || "");

  const handleSubmitForm = async (values: CreateBlogSchemaInput) => {
    const cleanData: CreateBlogSchemaInput = {
      title: values.title.trim(),
      content: values.content.trim(),
      excerpt: values.excerpt?.trim() || undefined,
      image: values.image?.trim() || undefined,
      status: values.status || "DRAFT",
      metaTitle: values.metaTitle?.trim() || undefined,
      metaDescription: values.metaDescription?.trim() || undefined,
    };
    await onSubmit(cleanData);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmitForm)} className="space-y-5" noValidate>
        {/* Title & Slug */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            name="title"
            label="Blog Title"
            placeholder="e.g. Health Benefits of Pure Kolli Hills Wild Honey"
            required
            description="The main title for your article"
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5">
              Slug (URL Identifier)
            </label>
            <input
              readOnly
              tabIndex={-1}
              value={slugPreview ? `/${slugPreview}` : "/auto-generated-slug"}
              className="w-full h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 text-sm text-neutral-500 font-mono focus:outline-none select-none cursor-default"
            />
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
              Automatically generated from the title
            </p>
          </div>
        </div>

        {/* Featured Image with Crop */}
        <div className="w-full">
          <FormImageUpload
            name="image"
            label="Featured Cover Image"
            folder="blogs"
            enableCrop
            cropWidth={800}
            cropHeight={450}
            aspectRatioClassName="w-full h-56 sm:h-72"
            maxSizeMB={5}
            infoMessage="Upload a JPG, PNG, or WebP image up to 5MB. Recommended size: 800 × 450 px (16:9 ratio). You can reposition and crop your image."
          />
        </div>

        {/* Excerpt */}
        <FormTextarea
          name="excerpt"
          label="Short Excerpt / Summary"
          placeholder="Brief summary displayed on blog cards and search results..."
          rows={2}
          description="Optional short overview of the article (recommended under 200 characters)"
        />

        {/* Content */}
        <FormTextarea
          name="content"
          label="Article Content"
          placeholder="Write your article content here (supports HTML formatting)..."
          rows={7}
          required
          description="The main content body of your blog post"
        />

        {/* Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            name="status"
            label="Publication Status"
            placeholder="Select status"
            options={statusOptions}
            required
            description="Control whether this post is visible on the storefront"
          />
        </div>

        {/* SEO Meta Fields */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-neutral-600)]">
            SEO &amp; Metadata (Optional)
          </h4>

          <FormInput
            name="metaTitle"
            label="SEO Meta Title"
            placeholder="Custom title tag for search engines"
            maxLength={255}
          />

          <FormTextarea
            name="metaDescription"
            label="SEO Meta Description"
            placeholder="Brief meta description for search engine snippets..."
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          )}

          <FormSubmitButton
            isLoading={isLoading}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}
