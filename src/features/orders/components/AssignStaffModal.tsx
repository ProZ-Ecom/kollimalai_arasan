"use client";

import { useState, useMemo } from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { useStaffList } from "@/features/staff/hooks";
import { useAssignOrderDelivery } from "@/features/orders/hooks";
import {
  Truck,
  Search,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AssignStaffModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber?: string;
  onSuccess?: () => void;
}

export function AssignStaffModal({
  open,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: AssignStaffModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

  const { data: staffData, isLoading: staffLoading, error: staffError } =
    useStaffList({
      isActive: true,
      limit: 100,
    });

  const assignDelivery = useAssignOrderDelivery();

  const staffList = staffData?.data ?? [];

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [staffList, search]);

  const handleClose = () => {
    setSelectedStaffId(null);
    setSearch("");
    setNote("");
    onClose();
  };

  const handleAssign = () => {
    if (!orderId || !selectedStaffId) return;

    assignDelivery.mutate(
      {
        orderId,
        staffId: selectedStaffId,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Assign Delivery Staff"
      description={
        orderNumber
          ? `Select a delivery staff member for order ${orderNumber}`
          : "Select a delivery staff member to fulfill this shipment"
      }
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={handleClose} disabled={assignDelivery.isPending}>
            Cancel
          </Button>
          <Button
            className="bg-secondary-600 hover:bg-secondary-700 text-white"
            onClick={handleAssign}
            disabled={!selectedStaffId || assignDelivery.isPending}
          >
            {assignDelivery.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            Assign Staff
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Staff */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search staff by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-secondary-600 focus:outline-hidden transition-colors"
          />
        </div>

        {/* Staff Selection List */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-2">
            Available Staff ({filteredStaff.length}) <span className="text-red-500">*</span>
          </label>

          {staffLoading ? (
            <div className="flex items-center justify-center py-8 text-neutral-500 text-sm">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading staff members...
            </div>
          ) : staffError ? (
            <div className="flex items-center gap-2 p-3 text-sm text-error-700 bg-error-50 rounded-xl border border-error-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load staff members. Please try again.
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-sm text-neutral-500">
              No active staff members found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredStaff.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                const initial = staff.name.charAt(0).toUpperCase();

                return (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-secondary-600 bg-secondary-50 shadow-xs"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-secondary-600 text-white"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {staff.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {staff.phone || staff.email || "Staff"}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-secondary-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Delivery Note */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
            Delivery Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Special instructions or notes for delivery staff..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-secondary-600 focus:outline-hidden transition-colors resize-none"
          />
        </div>

        {assignDelivery.isError && (
          <div className="p-3 text-sm text-error-700 bg-error-50 rounded-xl border border-error-200">
            {assignDelivery.error?.message ||
              "Failed to assign delivery staff. Please try again."}
          </div>
        )}
      </div>
    </FormModal>
  );
}
