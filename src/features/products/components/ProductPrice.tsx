import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface ProductPriceProps {
  price: number;
  comparePrice?: number | null;
  discountPercent?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function ProductPrice({ price, comparePrice, discountPercent = 0, size = "md", className }: ProductPriceProps) {
  const hasDiscount =
    discountPercent > 0 || (comparePrice && comparePrice > price);

  const effectivePrice = hasDiscount
    ? price - (price * discountPercent) / 100
    : price;

  const sizeClasses = {
    sm: { price: "text-base font-bold", compare: "text-xs" },
    md: { price: "text-xl font-bold", compare: "text-sm" },
    lg: { price: "text-2xl font-bold", compare: "text-base" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn(sizeClasses[size].price, "text-primary")}>
        {formatPrice(effectivePrice)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn(sizeClasses[size].compare, "text-muted-foreground line-through")}>
            {formatPrice(price)}
          </span>
          <span className="text-sm font-medium text-red-500">
            -{discountPercent > 0 ? discountPercent : Math.round(((price - effectivePrice) / price) * 100)}%
          </span>
        </>
      )}
    </div>
  );
}

export { ProductPrice };
