"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Minus,
  Plus,
  Smartphone,
  Building2,
  ShieldCheck,
  Package,
  AlertCircle,
  ArrowRight,
  Upload,
  Video,
  Trash2,
  RefreshCw,
  Play,
  FileVideo,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/common/ProductImage";
import { toast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import type { OrderDetailResponse, OrderItemResponse } from "@/features/orders/types";
import { useRequestCustomerReturn } from "@/features/customers/hooks/use-customer-orders";
import type { RefundDetailsInput } from "@/features/returns/validations/return.schema";

export const RETURN_REASON_OPTIONS = [
  "Damaged product on delivery",
  "Quality or freshness issue",
  "Wrong item received",
  "Package broken or seal tampered",
  "Other",
] as const;

export const MAX_VIDEO_SIZE_MB = 30;
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

type Step = "items" | "reason" | "video" | "refund" | "review" | "done";

interface SelectedItemState {
  quantity: number;
}

export interface CustomerReturnRequestModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderDetailResponse | null;
  onSuccess?: () => void;
}

export function CustomerReturnRequestModal({
  open,
  onClose,
  order,
  onSuccess,
}: CustomerReturnRequestModalProps) {
  const [step, setStep] = useState<Step>("items");

  // Step 1: Item Selections { [orderItemId]: { quantity: number } }
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});

  // Step 2: Reason & Description
  const [reason, setReason] = useState<string>(RETURN_REASON_OPTIONS[0]);
  const [description, setDescription] = useState<string>("");

  // Step 3: Mandatory Video Evidence
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFileName, setVideoFileName] = useState<string>("");
  const [videoFileSize, setVideoFileSize] = useState<number>(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Refund Details
  const isCodOrder = useMemo(() => {
    if (!order) return false;
    return Boolean(
      order.isCod ||
      order.paymentMethod?.toUpperCase() === "COD" ||
      order.paymentStatus === "pending"
    );
  }, [order]);

  const [refundMethod, setRefundMethod] = useState<"upi" | "bank_transfer">("upi");
  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [stepErrors, setStepErrors] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const returnMutation = useRequestCustomerReturn();

  // Reset state whenever modal opens for an order
  React.useEffect(() => {
    if (open && order) {
      setStep("items");
      setSelectedItems({});
      setReason(RETURN_REASON_OPTIONS[0]);
      setDescription("");
      setVideoUrl("");
      setVideoFileName("");
      setVideoFileSize(0);
      setIsUploadingVideo(false);
      setUploadProgress(0);
      setVideoError(null);
      setRefundMethod("upi");
      setUpiId("");
      setAccountHolderName(order.customer?.name || "");
      setBankName("");
      setAccountNumber("");
      setConfirmAccountNumber("");
      setIfscCode("");
      setStepErrors(null);
      setServerError(null);
    }
  }, [open, order]);

  const items = useMemo<OrderItemResponse[]>(() => order?.items ?? [], [order]);

  const chosenItems = useMemo(() => {
    return items.filter((item) => Boolean(selectedItems[item.id]));
  }, [items, selectedItems]);

  const refundTotal = useMemo(() => {
    return chosenItems.reduce((acc, item) => {
      const q = selectedItems[item.id]?.quantity ?? 1;
      return acc + (item.unitPrice || 0) * q;
    }, 0);
  }, [chosenItems, selectedItems]);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = { quantity: maxQty };
      }
      return next;
    });
    setStepErrors(null);
  };

  const updateQuantity = (itemId: string, maxQty: number, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = Math.max(1, Math.min(maxQty, current.quantity + delta));
      return {
        ...prev,
        [itemId]: { quantity: newQty },
      };
    });
  };

  const selectAll = () => {
    const all: Record<string, SelectedItemState> = {};
    items.forEach((item) => {
      all[item.id] = { quantity: item.quantity };
    });
    setSelectedItems(all);
    setStepErrors(null);
  };

  const clearAll = () => {
    setSelectedItems({});
  };

  // Video Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(null);
    setStepErrors(null);

    // Validate type
    const mime = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isAllowedMime = ALLOWED_VIDEO_TYPES.includes(mime);
    const isAllowedExt = ["mp4", "mov", "webm"].includes(ext || "");

    if (!isAllowedMime && !isAllowedExt) {
      setVideoError(
        "Unsupported video format. Please upload an MP4, MOV, or WebM video file."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size
    const maxSizeBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setVideoError(
        `Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_VIDEO_SIZE_MB}MB limit. Please compress or select a shorter clip.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size === 0) {
      setVideoError("The selected video file is empty.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Perform upload
    setIsUploadingVideo(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "returns");

    try {
      // Use XMLHttpRequest for live progress feedback
      const uploadedPath = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/customer/upload");
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(95, Math.round((event.loaded / event.total) * 100));
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.data?.path) {
                setUploadProgress(100);
                resolve(res.data.path);
              } else {
                reject(new Error(res.message || "Failed to process video upload"));
              }
            } catch {
              reject(new Error("Invalid response from upload server"));
            }
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error(res.message || res.error?.message || "Upload failed"));
            } catch {
              reject(new Error(`Upload failed with status code ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network connection error during video upload"));
        };

        xhr.send(formData);
      });

      setVideoUrl(uploadedPath);
      setVideoFileName(file.name);
      setVideoFileSize(file.size);
      setVideoError(null);
      toast.success("Video Uploaded", "Product condition video uploaded successfully.");
    } catch (err: any) {
      console.error("Condition video upload error:", err);
      setVideoError(err.message || "Failed to upload video. Please try again.");
      setVideoUrl("");
      setVideoFileName("");
      setVideoFileSize(0);
    } finally {
      setIsUploadingVideo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideoUrl("");
    setVideoFileName("");
    setVideoFileSize(0);
    setVideoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step Validations
  const validateCurrentStep = (): string | null => {
    if (step === "items") {
      if (chosenItems.length === 0) {
        return "Please select at least one item to return.";
      }
    }

    if (step === "reason") {
      if (!reason) {
        return "Please select a reason for return.";
      }
      if (reason === "Other" && (!description || description.trim().length < 5)) {
        return "Please provide an explanation (at least 5 characters) for selecting 'Other'.";
      }
    }

    if (step === "video") {
      if (isUploadingVideo) {
        return "Please wait for your product condition video to finish uploading.";
      }
      if (!videoUrl || !videoUrl.trim()) {
        return "A product condition video is mandatory before submitting your return request.";
      }
    }

    if (step === "refund") {
      if (refundMethod === "upi") {
        const trimmed = upiId.trim();
        if (!trimmed) {
          return "Please enter your UPI ID.";
        }
        if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
          return "Please enter a valid UPI ID (e.g. mobile@paytm or name@okaxis).";
        }
      } else {
        if (!accountHolderName.trim() || accountHolderName.trim().length < 2) {
          return "Please enter the account holder's name (min 2 characters).";
        }
        if (!accountNumber.trim() || !/^\d{9,18}$/.test(accountNumber.trim())) {
          return "Bank account number must be between 9 and 18 digits.";
        }
        if (accountNumber.trim() !== confirmAccountNumber.trim()) {
          return "Bank account numbers do not match.";
        }
        if (!ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim())) {
          return "Please enter a valid 11-digit IFSC code (e.g. SBIN0001234).";
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    const error = validateCurrentStep();
    if (error) {
      setStepErrors(error);
      return;
    }
    setStepErrors(null);

    if (step === "items") setStep("reason");
    else if (step === "reason") setStep("video");
    else if (step === "video") setStep("refund");
    else if (step === "refund") setStep("review");
  };

  const handleBack = () => {
    setStepErrors(null);
    if (step === "reason") setStep("items");
    else if (step === "video") setStep("reason");
    else if (step === "refund") setStep("video");
    else if (step === "review") setStep("refund");
  };

  const handleSubmit = async () => {
    if (!order) return;
    setServerError(null);

    if (!videoUrl) {
      setStepErrors("A product condition video is required before submission.");
      setStep("video");
      return;
    }

    const refundDetails: RefundDetailsInput =
      refundMethod === "upi"
        ? {
            method: "upi",
            upiId: upiId.trim(),
          }
        : {
            method: "bank_transfer",
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim() || undefined,
            accountNumber: accountNumber.trim(),
            confirmAccountNumber: confirmAccountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
          };

    const itemsPayload = chosenItems.map((item) => ({
      orderItemId: item.id,
      quantity: selectedItems[item.id].quantity,
      reason,
    }));

    try {
      await returnMutation.mutateAsync({
        uuid: order.id,
        payload: {
          reason,
          description: description.trim() || undefined,
          videoUrl,
          items: itemsPayload,
          refundDetails,
        },
      });

      toast.success(
        "Return Request Placed",
        "Your return request and product condition video have been submitted successfully."
      );
      setStep("done");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || "Failed to submit return request. Please try again.";
      setServerError(msg);
      toast.error("Submission Failed", msg);
    }
  };

  if (!order) return null;

  const STEPS: { id: Step; label: string }[] = [
    { id: "items", label: "Select Items" },
    { id: "reason", label: "Reason" },
    { id: "video", label: "Condition Video *" },
    { id: "refund", label: "Refund Details" },
    { id: "review", label: "Review & Submit" },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Modal
      open={open}
      onClose={returnMutation.isPending || isUploadingVideo ? () => {} : onClose}
      className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
    >
      {/* Modal Header */}
      <div className="bg-neutral-900 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/90 uppercase tracking-wider mb-1">
              Order #{order.orderNumber}
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Request Product Return
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400">Doorstep Pickup</span>
            <p className="text-xs font-semibold text-emerald-400">7 Business Days Return Window</p>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        {step !== "done" && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-[11px] font-medium text-neutral-300 mb-1.5">
              <span>
                Step {currentStepIndex + 1} of {STEPS.length}:{" "}
                <strong className="text-white">{STEPS[currentStepIndex]?.label}</strong>
              </span>
              <span>
                {Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal Content */}
      <div className="p-6 max-h-[75vh] overflow-y-auto">
        {/* STEP 1: WHICH ITEMS */}
        {step === "items" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Select the item(s) you wish to return:
              </p>
              <div className="flex items-center gap-2 text-xs">
                {chosenItems.length === items.length ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer"
                  >
                    Deselect All
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Select All ({items.length})
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const isSelected = Boolean(selectedItems[item.id]);
                const currentQty = selectedItems[item.id]?.quantity ?? item.quantity;
                const itemRefund = (item.unitPrice || 0) * currentQty;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.quantity)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                          aria-label={`Select ${item.productName}`}
                        />
                      </div>

                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                        <ProductImage
                          src={item.primaryImage}
                          alt={item.productName}
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                          {item.productName}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {item.variantName || item.sku || "Standard"} · Unit: {formatPrice(item.unitPrice)}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Ordered: {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900">
                          {formatPrice(itemRefund)}
                        </span>
                        <p className="text-[10px] text-neutral-400">Refund</p>
                      </div>
                    </div>

                    {isSelected && item.quantity > 1 && (
                      <div
                        className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium text-emerald-900">
                          Return Quantity:
                        </span>
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-300 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity, -1)}
                            disabled={currentQty <= 1}
                            className="p-1 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-neutral-900">
                            {currentQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity, 1)}
                            disabled={currentQty >= item.quantity}
                            className="p-1 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-700">
                  {chosenItems.length} {chosenItems.length === 1 ? "item" : "items"} selected for return
                </p>
                <p className="text-[11px] text-neutral-500">
                  Calculated based on ordered unit prices
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-neutral-900">
                  {formatPrice(refundTotal)}
                </span>
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                  Est. Refund Total
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REASON & DESCRIPTION */}
        {step === "reason" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Why are you returning these items? <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {RETURN_REASON_OPTIONS.map((r) => {
                  const isChecked = reason === r;
                  return (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="return-reason"
                        value={r}
                        checked={isChecked}
                        onChange={() => {
                          setReason(r);
                          setStepErrors(null);
                        }}
                        className="h-4 w-4 accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                        {r}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                {reason === "Other" ? (
                  <span>
                    Please describe the issue <span className="text-red-500">*</span>
                  </span>
                ) : (
                  <span>Additional details or comments (Optional)</span>
                )}
              </label>
              <Textarea
                rows={3}
                value={description}
                maxLength={1000}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setStepErrors(null);
                }}
                placeholder={
                  reason === "Other"
                    ? "Please provide details on why you are requesting a return..."
                    : "Describe product condition, package issues, or any relevant details..."
                }
                className="text-xs sm:text-sm"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Max 1,000 characters. Our team will review this together with your video evidence.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: MANDATORY VIDEO EVIDENCE */}
        {step === "video" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0 mt-0.5">
                  <Video className="h-5 w-5" />
                </div>
                <div className="text-xs text-amber-900">
                  <p className="font-bold uppercase tracking-wider">
                    Mandatory Product Condition Video
                  </p>
                  <p className="mt-1 leading-relaxed">
                    To safeguard both you and our quality team, a clear video showing the parcel, packaging seal, and actual physical condition of the product is <strong>required</strong> before submitting this return.
                  </p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Supported formats: <strong>MP4, MOV, WebM</strong> · Maximum file size: <strong>{MAX_VIDEO_SIZE_MB}MB</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!videoUrl && !isUploadingVideo && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    Click to select and upload video
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Record a brief 10–30 second clip of the product condition from your smartphone or computer.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Select Video File
                </Button>
              </div>
            )}

            {/* Uploading progress bar */}
            {isUploadingVideo && (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center space-y-3">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Uploading Condition Video... {uploadProgress}%
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Please keep this window open while the video uploads.
                  </p>
                </div>
                <div className="h-2 w-full max-w-md mx-auto bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Uploaded Video Preview */}
            {videoUrl && !isUploadingVideo && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-neutral-900 truncate max-w-[280px] sm:max-w-sm">
                      {videoFileName || "Condition Video"}
                    </span>
                    {videoFileSize > 0 && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({(videoFileSize / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg h-7 text-[11px] px-2.5"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVideo}
                      className="rounded-lg h-7 text-[11px] px-2 text-red-600 hover:bg-red-50"
                      aria-label="Remove video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* HTML5 Video player preview */}
                <div className="overflow-hidden rounded-xl bg-black border border-neutral-200">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    src={videoUrl}
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-[11px] text-neutral-500 text-center">
                  Preview your video above to ensure all item conditions and labels are clearly visible.
                </p>
              </div>
            )}

            {videoError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{videoError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: REFUND DETAILS */}
        {step === "refund" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider text-emerald-900">
                    Refund Payout Destination
                  </p>
                  <p className="mt-1 text-emerald-800 leading-relaxed">
                    Estimated refund of{" "}
                    <strong className="font-extrabold text-neutral-900">
                      {formatPrice(refundTotal)}
                    </strong>{" "}
                    will be transferred directly to your preferred account below{" "}
                    after your parcel is collected and physically inspected by our team.
                  </p>
                </div>
              </div>
            </div>

            {/* Payout Destination Form */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Select Refund Destination <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRefundMethod("upi");
                        setStepErrors(null);
                      }}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        refundMethod === "upi"
                          ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-600"
                          : "border-neutral-200 bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between mb-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                          <Smartphone className="h-4 w-4" />
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Fastest
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-neutral-900">Instant UPI Transfer</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">GPay, PhonePe, Paytm, BHIM</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRefundMethod("bank_transfer");
                        setStepErrors(null);
                      }}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        refundMethod === "bank_transfer"
                          ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-600"
                          : "border-neutral-200 bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between mb-1.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                          Direct IMPS/NEFT
                        </span>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-neutral-900">Bank Account</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Savings or Current Account</p>
                    </button>
                  </div>
                </div>

                {refundMethod === "upi" ? (
                  <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      UPI ID / VPA <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setStepErrors(null);
                      }}
                      placeholder="e.g. mobile@paytm or yourname@okaxis"
                      className="font-mono text-xs sm:text-sm bg-white"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Ensure the UPI address is active and linked to your bank account.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={accountHolderName}
                          onChange={(e) => {
                            setAccountHolderName(e.target.value);
                            setStepErrors(null);
                          }}
                          placeholder="As printed in bank passbook"
                          className="bg-white text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Bank Name (Optional)
                        </label>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. SBI, HDFC Bank, ICICI"
                          className="bg-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Bank Account Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="password"
                          value={accountNumber}
                          onChange={(e) => {
                            setAccountNumber(e.target.value.replace(/\D/g, ""));
                            setStepErrors(null);
                          }}
                          maxLength={18}
                          placeholder="9 to 18 digits"
                          className="font-mono tracking-wider bg-white text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Confirm Account Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={confirmAccountNumber}
                          onChange={(e) => {
                            setConfirmAccountNumber(e.target.value.replace(/\D/g, ""));
                            setStepErrors(null);
                          }}
                          maxLength={18}
                          placeholder="Re-enter bank account number"
                          className="font-mono tracking-wider bg-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                        IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={ifscCode}
                        onChange={(e) => {
                          setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                          setStepErrors(null);
                        }}
                        maxLength={11}
                        placeholder="e.g. SBIN0001234 or HDFC0000456"
                        className="font-mono uppercase tracking-wider bg-white text-xs sm:text-sm w-full sm:w-1/2"
                      />
                      <p className="text-[11px] text-neutral-500">
                        11-character code printed on your cheque leaf or bank passbook.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Returning Items ({chosenItems.length})
              </p>
              <div className="divide-y divide-neutral-200">
                {chosenItems.map((item) => {
                  const qty = selectedItems[item.id].quantity;
                  const itemRefund = (item.unitPrice || 0) * qty;

                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-neutral-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {qty} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-neutral-900 shrink-0">
                        {formatPrice(itemRefund)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-300 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase">
                  Total Estimated Refund:
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  {formatPrice(refundTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Reason Summary */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
                <p className="font-bold text-neutral-700 uppercase tracking-wider text-[11px]">
                  Reason for Return
                </p>
                <p className="font-semibold text-neutral-900">{reason}</p>
                {description.trim() && (
                  <p className="text-neutral-600 text-[11px] italic mt-1">
                    &quot;{description.trim()}&quot;
                  </p>
                )}
              </div>

              {/* Video Evidence Summary */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1">
                <p className="font-bold text-neutral-700 uppercase tracking-wider text-[11px]">
                  Condition Video Evidence
                </p>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Video Attached</span>
                </div>
                {videoFileName && (
                  <p className="text-[11px] text-neutral-500 truncate">{videoFileName}</p>
                )}
              </div>

              {/* Refund Method Summary */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1 sm:col-span-2">
                <p className="font-bold text-neutral-700 uppercase tracking-wider text-[11px]">
                  Refund Destination
                </p>
                {refundMethod === "upi" ? (
                  <div>
                    <p className="font-semibold text-neutral-900">Instant UPI Transfer</p>
                    <p className="font-mono text-emerald-800 text-[11px] font-bold">{upiId}</p>
                  </div>
                ) : (
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-semibold text-neutral-900">Bank Transfer (IMPS/NEFT)</p>
                    <p className="text-neutral-700">A/C Holder: {accountHolderName}</p>
                    {bankName && <p className="text-neutral-700">Bank: {bankName}</p>}
                    <p className="text-neutral-900 font-mono font-bold">
                      A/C No: {accountNumber}
                    </p>
                    <p className="text-neutral-700 font-mono uppercase font-semibold">IFSC: {ifscCode}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 leading-relaxed">
              📦 <strong>Doorstep Courier Pickup:</strong> Once submitted, our team will review the request and video.
              Upon approval, a reverse courier pickup will be assigned to collect the parcel from your address.
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{serverError}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: DONE */}
        {step === "done" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Return Request Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mt-1">
                Your request and product condition video for order <strong className="font-mono">#{order.orderNumber}</strong> have been received.
                Our team will verify the details and schedule a doorstep reverse pickup.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Items to return:</span>
                <span className="font-bold text-neutral-900">{chosenItems.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Refund Amount:</span>
                <span className="font-extrabold text-emerald-700">{formatPrice(refundTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Refund Destination:</span>
                <span className="font-semibold text-neutral-900">
                  {isCodOrder
                    ? refundMethod === "upi"
                      ? `UPI (${upiId})`
                      : `Bank (A/C ••••${accountNumber.slice(-4)})`
                    : `Original Payment Source (${order.paymentMethod || "Online"})`}
                </span>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-6 py-2"
            >
              Done
            </Button>
          </div>
        )}

        {/* Validation Errors Alert */}
        {stepErrors && step !== "done" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{stepErrors}</span>
          </div>
        )}
      </div>

      {/* Modal Footer Controls */}
      {step !== "done" && (
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={step === "items" ? onClose : handleBack}
            disabled={returnMutation.isPending || isUploadingVideo}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            {step === "items" ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back
              </>
            )}
          </Button>

          {step === "review" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={returnMutation.isPending || isUploadingVideo || !videoUrl}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 cursor-pointer disabled:opacity-50"
            >
              {returnMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm & Submit Return"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              disabled={
                (step === "items" && chosenItems.length === 0) ||
                (step === "video" && (isUploadingVideo || !videoUrl))
              }
              className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 cursor-pointer disabled:opacity-40"
            >
              Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
