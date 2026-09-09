"use client";

import { useState } from "react";
import { sanitizeRichText } from "@/lib/sanitize-html";

interface ExpandableRichTextProps {
  html: string;
  className?: string;
  toggleClassName?: string;
  clampClassName?: string;
}

function ExpandableRichText({
  html,
  className = "",
  toggleClassName = "text-sm font-medium text-primary hover:underline mt-1",
  clampClassName = "line-clamp-3",
}: ExpandableRichTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className={`rich-text-content ${className} ${expanded ? "" : clampClassName}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
      />
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={toggleClassName}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

export { ExpandableRichText };
