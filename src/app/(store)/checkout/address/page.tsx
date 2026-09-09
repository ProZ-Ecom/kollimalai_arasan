"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AddressList } from "@/features/addresses/components/AddressList";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/addresses/hooks";
import { useCheckout } from "@/features/checkout/checkout-context";
import type { AddressItem } from "@/features/addresses/types";
import type { CreateAddressSchemaInput } from "@/features/addresses/validations/address.schema";

export default function CheckoutAddressPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const checkout = useCheckout();

  const { data: addresses, isLoading, error, refetch } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (status === "loading" || isLoading) {
    return <LoadingState text="Loading addresses..." />;
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/checkout/address");
    return null;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load addresses. Please try again."
        onRetry={refetch}
      />
    );
  }

  const handleOpenModal = (address?: AddressItem) => {
    setEditingAddress(address ?? null);
    setModalOpen(true);
  };

  const handleSubmit = (data: CreateAddressSchemaInput) => {
    if (editingAddress) {
      updateAddress.mutate(
        { id: editingAddress.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingAddress(null);
          },
        }
      );
    } else {
      createAddress.mutate(data, {
        onSuccess: (created) => {
          setModalOpen(false);
          checkout.setAddressId(created.id);
        },
      });
    }
  };

  const isSubmitting = createAddress.isPending || updateAddress.isPending;
  const selectedAddressExists = addresses?.some(
    (a) => a.id === checkout.addressId
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Address</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a delivery address for this order.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/checkout")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Checkout
        </Button>
      </div>

      <AddressList
        addresses={addresses ?? []}
        selectable
        selectedId={
          selectedAddressExists ? checkout.addressId : undefined
        }
        onSelect={(id) => checkout.setAddressId(id)}
        onAdd={() => handleOpenModal()}
        onEdit={(address) => handleOpenModal(address)}
        onDelete={(id) => setDeleteId(id)}
        onSetDefault={(id) => setDefaultAddress.mutate(id)}
      />

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {checkout.addressId ? "Address selected" : "No address selected yet"}
        </p>
        <Button
          onClick={() => router.push("/checkout")}
          disabled={!checkout.addressId}
          size="lg"
        >
          Proceed to Checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? "Edit Address" : "Add Address"}
        description={
          editingAddress
            ? "Update your delivery address details"
            : "Add a new delivery address"
        }
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingAddress(null);
              }}
            >
              Cancel
            </Button>
            <Button
              form="address-form"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </>
        }
      >
        <AddressForm
          defaultValues={editingAddress}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteAddress.mutate(deleteId, {
              onSuccess: () => {
                if (checkout.addressId === deleteId) {
                  checkout.setAddressId(null);
                }
                setDeleteId(null);
              },
            });
          }
        }}
        title="Delete Address"
        description="Are you sure you want to delete this address?"
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteAddress.isPending}
      />

      {!addresses?.length && (
        <Button className="mt-4" onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      )}
    </div>
  );
}
