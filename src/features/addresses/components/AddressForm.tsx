"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAddressSchema,
  type CreateAddressSchemaInput,
} from "../validations/address.schema";
import type { AddressItem } from "../types";

interface AddressFormProps {
  defaultValues?: AddressItem | null;
  isSubmitting?: boolean;
  onSubmit: (data: CreateAddressSchemaInput) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-error-600">{message}</p>;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function AddressForm({
  defaultValues,
  isSubmitting = false,
  onSubmit,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAddressSchemaInput>({
    resolver: zodResolver(createAddressSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      phone: defaultValues?.phone ?? "",
      addressLine1: defaultValues?.addressLine1 ?? "",
      addressLine2: defaultValues?.addressLine2 ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      postalCode: defaultValues?.postalCode ?? "",
      country: defaultValues?.country ?? "India",
      isDefault: defaultValues?.isDefault ?? false,
    },
  });

  return (
    <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-error-600">*</span>
          </label>
          <input {...register("firstName")} className={inputClass} placeholder="First name" />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input {...register("lastName")} className={inputClass} placeholder="Last name" />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile <span className="text-error-600">*</span>
        </label>
        <input {...register("phone")} className={inputClass} placeholder="Mobile number" />
        <FieldError message={errors.phone?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 <span className="text-error-600">*</span>
        </label>
        <input {...register("addressLine1")} className={inputClass} placeholder="House no, street, area" />
        <FieldError message={errors.addressLine1?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input {...register("addressLine2")} className={inputClass} placeholder="Apartment, landmark (optional)" />
        <FieldError message={errors.addressLine2?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-error-600">*</span>
          </label>
          <input {...register("city")} className={inputClass} placeholder="City" />
          <FieldError message={errors.city?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-error-600">*</span>
          </label>
          <input {...register("state")} className={inputClass} placeholder="State" />
          <FieldError message={errors.state?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode <span className="text-error-600">*</span>
          </label>
          <input {...register("postalCode")} className={inputClass} placeholder="Pincode" />
          <FieldError message={errors.postalCode?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input {...register("country")} className={inputClass} placeholder="Country" />
          <FieldError message={errors.country?.message} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          {...register("isDefault")}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
          Set as default address
        </label>
      </div>

      {isSubmitting && (
        <p className="text-sm text-muted-foreground">Saving address...</p>
      )}
    </form>
  );
}
