"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressCard } from "./AddressCard";
import { EmptyState } from "@/components/ui/empty-state";
import type { AddressItem } from "../types";

interface AddressListProps {
  addresses: AddressItem[];
  selectedId?: number | null;
  selectable?: boolean;
  onSelect?: (id: number) => void;
  onAdd?: () => void;
  onEdit?: (address: AddressItem) => void;
  onDelete?: (id: number) => void;
  onSetDefault?: (id: number) => void;
}

export function AddressList({
  addresses,
  selectedId,
  selectable = false,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <div>
        <EmptyState
          title="No addresses saved"
          description="Add a delivery address to continue with checkout."
        >
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          )}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            selectable={selectable}
            selected={selectedId === address.id}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
          />
        ))}
      </div>

      {onAdd && (
        <Button variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      )}
    </div>
  );
}
