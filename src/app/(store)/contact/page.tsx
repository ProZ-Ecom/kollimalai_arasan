"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Tag,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/Toast";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import { useCustomerProfile } from "@/features/customers/hooks/use-customer-profile";
import { useSubmitContact } from "@/features/contact/hooks/use-submit-contact";
import {
  createContactSchema,
  type CreateContactInput,
} from "@/features/contact/validations/contact.schema";

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Order & Tracking",
  "Bulk / Wholesale Order",
  "Product Quality & Feedback",
  "Return / Refund Request",
  "Other Inquiry",
];

export default function ContactPage() {
  const { data: session } = useSession();
  const { data: profile } = useCustomerProfile();
  const { data: company } = useCustomerCompany();
  const submitContact = useSubmitContact();

  const [formData, setFormData] = React.useState<CreateContactInput>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof CreateContactInput, string>>
  >({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Auto-fill from authenticated user session/profile
  React.useEffect(() => {
    if (session?.user || profile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile?.name || session?.user?.name || "",
        email: prev.email || profile?.email || session?.user?.email || "",
        phone: prev.phone || profile?.phone || "",
      }));
    }
  }, [session, profile]);

  // Company Contact Details
  const companyPhone = company?.phone?.trim() || "+91 7418188950";
  const whatsappPhone = "+91 73388 80950";
  const companyEmail = company?.email?.trim() || "kollimalaiarasan@gmail.com";
  const companyAddress =
    company?.address?.trim() ||
    "18/41, MGR Nagar, Sakkarai Patti, Valavanthi Nadu, Semmedu Post, Kolli Hills Tk, Namakkal District - 637411, Tamil Nadu, India";

  const handleInputChange = (
    field: keyof CreateContactInput,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validate with Zod schema
    const validation = createContactSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Partial<Record<keyof CreateContactInput, string>> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof CreateContactInput;
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await submitContact.mutateAsync(validation.data);
      setIsSuccess(true);
      toast.success(
        "Inquiry Received",
        "Thank you! Your message has been sent to our team."
      );
      // Reset form fields while preserving logged-in user profile info
      setFormData({
        name: profile?.name || session?.user?.name || "",
        email: profile?.email || session?.user?.email || "",
        phone: profile?.phone || "",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      const msg =
        err?.message || "Failed to submit your message. Please try again.";
      setGeneralError(msg);
      toast.error("Submission Failed", msg);
    }
  };

  return (
    <div className="w-full bg-neutral-50/50 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-800 text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
            WE ARE HERE TO HELP
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Get in Touch With Us
          </h1>
          <p className="mt-4 text-neutral-600 text-base sm:text-lg leading-relaxed font-light">
            Have questions about our single-origin organic spices, farm produce, or need assistance with your orders? Our team in Kolli Hills is happy to assist.
          </p>
        </div>

        {/* 2-Column Grid: Left Contact Info / Right Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Contact Details & Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Cards Container */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                Contact Information
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed font-light">
                Reach out to us directly through any of our channels below. Our support team typically responds within 2–4 hours.
              </p>

              <div className="space-y-4 pt-2">
                {/* Phone */}
                <a
                  href={`tel:${companyPhone.replace(/\s+/g, "")}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 hover:border-secondary-500/50 hover:bg-secondary-50/20 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary-500/10 text-secondary-600 flex items-center justify-center shrink-0 group-hover:bg-secondary-500 group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Call Support
                    </span>
                    <span className="block text-base font-bold text-neutral-900 mt-0.5 group-hover:text-secondary-600 transition-colors">
                      {companyPhone}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      Mon – Sat: 9:00 AM – 6:00 PM IST
                    </span>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      WhatsApp Chat
                    </span>
                    <span className="block text-base font-bold text-neutral-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
                      {whatsappPhone}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      Fastest response for order inquiries
                    </span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${companyEmail}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 hover:border-primary-500/50 hover:bg-primary-50/20 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 text-primary-700 flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Email Inquiries
                    </span>
                    <span className="block text-base font-bold text-neutral-900 mt-0.5 truncate group-hover:text-primary-700 transition-colors">
                      {companyEmail}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      For bulk orders &amp; support
                    </span>
                  </div>
                </a>

                {/* Location */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60">
                  <div className="w-11 h-11 rounded-xl bg-neutral-200/60 text-neutral-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Estate &amp; Packing Unit
                    </span>
                    <span className="block text-sm font-medium text-neutral-800 mt-1 leading-relaxed">
                      {companyAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm & Quality Assurance Card */}
            <div className="rounded-3xl border border-secondary-200 bg-linear-to-br from-secondary-50/40 via-white to-neutral-50 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-6 h-6 text-secondary-600" />
                <h3 className="font-bold text-neutral-900 text-base sm:text-lg">
                  100% Organic Farm Guarantee
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-light">
                Direct single-origin produce from our estate in Kolli Hills, Tamil Nadu. Cultivated sustainably with natural mountain water and zero chemical pesticides.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Inquiries Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-xs relative">
              {/* Form Title */}
              <div className="border-b border-neutral-100 pb-5 mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  Send Us a Message
                </h2>
                <p className="text-neutral-500 text-sm mt-1">
                  Fill in your details below and your inquiry will be routed directly to our customer team.
                </p>
              </div>

              {/* Success Notification Banner */}
              {isSuccess && (
                <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-emerald-900">
                      Message Received!
                    </h3>
                    <p className="text-sm text-emerald-800 mt-1 leading-relaxed font-light">
                      Thank you for contacting Kollimalai Arasan. Your query has been logged into our system. Our team will review your message and reply via email or phone shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSuccess(false)}
                      className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              )}

              {/* General Error Banner */}
              {generalError && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-800 leading-relaxed">
                    {generalError}
                  </p>
                </div>
              )}

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                    >
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="e.g. Anand Kumar"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-colors bg-white focus:outline-hidden focus:ring-2 ${
                          fieldErrors.name
                            ? "border-rose-400 focus:ring-rose-200"
                            : "border-neutral-200 focus:border-secondary-500 focus:ring-secondary-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                    >
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-phone"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-colors bg-white focus:outline-hidden focus:ring-2 ${
                          fieldErrors.phone
                            ? "border-rose-400 focus:ring-rose-200"
                            : "border-neutral-200 focus:border-secondary-500 focus:ring-secondary-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                    >
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-colors bg-white focus:outline-hidden focus:ring-2 ${
                          fieldErrors.email
                            ? "border-rose-400 focus:ring-rose-200"
                            : "border-neutral-200 focus:border-secondary-500 focus:ring-secondary-100"
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                    >
                      Subject / Topic <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      id="contact-subject"
                      options={SUBJECT_OPTIONS.map((subj) => ({
                        value: subj,
                        label: subj,
                      }))}
                      placeholder="Select an inquiry topic..."
                      value={formData.subject}
                      onValueChange={(val) => handleInputChange("subject", val)}
                      leftIcon={<Tag className="w-4 h-4 text-neutral-400" />}
                      error={fieldErrors.subject}
                      className="rounded-xl border-neutral-200 py-3 text-sm font-medium"
                    />
                    {fieldErrors.subject && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">
                        {fieldErrors.subject}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                  >
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Please describe your question or requirement in detail..."
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-colors bg-white focus:outline-hidden focus:ring-2 resize-y ${
                      fieldErrors.message
                        ? "border-rose-400 focus:ring-rose-200"
                        : "border-neutral-200 focus:border-secondary-500 focus:ring-secondary-100"
                    }`}
                  />
                  {fieldErrors.message && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Privacy note & Submit button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-neutral-500 font-light text-center sm:text-left">
                    We respect your privacy. Inquiries are stored securely.
                  </p>

                  <Button
                    type="submit"
                    disabled={submitContact.isPending}
                    size="lg"
                    className="w-full sm:w-auto px-8 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {submitContact.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Message...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
