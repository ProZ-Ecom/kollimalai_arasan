"use client";

import * as React from "react";

export function ProductCardSkeleton() {
  return (
    <div
      className="
        bg-white
        rounded-xl
        border
        border-gray-200
        p-2
        sm:p-4
        animate-pulse
      "
    >
      {/* Image */}
      <div
        className="
          w-full
          h-[160px]
          sm:h-[200px]
          md:h-[260px]
          bg-gray-200
          rounded
        "
      />

      {/* Title + Weight */}
      <div className="flex justify-between mt-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>

        <div className="space-y-2">
          <div className="h-6 w-12 bg-gray-200 rounded" />
          <div className="h-6 w-12 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Price */}
      <div className="flex gap-3 mt-4">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>

      {/* Button */}
      <div className="flex justify-end mt-5">
        <div
          className="
            h-[40px]
            w-[80%]
            sm:w-[70%]
            bg-gray-200
            rounded
          "
        />
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
