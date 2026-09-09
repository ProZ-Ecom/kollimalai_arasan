"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/query-keys";
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../api/get-products";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: Record<string, unknown>;
    }) => updateAdminProduct(uuid, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.uuid),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteAdminProduct(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useCreateProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      images,
    }: {
      productUuid: string;
      images: Array<{
        imageUrl: string;
        sortOrder?: number;
        isPrimary?: boolean;
      }>;
    }) => {
      const { createAdminProductImages } = await import("../api/get-products");
      return createAdminProductImages(productUuid, images);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
    },
  });
}

export function useUpdateProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
      data,
    }: {
      productUuid: string;
      imageId: string;
      data: { imageUrl?: string; sortOrder?: number };
    }) => {
      const { updateAdminProductImage } = await import("../api/get-products");
      return updateAdminProductImage(productUuid, imageId, data);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
    },
  });
}

export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
    }: {
      productUuid: string;
      imageId: string;
    }) => {
      const { setPrimaryAdminProductImage } = await import("../api/get-products");
      return setPrimaryAdminProductImage(productUuid, imageId);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productUuid),
      });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productUuid,
      imageId,
    }: {
      productUuid: string;
      imageId: string;
    }) => {
      const { deleteAdminProductImage } = await import("../api/get-products");
      return deleteAdminProductImage(productUuid, imageId);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...productKeys.all, "images", variables.productUuid],
      });
    },
  });
}
