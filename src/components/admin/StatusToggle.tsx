"use client";

import { Switch } from "@/components/ui/Switch";

interface StatusToggleProps {
  id: number;
  isActive: boolean;
  onToggle: (id: number, isActive: boolean) => void;
  disabled?: boolean;
}

function StatusToggle({ id, isActive, onToggle, disabled }: StatusToggleProps) {
  return (
    <Switch
      checked={isActive}
      onCheckedChange={() => onToggle(id, !isActive)}
      disabled={disabled}
    />
  );
}

export { StatusToggle };
export type { StatusToggleProps };
