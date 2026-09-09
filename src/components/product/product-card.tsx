import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, calculateDiscountPrice, getImageUrl } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
}

function ProductCard({ product }: ProductCardProps) {
  const hasDiscount =
    product.discountPercent > 0 || (product.comparePrice && product.comparePrice > product.price);

  const effectivePrice = hasDiscount
    ? calculateDiscountPrice(Number(product.price), Number(product.discountPercent))
    : Number(product.price);

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={getImageUrl(primaryImage.url)}
              alt={primaryImage.altText || product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{Number(product.discountPercent)}%
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-muted-foreground mt-1">
            {product.category.name}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(effectivePrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(Number(product.price))}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1">
            <ShoppingCart className="mr-1 h-4 w-4" />
            Add to Cart
          </Button>
          <Button size="sm" variant="outline">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductCard };
