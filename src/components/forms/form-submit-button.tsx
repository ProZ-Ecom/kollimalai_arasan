"use client";

import { useFormContext } from "react-hook-form";
import { Button, type ButtonProps } from "@/components/ui/button";

interface FormSubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  children: React.ReactNode;
}

function FormSubmitButton({
  isLoading,
  children,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { formState } = useFormContext();

  return (
    <Button
      type="submit"
      disabled={formState.isSubmitting || disabled}
      isLoading={isLoading || formState.isSubmitting}
      {...props}
    >
      {children}
    </Button>
  );
}

export { FormSubmitButton };
