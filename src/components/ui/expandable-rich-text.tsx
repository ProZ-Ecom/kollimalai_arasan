"use client";

import { useState } from "react";
import { sanitizeRichText } from "@/lib/sanitize-html";

interface ExpandableRichTextProps {
  html: string;
  className?: string;
  toggleClassName?: string;
  clampClassName?: string;
  threshold?: number;
}

function ExpandableRichText({
  html,
  className = "",
  toggleClassName = "text-sm font-medium text-primary hover:underline mt-1",
  clampClassName = "line-clamp-3",
  threshold = 150,
}: ExpandableRichTextProps) {
  const [expanded, setExpanded] = useState(false);

  // Strip HTML tags to measure actual visible text length
  const plainText = html.replace(/<[^>]+>/g, "").trim();
  const isLong = plainText.length > threshold;

  return (
    <div>
      <div
        className={`rich-text-content ${className} ${isLong && !expanded ? clampClassName : ""}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
      />
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={toggleClassName}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export { ExpandableRichText };
