"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  className?: string;
}

function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn("text-sm text-red-500", className)}
    >
      {message}
    </p>
  );
}

export { FormError };
export type { FormErrorProps };
