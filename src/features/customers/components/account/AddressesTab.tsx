"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
} from "../../hooks/use-customer-address";
import {
  createCustomerAddressSchema,
  updateCustomerAddressSchema,
  type CreateCustomerAddressInput,
} from "../../validations/customer-address.schema";
import type { CustomerAddressResponse } from "../../types/customer-address.types";
import { CustomDropdown } from "./CustomDropdown";

const LABEL_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work / Office" },
  { value: "parents", label: "Parents / Family"},
  { value: "other", label: "Other" },
];

type AddressFormData = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: "shipping" | "billing";
  isDefault: boolean;
};

function getDirtyAddressFields(
  current: AddressFormData,
  initial: AddressFormData
): Record<string, any> {
  const dirty: Record<string, any> = {};

  if (current.fullName.trim() !== initial.fullName.trim()) {
    dirty.fullName = current.fullName.trim();
  }

  if (current.phone.trim() !== initial.phone.trim()) {
    dirty.phone = current.phone.trim();
  }

  if (current.label.trim() !== initial.label.trim()) {
    dirty.label = current.label.trim() || undefined;
  }

  if (current.addressType !== initial.addressType) {
    dirty.addressType = current.addressType;
  }

  if (current.addressLine1.trim() !== initial.addressLine1.trim()) {
    dirty.addressLine1 = current.addressLine1.trim();
  }

  if (current.addressLine2.trim() !== initial.addressLine2.trim()) {
    dirty.addressLine2 = current.addressLine2.trim() || undefined;
  }

  if (current.landmark.trim() !== initial.landmark.trim()) {
    dirty.landmark = current.landmark.trim() || undefined;
  }

  if (current.city.trim() !== initial.city.trim()) {
    dirty.city = current.city.trim();
  }

  if (current.state.trim() !== initial.state.trim()) {
    dirty.state = current.state.trim();
  }

  if (current.pincode.trim() !== initial.pincode.trim()) {
    dirty.pincode = current.pincode.trim();
  }

  if (current.isDefault !== initial.isDefault) {
    dirty.isDefault = current.isDefault;
  }

  return dirty;
}

export function AddressesTab() {
  const { data: addresses = [], isLoading, error, refetch } = useCustomerAddresses();
  const createMutation = useCreateCustomerAddress();
  const updateMutation = useUpdateCustomerAddress();
  const deleteMutation = useDeleteCustomerAddress();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Custom dropdown open state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<AddressFormData>({
    label: "home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    country: "India",
    addressType: "shipping",
    isDefault: false,
  });

  // Handle clicking outside custom dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFieldChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (editingId) {
      setDirtyFields((prev) => new Set(prev).add(field));
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleStartEdit = (address: CustomerAddressResponse) => {
    const loadedData: AddressFormData = {
      label: address.label || "home",
      fullName: address.fullName || "",
      phone: address.phone ? address.phone.replace(/^\+91/, "").trim() : "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "Tamil Nadu",
      pincode: address.pincode || "",
      country: address.country || "India",
      addressType: (address.addressType as "shipping" | "billing") || "shipping",
      isDefault: Boolean(address.isDefault),
    };

    setFormData(loadedData);
    setDirtyFields(new Set());
    setEditingId(address.id);
    setFieldErrors({});
    setServerError(null);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDirtyFields(new Set());
    setFieldErrors({});
    setServerError(null);
    setIsDropdownOpen(false);
    setFormData({
      label: "home",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      country: "India",
      addressType: "shipping",
      isDefault: false,
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setServerError(null);

    if (editingId) {
      // EDIT MODE: If no fields were touched, exit gracefully
      if (dirtyFields.size === 0) {
        handleCancel();
        return;
      }

      // Construct payload containing strictly only dirty/touched fields
      const dirtyPayload: Record<string, any> = {};
      if (dirtyFields.has("fullName")) dirtyPayload.fullName = formData.fullName.trim();
      if (dirtyFields.has("phone")) dirtyPayload.phone = formData.phone.trim();
      if (dirtyFields.has("label")) dirtyPayload.label = formData.label.trim() || undefined;
      if (dirtyFields.has("addressType")) dirtyPayload.addressType = formData.addressType;
      if (dirtyFields.has("addressLine1")) dirtyPayload.addressLine1 = formData.addressLine1.trim();
      if (dirtyFields.has("addressLine2")) dirtyPayload.addressLine2 = formData.addressLine2.trim() || undefined;
      if (dirtyFields.has("landmark")) dirtyPayload.landmark = formData.landmark.trim() || undefined;
      if (dirtyFields.has("city")) dirtyPayload.city = formData.city.trim();
      if (dirtyFields.has("state")) dirtyPayload.state = formData.state.trim();
      if (dirtyFields.has("pincode")) dirtyPayload.pincode = formData.pincode.trim();
      if (dirtyFields.has("isDefault")) dirtyPayload.isDefault = formData.isDefault;

      // Validate only modified fields with update schema
      const validationResult = updateCustomerAddressSchema.safeParse(dirtyPayload);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0] || "general");
          if (!errors[fieldName]) {
            errors[fieldName] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      try {
        await updateMutation.mutateAsync({
          uuid: editingId,
          data: dirtyPayload,
        });
        handleCancel();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to update address. Please verify your details.";
        setServerError(errorMsg);
      }
    } else {
      // CREATE MODE: Full payload validation and submission
      const payload: CreateCustomerAddressInput = {
        label: formData.label.trim() || undefined,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        landmark: formData.landmark.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim() || "Tamil Nadu",
        pincode: formData.pincode.trim(),
        country: formData.country || "India",
        addressType: formData.addressType || "shipping",
        isDefault: formData.isDefault,
      };

      const validationResult = createCustomerAddressSchema.safeParse(payload);
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          const fieldName = String(issue.path[0] || "general");
          if (!errors[fieldName]) {
            errors[fieldName] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      try {
        await createMutation.mutateAsync(payload);
        handleCancel();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to save address. Please verify your details.";
        setServerError(errorMsg);
      }
    }
  };

  const currentLabelObj = LABEL_OPTIONS.find((opt) => opt.value === formData.label) || LABEL_OPTIONS[0];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-theme-surface border border-theme-border rounded-xl p-5 animate-pulse space-y-3 overflow-hidden"
          >
            <div className="h-5 rounded w-1/3 skeleton-shimmer" />
            <div className="h-10 rounded w-full skeleton-shimmer" />
            <div className="h-4 rounded w-1/2 skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-theme-text-muted">Failed to load saved addresses.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Tab Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          Saved Addresses
        </h2>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              handleCancel();
              setIsAdding(true);
            }}
            className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            Add New Address
          </button>
        )}
      </div>

      {/* Add / Edit Address Form Modal / Inline */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-theme-surface border border-theme-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs transition-all relative"
        >
          {/* Header with Title and Address Type Toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-theme-border-subtle">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
              {editingId ? "Edit Delivery Address" : "New Delivery Address"}
            </h3>

            {/* Address Type Toggle (Shipping / Billing) */}
            <div className="flex items-center gap-1 bg-theme-surface-warm p-1 rounded-xl border border-theme-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFieldChange("addressType", "shipping")}
                className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  formData.addressType === "shipping"
                    ? "bg-theme-secondary text-theme-secondary-fg shadow-xs"
                    : "text-theme-text-muted hover:text-theme-text-primary"
                }`}
              >
                Shipping
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFieldChange("addressType", "billing")}
                className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                  formData.addressType === "billing"
                    ? "bg-theme-secondary text-theme-secondary-fg shadow-xs"
                    : "text-theme-text-muted hover:text-theme-text-primary"
                }`}
              >
                Billing
              </button>
            </div>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="bg-theme-status-can-bg border border-red-200 text-theme-status-can-fg p-3.5 rounded-lg text-xs font-medium">
              <span className="font-semibold">Validation Error:</span> {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Full Name (e.g. Ashok Kumar) *"
                value={formData.fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.fullName ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.fullName && (
                <span className="text-[11px] text-red-600">{fieldErrors.fullName}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <input
                type="tel"
                disabled={isSubmitting}
                placeholder="Phone (10-digit, e.g. 9876543210) *"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.phone && (
                <span className="text-[11px] text-red-600">{fieldErrors.phone}</span>
              )}
            </div>

            {/* Custom Dropdown for Address Label */}
            <CustomDropdown
              options={LABEL_OPTIONS}
              value={formData.label}
              onChange={(val) => handleFieldChange("label", val)}
              disabled={isSubmitting}
            />

            {/* PIN Code */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="PIN Code (6 digits, e.g. 637001) *"
                value={formData.pincode}
                onChange={(e) => handleFieldChange("pincode", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.pincode ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.pincode && (
                <span className="text-[11px] text-red-600">{fieldErrors.pincode}</span>
              )}
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Address Line 1 (Door no., Building, Street) *"
                value={formData.addressLine1}
                onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.addressLine1 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine1 && (
                <span className="text-[11px] text-red-600">{fieldErrors.addressLine1}</span>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Address Line 2 (Area, Colony, Sector)"
                value={formData.addressLine2}
                onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.addressLine2 ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.addressLine2 && (
                <span className="text-[11px] text-red-600">{fieldErrors.addressLine2}</span>
              )}
            </div>

            {/* Landmark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Landmark (Optional, e.g. Near Bus Stand)"
                value={formData.landmark}
                onChange={(e) => handleFieldChange("landmark", e.target.value)}
                className="border border-theme-border-input rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="City *"
                value={formData.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.city ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.city && (
                <span className="text-[11px] text-red-600">{fieldErrors.city}</span>
              )}
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="State *"
                value={formData.state}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                className={`border rounded-lg px-3.5 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm focus:border-theme-primary transition-colors disabled:opacity-50 ${
                  fieldErrors.state ? "border-red-500 bg-red-50/20" : "border-theme-border-input"
                }`}
              />
              {fieldErrors.state && (
                <span className="text-[11px] text-red-600">{fieldErrors.state}</span>
              )}
            </div>

            {/* Set as Default Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-2 sm:col-span-2">
              <input
                type="checkbox"
                disabled={isSubmitting}
                checked={formData.isDefault}
                onChange={(e) => handleFieldChange("isDefault", e.target.checked)}
                className="w-4 h-4 rounded text-theme-primary accent-theme-primary cursor-pointer disabled:opacity-50"
              />
              <span className="text-xs font-medium text-theme-text-primary">
                Set as default delivery address
              </span>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                ? "Update Address"
                : "Save Address"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="border border-theme-border text-theme-text-subtle text-xs font-semibold uppercase tracking-wider py-2.5 px-5 rounded-lg cursor-pointer hover:bg-theme-surface-alt transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address Cards Grid */}
      {addresses.length === 0 && !isAdding ? (
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-sm text-theme-text-muted">No saved delivery addresses found.</p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-lg transition-colors cursor-pointer mt-4 min-h-[44px]"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a: CustomerAddressResponse) => {
            const labelUpper = (a.label || "Delivery").toUpperCase();
            const isBilling = a.addressType === "billing";

            return (
              <div
                key={a.id}
                className="bg-theme-surface border border-theme-border rounded-xl p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-theme-primary/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-theme-primary">
                      {labelUpper}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isBilling
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {a.addressType || "shipping"}
                    </span>
                    {a.isDefault && (
                      <span className="bg-theme-status-out-bg text-theme-status-out-fg text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary">
                    {a.fullName}
                  </div>
                  <div className="text-xs text-theme-text-subtle font-light leading-relaxed">
                    {a.addressLine1}
                    {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                    {a.landmark ? ` (Near ${a.landmark})` : ""}, {a.city} — {a.pincode}, {a.state}
                  </div>
                  <div className="text-xs text-theme-text-muted font-medium">
                    {a.phone}
                  </div>
                </div>

                {/* Card Action Buttons: Set as Default, Edit & Delete */}
                <div className="flex items-center gap-4 pt-2 border-t border-theme-border-subtle text-xs">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          uuid: a.id,
                          data: { isDefault: true },
                        })
                      }
                      disabled={updateMutation.isPending || deleteMutation.isPending}
                      className="font-medium text-theme-primary hover:text-theme-secondary cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    onClick={() => handleStartEdit(a)}
                    className="font-medium text-theme-secondary hover:text-theme-primary cursor-pointer transition-colors ml-auto disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(a.id)}
                    className="font-medium text-theme-status-can-fg hover:text-red-700 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
