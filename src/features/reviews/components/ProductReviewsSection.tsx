"use client";

import * as React from "react";
import { Star, CheckCircle2, ChevronDown, PenLine } from "lucide-react";
import {
  usePublicProductReviews,
  usePublicVariantReviews,
} from "../hooks/use-public-reviews";
import type { PublicReviewItem } from "../types/review.types";
import type { CustomerVariantUnitPriceDto } from "@/features/customers/types/catalog.types";
import { WriteReviewModal } from "./WriteReviewModal";

interface ProductReviewsSectionProps {
  productId?: string | null;
  productIdOrSlug?: string | null;
  productName?: string;
  variantId?: string | null;
  variantName?: string;
  selectedUnitPriceId?: string | null;
  packSizes?: CustomerVariantUnitPriceDto[];
}

function getInitials(name?: string): string {
  if (!name) return "CB";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProductReviewsSection({
  productId,
  productIdOrSlug,
  productName,
  variantId,
  variantName,
  selectedUnitPriceId,
  packSizes = [],
}: ProductReviewsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = React.useState(false);

  // Collapse back to top 3 reviews whenever the selected variant changes
  React.useEffect(() => {
    setIsExpanded((prev) => (prev ? false : prev));
  }, [variantId]);

  // Query reviews for the specific selected variant if variantId is provided, else fallback to product
  const { data: variantData, isLoading: isVariantLoading } =
    usePublicVariantReviews(variantId, {
      enabled: Boolean(variantId),
    });

  const { data: productData, isLoading: isProductLoading } =
    usePublicProductReviews(!variantId ? productIdOrSlug : null, {
      enabled: !variantId && Boolean(productIdOrSlug),
    });

  const data = variantId ? variantData : productData;
  const isLoading = variantId ? isVariantLoading : isProductLoading;

  const reviews = data?.reviews ?? [];

  // Only show 3 cards at start, or all if expanded
  const displayedReviews = isExpanded ? reviews : reviews.slice(0, 3);

  const avgRating = data?.ratingSummary?.averageRating ?? 0;
  const totalCount = data?.ratingSummary?.totalReviews ?? reviews.length;

  const targetTitle = variantName || productName || "Natural Spices";

  return (
    <section id="reviews-section" className="w-full bg-[#FAFAFA] py-16 sm:py-20 my-8 rounded-3xl border border-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#007F06] block mb-2 font-sans">
            Customer Feedback
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#101010] tracking-tight leading-tight">
            Loved Across Generations
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mt-2.5 leading-relaxed">
            Reviews for{" "}
            <strong className="text-[#101010] font-bold">{targetTitle}</strong>{" "}
            from genuine customers and home chefs
          </p>

          {/* Social Proof Rating Pill & Write a Review Action */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {totalCount > 0 && (
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 shadow-2xs">
                <div className="flex items-center gap-0.5 text-primary-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(avgRating)
                          ? "fill-primary-400 text-primary-400"
                          : "fill-neutral-200 text-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-neutral-900">{avgRating.toFixed(1)}</span>
                <span className="text-neutral-300">•</span>
                <span>
                  {totalCount} customer {totalCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsWriteReviewOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#006B05] text-white text-xs sm:text-sm font-semibold hover:bg-[#005504] shadow-xs hover:shadow-sm transition-all cursor-pointer select-none active:scale-95"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid or Clean Empty State */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white/90 rounded-3xl border border-neutral-200/70 max-w-md mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#F5F5F5] text-[#007F06] flex items-center justify-center mx-auto mb-3.5">
              <Star className="w-6 h-6 stroke-[1.5] text-[#007F06]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#101010]">No Reviews Yet</h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
              Be the first to experience <strong className="text-neutral-700">{targetTitle}</strong> and share your thoughts with fellow spice enthusiasts!
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006B05] text-white text-xs sm:text-sm font-semibold hover:bg-[#005504] shadow-xs hover:shadow-sm transition-all cursor-pointer select-none active:scale-95"
              >
                <PenLine className="w-4 h-4" />
                <span>Write the First Review</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {displayedReviews.map((review: PublicReviewItem) => {
              const initials = getInitials(review.customerName);
              const location = review.title || "Verified Customer";

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-neutral-200/70 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between animate-in fade-in duration-200"
                >
                  <div>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-primary-500 mb-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-primary-400 text-primary-400"
                              : "fill-neutral-200 text-neutral-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment Quote */}
                    <p className="text-neutral-700 text-sm sm:text-[14.5px] leading-relaxed italic font-normal">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  {/* Reviewer Profile */}
                  <div className="mt-7 pt-5 border-t border-neutral-100 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] text-[#007F06] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {initials}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-[#101010] truncate">
                        {review.customerName}
                      </span>
                      <span className="text-xs text-secondary-700 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary-600 shrink-0" />
                        <span>Verified Buyer</span>
                        {location && (
                          <>
                            <span className="text-neutral-300 mx-0.5">•</span>
                            <span className="text-neutral-500 truncate">{location}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Reviews / Show Less Toggle Button */}
        {reviews.length > 3 && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D4D4D4] bg-white hover:bg-[#F5F5F5] text-[#007F06] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
            >
              <span>
                {isExpanded
                  ? "Show Less Reviews"
                  : `View All ${reviews.length} Reviews`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#007F06] transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        productId={productId}
        variantId={variantId}
        variantName={variantName}
        productName={productName}
        selectedUnitPriceId={selectedUnitPriceId}
        packSizes={packSizes}
      />
    </section>
  );
}

export default ProductReviewsSection;
