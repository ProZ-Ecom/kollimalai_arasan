"use client";

import * as React from "react";
import { Star, CheckCircle2, ChevronDown } from "lucide-react";
import {
  usePublicProductReviews,
  usePublicVariantReviews,
} from "../hooks/use-public-reviews";
import type { PublicReviewItem } from "../types/review.types";

interface ProductReviewsSectionProps {
  variantId?: string | null;
  variantName?: string;
  productName?: string;
  productIdOrSlug?: string | null;
}

function getInitials(name?: string): string {
  if (!name) return "CB";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProductReviewsSection({
  variantId,
  variantName,
  productName,
  productIdOrSlug,
}: ProductReviewsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

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

  const targetTitle = variantName || productName || "Authentic Snack";

  return (
    <section id="reviews-section" className="w-full bg-[#FAF7F2] py-16 sm:py-20 my-8 rounded-3xl border border-[#F0EAE1]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#8B1D1D] block mb-2 font-sans">
            Customer Feedback
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#2B1B17] tracking-tight leading-tight">
            Loved Across Generations
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-2.5 leading-relaxed">
            Reviews for{" "}
            <strong className="text-[#2B1B17] font-bold">{targetTitle}</strong>{" "}
            from genuine sweet lovers and festive patrons
          </p>

          {/* Social Proof Rating Pill (Only if reviews exist) */}
          {totalCount > 0 && (
            <div className="inline-flex items-center justify-center gap-2 mt-3.5 px-4 py-1.5 rounded-full bg-white/90 border border-stone-200/80 text-xs font-semibold text-stone-700 shadow-2xs">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-200 text-stone-200"
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-stone-900">{avgRating.toFixed(1)}</span>
              <span className="text-stone-300">•</span>
              <span>
                {totalCount} customer {totalCount === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>

        {/* Reviews Grid or Clean Empty State */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white/90 rounded-3xl border border-stone-200/70 max-w-md mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#F5EDE3] text-[#8B1D1D] flex items-center justify-center mx-auto mb-3.5">
              <Star className="w-6 h-6 stroke-[1.5] text-[#8B1D1D]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2B1B17]">No Reviews Yet</h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
              Be the first to taste <strong className="text-stone-700">{targetTitle}</strong> and share your thoughts with fellow food connoisseurs!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {displayedReviews.map((review: PublicReviewItem) => {
            const initials = getInitials(review.customerName);
            const location = review.title || "Verified Customer";

            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/70 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-between animate-in fade-in duration-200"
              >
                <div>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-amber-500 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-stone-200 text-stone-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment Quote */}
                  <p className="text-stone-700 text-sm sm:text-[14.5px] leading-relaxed italic font-normal">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Reviewer Profile */}
                <div className="mt-7 pt-5 border-t border-stone-100 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#F5EDE3] text-[#8B1D1D] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {initials}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#2B1B17] truncate">
                      {review.customerName}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified Buyer</span>
                      {location && (
                        <>
                          <span className="text-stone-300 mx-0.5">•</span>
                          <span className="text-stone-500 truncate">{location}</span>
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#DCC7B7] bg-white hover:bg-[#F5ECE1] text-[#7A2224] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
            >
              <span>
                {isExpanded
                  ? "Show Less Reviews"
                  : `View All ${reviews.length} Reviews`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#7A2224] transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductReviewsSection;

