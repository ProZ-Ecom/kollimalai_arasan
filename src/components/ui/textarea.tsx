import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          aria-invalid={!!error}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all",
            "focus:outline-none focus:border-secondary-600 focus:ring-2 focus:ring-secondary-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600/20 hover:border-neutral-300",
            error && "border-error-500 focus:border-error-500 focus:ring-error-500/20 focus-visible:border-error-500 focus-visible:ring-error-500/20 bg-error-50/10",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
