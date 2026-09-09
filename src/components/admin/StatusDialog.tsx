"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "activate" | "deactivate";
  itemName?: string;
  isLoading?: boolean;
}

function StatusDialog({
  open,
  onClose,
  onConfirm,
  action,
  itemName,
  isLoading,
}: StatusDialogProps) {
  const title = action === "activate" ? "Activate" : "Deactivate";
  const description =
    action === "activate"
      ? `Are you sure you want to activate${itemName ? ` "${itemName}"` : ""}?`
      : `Are you sure you want to deactivate${itemName ? ` "${itemName}"` : ""}?`;
  const confirmText = action === "activate" ? "Activate" : "Deactivate";

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      variant={action === "deactivate" ? "destructive" : "default"}
      isLoading={isLoading}
    />
  );
}

export { StatusDialog };
export type { StatusDialogProps };
