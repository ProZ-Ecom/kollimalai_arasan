"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema } from "../validations/category.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormImageUpload } from "@/components/forms/form-image-upload";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { z } from "zod";

type CategoryFormData = z.infer<typeof createCategorySchema>;

interface ParentCategoryOption {
  value: string;
  label: string;
}

interface CategoryFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
  parentCategories?: ParentCategoryOption[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function CategoryForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Category",
}: CategoryFormProps) {
  const methods = useForm<CategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: (initialData?.name as string) || "",
      slug: (initialData?.slug as string) || "",
      description: (initialData?.description as string) || "",
      image: (initialData?.image as string) || "",
      parentId: (initialData?.parentId as number) ?? undefined,
      isActive: (initialData?.isActive as boolean) ?? true,
      sortOrder: (initialData?.sortOrder as number) || 0,
      metaTitle: (initialData?.metaTitle as string) || "",
      metaDescription: (initialData?.metaDescription as string) || "",
    },
  });

  return (
    <FormProvider {...methods}>
      <form
          onSubmit={methods.handleSubmit((data) => {
            console.log("Category Form Data:", data);
            onSubmit(data as CategoryFormData);
          })}
          className="space-y-6"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Category Name"
            placeholder="Enter category name"
            required
          />

          <FormInput
            name="slug"
            label="Category Code"
            placeholder="e.g. SWEETS_SNACKS"
            infoMessage="Use letters, numbers, and underscores only (e.g. SWEETS_SNACKS). No spaces or other special characters allowed."
            required
          />
        </div>

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Enter category description"
        />

        <FormImageUpload
          name="image"
          label="Category Image"
          folder="categories"
          infoMessage="Upload a JPG, PNG, or WebP image up to 5MB. Recommended size: 500 × 500 px."
          required
        />

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            name="image"
            label="Image URL"
            placeholder="https://example.com/image.jpg"
          />

          <FormSelect
            name="parentId"
            label="Parent Category"
            placeholder="None (Top Level)"
            options={[{ value: "", label: "None (Top Level)" }, ...parentCategories]}
          />

          
        </div> */}

        {/* <FormCheckbox
          name="isActive"
          label="Active"
          description="Category is visible and available for use"
        /> */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="metaTitle"
            label="Meta Title"
            placeholder="SEO meta title"
          />

          <FormInput
            name="metaDescription"
            label="Meta Description"
            placeholder="SEO meta description"
          />
        </div> */}

        <FormInput
            name="sortOrder"
            label="Sort Order"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="0"
        />

        <div className="flex justify-end pt-4">
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

export { CategoryForm };
