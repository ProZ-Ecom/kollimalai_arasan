"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ForgotPasswordVerifyOtpPage from "../forgot-password/verify-otp/page";

function VerifyOtpDispatcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromType = searchParams.get("from");
  const isRegistration = fromType === "register";

  useEffect(() => {
    if (isRegistration) {
      router.replace("/register/verify-otp");
    }
  }, [isRegistration, router]);

  if (isRegistration) {
    return null;
  }

  return <ForgotPasswordVerifyOtpPage />;
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpDispatcher />
    </Suspense>
  );
}