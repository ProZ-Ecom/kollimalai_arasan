"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

function DeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  isLoading,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}

export { DeleteDialog };
export type { DeleteDialogProps };
