"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, LockKeyhole, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";

import AuthBanner from "@/components/auth/AuthBanner";
import AuthFormLayout from "@/components/auth/AuthFormLayout";
import { FormInput } from "@/components/forms/form-input";
import { FormPasswordInput } from "@/components/forms/FormPasswordInput";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useLogin } from "@/features/auth";

function AdminLoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const loginMutation = useLogin();

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
          const userRole = response.data?.user?.role;
          if (userRole !== "ADMIN" && userRole !== "STAFF") {
            methods.setError("root", {
              type: "manual",
              message: "Access denied. You are not authorized to access the Admin portal.",
            });
            return;
          }

          try {
            await signIn("credentials", {
              email: data.email.trim(),
              password: data.password,
              redirect: false,
            });
          } catch {
            // Cookie auth is primary
          }

          router.push("/admin/dashboard");
          router.refresh();
        },
        onError: (err: any) => {
          methods.setError("root", {
            type: "server",
            message:
              err?.message ||
              "Invalid email or password. Please check your credentials.",
          });
        },
      }
    );
  };

  return (
    <AuthFormLayout
      showLogo
      showFooter
      variant="admin"
      eyebrow={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Admin Portal
        </span>
      }
      icon={
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary-600 to-secondary-800 text-white shadow-md shadow-secondary-900/20 ring-4 ring-secondary-100">
          <ShieldCheck size={28} />
        </div>
      }
      switchLink={
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-secondary-600"
        >
          <ArrowLeft size={14} />
          Back to User Login
        </Link>
      }
      title="Admin Portal"
      subtitle="Administrator Login — enter your credentials to access the dashboard."
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-5 md:space-y-6"
        >
          {/* Server Error */}
          {methods.formState.errors.root?.message && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {methods.formState.errors.root.message}
            </div>
          )}

          <FormInput
            name="email"
            label="Admin Email"
            type="email"
            placeholder="admin@kollimalaiarasan.com"
            autoComplete="email"
            leftIcon={<Mail size={18} />}
            required
          />

          <FormPasswordInput
            name="password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            leftIcon={<LockKeyhole size={18} />}
            required
          />

          <div className="flex items-center justify-end">
            {/* <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label="Remember me"
              className="border-neutral-300"
            /> */}

            <Link
              href="/forgot-password?from=admin"
              className="text-sm font-medium text-secondary-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <FormSubmitButton
            size="xl"
            disabled={loginMutation.isPending}
            className="mt-2 h-11 w-full rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 text-sm font-medium text-white shadow-sm transition-all hover:from-secondary-700 hover:to-secondary-800 hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
          >
            {loginMutation.isPending ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              "Sign In to Admin"
            )}
          </FormSubmitButton>
        </form>
      </FormProvider>
    </AuthFormLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="grid h-screen w-full overflow-hidden bg-background lg:grid-cols-2">
      {/* Left Banner */}
      <div className="hidden h-screen min-h-0 w-full overflow-hidden lg:block">
        <AuthBanner variant="admin" />
      </div>

      {/* Right Form */}
      <main className="h-screen min-h-0 w-full overflow-y-auto bg-background">
        <div className="flex min-h-full w-full items-center justify-center px-6 py-12 sm:px-8 lg:px-16">
          <div className="my-auto w-full max-w-[440px]">
            <Suspense
              fallback={
                <div className="flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}