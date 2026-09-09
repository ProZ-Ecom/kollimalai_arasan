"use client";

import * as React from "react";
import { Send, Mail, User, Sparkles } from "lucide-react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { useReplyContactMessage } from "../hooks";
import type { AdminContactMessageListItem } from "../types";

interface AdminContactReplyModalProps {
  contact: AdminContactMessageListItem | null;
  open: boolean;
  onClose: () => void;
}

export function AdminContactReplyModal({
  contact,
  open,
  onClose,
}: AdminContactReplyModalProps) {
  const [replyMessage, setReplyMessage] = React.useState("");

  const { mutate: sendReply, isPending } = useReplyContactMessage();

  React.useEffect(() => {
    if (open) {
      setReplyMessage("");
    }
  }, [open]);

  if (!contact) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.id || !replyMessage.trim()) return;

    sendReply(
      {
        uuid: contact.id,
        message: replyMessage.trim(),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Reply to Customer Message"
      description={`Send an official response email to ${contact.name}`}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || !replyMessage.trim()}
            onClick={handleSubmit}
            className="bg-secondary-600 hover:bg-secondary-700 text-white gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Sending Email..." : "Send Reply"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient & Subject Header */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">To:</span>
            <span className="font-semibold text-neutral-900">
              {contact.name} &lt;{contact.email}&gt;
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 font-medium">Subject:</span>
            <span className="font-medium text-neutral-800 truncate max-w-[280px]">
              Re: {contact.subject || "Customer Inquiry"}
            </span>
          </div>
        </div>

        {/* Original Message Quote */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-neutral-400">
            Original Customer Message
          </label>
          <div className="p-3 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs text-neutral-600 max-h-28 overflow-y-auto leading-relaxed">
            {contact.message}
          </div>
        </div>

        {/* Reply Composer Textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-neutral-700">
            Your Response Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={6}
            required
            placeholder="Type your official reply here... This message will be sent as an HTML email to the customer."
            className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-secondary-600 focus:ring-2 focus:ring-secondary-600/20"
          />
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
            <span>Customer will be notified by email</span>
            <span>{replyMessage.length} characters</span>
          </div>
        </div>
      </form>
    </FormModal>
  );
}
