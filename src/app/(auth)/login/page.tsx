"use client";

import AuthFormLayout from "@/components/auth/AuthFormLayout";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useLogin } from "@/features/auth";
import { FormInput } from "@/components/forms/form-input";
import { FormPasswordInput } from "@/components/forms/FormPasswordInput";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Spinner } from "@/components/ui/spinner";
import { LockKeyhole, Mail, AlertCircle, User } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const loginMutation = useLogin();

  const getErrorMessage = (error: string | null) => {
    if (!error) return null;
    if (error === "AccessDenied") return "Your account has been deactivated or blocked.";
    if (error === "OAuthCallbackError" || error === "OAuthSignin")
      return "Failed to authenticate with Google. Please try again.";
    return "Authentication failed. Please try again.";
  };

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(
      {
        email: data.email.trim(),
        password: data.password,
      },
      {
        onSuccess: async (response) => {
          // Sync NextAuth session and redirect
          try {
            await signIn("credentials", {
              email: data.email.trim(),
              password: data.password,
              redirect: false,
            });
          } catch {
            // Cookie auth is primary
          }

          const userRole = response?.data?.user?.role;
          if (userRole === "ADMIN" || userRole === "STAFF") {
            router.push("/admin/dashboard");
          } else {
            router.push(callbackUrl);
          }
          router.refresh();
        },
      }
    );
  };

  return (
    <AuthFormLayout
      showLogo
      showFooter
      variant="card"
      accentGradient="from-secondary-500 via-secondary-400 to-secondary-200"
      eyebrow={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-700">
          User Login
        </span>
      }
      icon={
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary-50 to-secondary-100 text-secondary-600 ring-4 ring-secondary-50/80">
          <User size={28} />
        </div>
      }
      title="Welcome Back"
      subtitle="Sign in to access your account and orders."
      bottomContent={
        <div className="text-sm text-neutral-600">
          New to Kollimalai Arasan?{" "}
          <Link
            href={
              callbackUrl !== "/"
                ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/register"
            }
            className="font-medium text-secondary-600 hover:underline"
          >
            Create an account
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* URL Error (e.g. Google OAuth error) */}
        {authError && (
          <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {getErrorMessage(authError)}
          </div>
        )}

        {/* Google One-Click Login */}
        <GoogleAuthButton callbackUrl={callbackUrl} text="Continue with Google" />

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-neutral-200" />
          <span className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
            Or sign in with email
          </span>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-4 md:space-y-5"
          >
            {/* Server Error */}
            {methods.formState.errors.root?.message && (
              <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {methods.formState.errors.root.message}
              </div>
            )}

            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              leftIcon={<Mail size={18} />}
              required
            />

            <FormPasswordInput
              name="password"
              label="Password"
              placeholder="Enter your password"
              leftIcon={<LockKeyhole size={18} />}
              required
            />

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-secondary-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <FormSubmitButton
              size="xl"
              disabled={loginMutation.isPending}
              className="mt-2 h-12 md:h-14 w-full rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 text-sm font-medium text-white shadow-sm transition-all hover:from-secondary-700 hover:to-secondary-800 hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
            >
              {loginMutation.isPending ? <Spinner size="sm" className="text-white" /> : "Sign In"}
            </FormSubmitButton>
          </form>
        </FormProvider>
      </div>
    </AuthFormLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}