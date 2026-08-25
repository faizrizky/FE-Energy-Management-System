"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { loginFormSchema, type LoginFormValues } from "@/feat/auth/schema";
import { loginAction } from "@/feat/auth/actions";

interface LoginClientProps {
  redirectTo: string;
}

export function LoginClient({ redirectTo }: LoginClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        toast.error(result.message ?? "Login failed");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-screen w-full items-stretch bg-[#f8faf4]">
      {/* Hero_Section — foto asli belum dipasang, lihat catatan di atas */}
      <div className="relative hidden w-[720px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-[#042f2c] to-emerald-900 p-16 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.15),transparent_50%)]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500">
            <Zap className="size-5 text-white" />
          </div>
          <p className="font-display text-2xl font-semibold text-emerald-500">EMS</p>
        </div>

        <div className="relative flex flex-col gap-4">
          <h1 className="font-display text-[40px] font-bold leading-[48px] tracking-[-1px] text-white">
            Smart Energy.
            <br />
            Smarter Savings.
          </h1>
          <p className="text-sm leading-5 text-emerald-200">
            Monitor real-time demand, automate critical schedules, and drive down operational waste
            across your entire facility footprint with intelligent gateway telemetry.
          </p>
        </div>

        <p className="relative text-xs leading-[18px] text-emerald-200">EMS Enterprise v0.1</p>
      </div>

      {/* Form_Section */}
      <div className="flex min-h-screen w-full flex-1 items-center justify-center border-l border-slate-200 bg-white p-8 lg:w-[560px] lg:flex-none lg:p-20">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[380px] flex-col gap-9">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[32px] font-bold text-emerald-500">Welcome Back</h2>
            <p className="text-sm text-slate-600">Sign in to manage your facility&apos;s energy network.</p>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email" error={errors.email?.message}>
              <div className="flex h-11 items-center gap-1 rounded-md border border-slate-400 bg-white px-3 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]">
                <Mail className="size-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type your email here ..."
                  autoComplete="username"
                  aria-invalid={!!errors.email}
                  className="flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  {...register("email")}
                />
              </div>
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div className="flex h-11 items-center gap-1 rounded-md border border-slate-400 bg-white px-3 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]">
                <Lock className="size-4 shrink-0 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Type your password here ..."
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm font-medium text-slate-950">
        {label}
        <span className="text-status-error">*</span>
      </div>
      {children}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}