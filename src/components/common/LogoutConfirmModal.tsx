"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { logoutApi } from "@/features/auth/api/auth.api";

export interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
  isAdmin?: boolean;
  title?: string;
  description?: string;
  callbackUrl?: string;
}

export function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  isAdmin = false,
  title,
  description,
  callbackUrl,
}: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Standard full logout: clear backend JWT cookies and NextAuth session
        try {
          await logoutApi();
        } catch {
          // ignore network failures during logout
        }
        const destination = isAdmin
          ? "/admin/login"
          : (callbackUrl || "/login");
        await signOut({ callbackUrl: destination });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={() => !isLoading && onClose()}>
      <div className="flex flex-col items-center text-center pt-2 pb-1">
        {/* Brand green badge icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50 text-secondary-600 ring-8 ring-secondary-50/70 border border-secondary-200/50 shadow-xs">
          <LogOut className="h-6 w-6 stroke-[2.2] translate-x-0.5" />
        </div>

        {/* Modal Heading */}
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
          {title || (isAdmin ? "Log Out of Admin Dashboard?" : "Log Out of Your Account?")}
        </h3>

        {/* Modal Context Description */}
        <p className="mt-2 text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">
          {description ||
            (isAdmin
              ? "You will need to sign in again to access the store management dashboard, orders, and settings."
              : "Are you sure you want to log out? Your shopping bag and saved preferences will remain safe for when you return.")}
        </p>

        {/* Responsive Action Buttons (Stacked on mobile, side-by-side on sm+) */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:flex-1 rounded-xl h-11 border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full sm:flex-1 rounded-xl h-11 bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging Out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Yes, Log Out
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

