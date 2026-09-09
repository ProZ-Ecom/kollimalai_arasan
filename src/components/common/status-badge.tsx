import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, "success" | "warning" | "destructive" | "info" | "default" | "outline"> = {
  ACTIVE: "success",
  INACTIVE: "outline",
  BLOCKED: "destructive",
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "warning",
  RETURNED: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
  PUBLISHED: "success",
  DRAFT: "outline",
  ARCHIVED: "outline",
};

function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusColorMap[status] || "default";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}

export { StatusBadge };
