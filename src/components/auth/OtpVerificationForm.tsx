"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface OtpVerificationFormProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  error?: string;
  infoMessage?: string;
}

export default function OtpVerificationForm({
  email,
  onVerify,
  onResend,
  isVerifying = false,
  isResending = false,
  error = "",
  infoMessage = "",
}: OtpVerificationFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(59);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isLoading = isVerifying || isResending;
  const otpValue = otp.join("");

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = ["", "", "", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = () => {
    if (otpValue.length !== 6 || isLoading) return;

    onVerify(otpValue);
  };

  const handleResend = () => {
    if (timeLeft !== 0 || isLoading) return;

    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(59);

    onResend();

    window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <p className="text-center text-[15px] leading-7 text-neutral-600 sm:text-base">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-neutral-900">
          {email || "your email"}
        </span>
      </p>

      {/* Info Message */}
      {infoMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {infoMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-error-600">
          {error}
        </p>
      )}

      {/* OTP Inputs */}
      <div>
        <div className="grid grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              onChange={(event) =>
                handleChange(event.target.value, index)
              }
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={isLoading}
              className="
                aspect-square
                w-full
                rounded-xl
                border
                border-neutral-200
                bg-white
                text-center
                text-base
                font-semibold
                text-neutral-900
                outline-none
                transition-all
                focus:border-secondary-600
                focus:ring-2
                focus:ring-secondary-600/20
                disabled:bg-neutral-100
                sm:text-lg
                md:text-xl
              "
            />
          ))}
        </div>
      </div>

      {/* Timer / Resend */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">
          Resend in{" "}
          <span className="font-medium text-neutral-900">
            00:{timeLeft.toString().padStart(2, "0")}
          </span>
        </span>

        <button
          type="button"
          onClick={handleResend}
          disabled={timeLeft !== 0 || isLoading}
          className={`font-medium transition-colors ${
            timeLeft === 0
              ? "cursor-pointer text-secondary-600 hover:underline"
              : "cursor-not-allowed text-neutral-400"
          }`}
        >
          {isResending ? "Sending..." : "Resend OTP"}
        </button>
      </div>

      {/* Verify Button */}
      <Button
        type="button"
        onClick={handleVerify}
        disabled={isLoading || otpValue.length !== 6}
        className="h-14 w-full cursor-pointer rounded-xl bg-secondary-600 text-white hover:bg-secondary-700 disabled:opacity-50"
      >
        {isVerifying ? (
          <Spinner size="sm" className="text-white" />
        ) : (
          <>
            Verify
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}