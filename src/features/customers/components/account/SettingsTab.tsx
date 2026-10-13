"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { changeCustomerPasswordSchema } from "../../validations/customer-profile.schema";

export function SettingsTab() {
  const [prefs, setPrefs] = useState({
    whatsapp: true,
    festiveOffers: true,
    newsletter: false,
    restock: true,
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (formError) setFormError(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccessMsg(null);

    const validationResult = changeCustomerPasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0] || "general");
        if (!newErrors[fieldName]) {
          newErrors[fieldName] = issue.message;
        }
      });
      setFieldErrors(newErrors);
      if (newErrors.general) {
        setFormError(newErrors.general);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/customer/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: validationResult.data.currentPassword,
          newPassword: validationResult.data.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          "Failed to update password.";

        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes("current password")) {
          setFieldErrors({ currentPassword: msg });
        } else if (lowerMsg.includes("new password")) {
          setFieldErrors({ newPassword: msg });
        } else if (data?.errors && Array.isArray(data.errors)) {
          const apiFieldErrors: Record<string, string> = {};
          data.errors.forEach((errStr: string) => {
            const [field, ...rest] = errStr.split(":");
            if (field && rest.length > 0) {
              apiFieldErrors[field.trim()] = rest.join(":").trim();
            }
          });
          if (Object.keys(apiFieldErrors).length > 0) {
            setFieldErrors(apiFieldErrors);
          } else {
            setFormError(msg);
          }
        } else {
          setFormError(msg);
        }
        return;
      }

      setSuccessMsg(data?.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const notificationOptions = [
    {
      key: "whatsapp" as const,
      label: "Order updates on WhatsApp",
      hint: "Dispatch, live delivery, and delay alerts sent directly to your phone",
    },
    {
      key: "festiveOffers" as const,
      label: "Festive offers & harvest alerts",
      hint: "Seasonal organic harvest drops, farm produce, and spice offers",
    },
    {
      key: "newsletter" as const,
      label: "Email newsletter",
      hint: "Traditional hill farming recipes and newly added spices twice a month",
    },
    {
      key: "restock" as const,
      label: "Restock reminders",
      hint: "Notifications when a saved wishlist item is back in stock",
    },
  ];

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Notifications Preferences */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
            Notification Preferences
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-theme-border-subtle">
          {notificationOptions.map((opt) => {
            const isChecked = prefs[opt.key];

            return (
              <div
                key={opt.key}
                className="flex items-center justify-between gap-4 p-4 sm:p-5"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs sm:text-sm font-semibold text-theme-text-primary">
                    {opt.label}
                  </div>
                  <div className="text-xs text-theme-text-muted font-light mt-0.5">
                    {opt.hint}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, [opt.key]: !isChecked })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center flex-shrink-0 cursor-pointer ${
                    isChecked ? "bg-theme-status-del-fg justify-end" : "bg-theme-border justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-5 sm:p-6 space-y-4" noValidate>
          {successMsg && (
            <div className="p-3.5 rounded-lg text-xs font-medium bg-theme-status-del-bg text-theme-status-del-fg flex items-center gap-2 border border-theme-status-del-fg/20">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-lg text-xs font-medium bg-theme-status-can-bg text-theme-status-can-fg flex items-center gap-2 border border-theme-status-can-fg/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-current-pwd"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                Current Password <span className="text-error-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="settings-current-pwd"
                  type={showCurrent ? "text" : "password"}
                  disabled={isSubmitting}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    clearFieldError("currentPassword");
                  }}
                  aria-invalid={!!fieldErrors.currentPassword}
                  placeholder="Enter current password"
                  className={`w-full border rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm min-h-[44px] transition-colors disabled:opacity-50 ${
                    fieldErrors.currentPassword
                      ? "border-error-500 bg-error-50/20 focus:border-error-500"
                      : "border-theme-border-input focus:border-theme-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer"
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <span className="text-[11px] text-error-600 font-medium">
                  {fieldErrors.currentPassword}
                </span>
              )}
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-new-pwd"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                New Password <span className="text-error-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="settings-new-pwd"
                  type={showNew ? "text" : "password"}
                  disabled={isSubmitting}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError("newPassword");
                  }}
                  aria-invalid={!!fieldErrors.newPassword}
                  placeholder="Enter new password (min 6 chars)"
                  className={`w-full border rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm min-h-[44px] transition-colors disabled:opacity-50 ${
                    fieldErrors.newPassword
                      ? "border-error-500 bg-error-50/20 focus:border-error-500"
                      : "border-theme-border-input focus:border-theme-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer"
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <span className="text-[11px] text-error-600 font-medium">
                  {fieldErrors.newPassword}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-confirm-pwd"
                className="text-[11px] font-semibold uppercase tracking-wider text-theme-text-muted"
              >
                Confirm Password <span className="text-error-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="settings-confirm-pwd"
                  type={showConfirm ? "text" : "password"}
                  disabled={isSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  placeholder="Re-enter new password"
                  className={`w-full border rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-theme-text-primary bg-theme-surface-warm min-h-[44px] transition-colors disabled:opacity-50 ${
                    fieldErrors.confirmPassword
                      ? "border-error-500 bg-error-50/20 focus:border-error-500"
                      : "border-theme-border-input focus:border-theme-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 cursor-pointer"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="text-[11px] text-error-600 font-medium">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3.5 px-7 rounded-lg transition-colors cursor-pointer min-h-[44px] disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-current" />}
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
