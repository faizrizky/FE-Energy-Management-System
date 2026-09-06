'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast-store';
import { loginFormSchema, type LoginFormValues } from '@/feat/auth/schema';
import { loginAction } from '@/feat/auth/actions';
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from '@/components/shared/turnstile-widget';
import { LoginHeroBackground, LoginHeroPanel } from './_partials/hero-panel';
import { Field } from './_partials/field';

interface LoginClientProps {
  redirectTo: string;
}

const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function LoginClient({ redirectTo }: LoginClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      const result = await loginAction(values, captchaToken ?? undefined);
      if (!result.success) {
        toast.error(result.message ?? 'Login failed');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    });
  };

  const submitDisabled = isPending || (CAPTCHA_ENABLED && !captchaToken);

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-white">
      <LoginHeroBackground />
      <LoginHeroPanel />

      <section
        className="
          relative z-10 flex min-h-screen w-full flex-1 items-center justify-center
          px-4 py-8
          md:w-1/2 md:bg-white md:px-8 md:py-12
          xl:w-[560px] xl:flex-none xl:px-20 xl:py-20
        "
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full max-w-[380px] flex-col gap-9"
        >
          <div className="flex flex-col items-center gap-3 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 p-2">
              <Zap className="size-5 text-white" strokeWidth={2} />
            </div>
            <p className="font-display text-2xl font-semibold leading-8 text-emerald-500">
              EMS
            </p>
          </div>

          <div className="flex flex-col gap-2 max-md:items-center max-md:text-center">
            <h2 className="font-display text-[32px] font-bold leading-normal text-emerald-500">
              Welcome Back
            </h2>
            <p className="text-sm leading-5 text-slate-600 max-md:max-w-[280px] max-md:text-white">
              Sign in to manage your facility&apos;s energy network.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email / Username" error={errors.username?.message}>
              <div
                className="
                  flex h-11 items-center gap-1 rounded-md border border-slate-400
                  bg-white px-3
                  shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]
                  focus-within:border-emerald-500
                "
              >
                <Mail className="size-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type your email / username here ..."
                  autoComplete="username"
                  aria-invalid={!!errors.username}
                  className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-slate-950 outline-none placeholder:text-slate-400"
                  {...register('username')}
                />
              </div>
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div
                className="
                  flex h-11 items-center gap-1 rounded-md border border-slate-400
                  bg-white px-3
                  shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]
                  focus-within:border-emerald-500
                "
              >
                <Lock className="size-4 shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Type your password here ..."
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-slate-950 outline-none placeholder:text-slate-400"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="flex size-4 shrink-0 items-center justify-center text-slate-950 md:text-slate-400 md:hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>

            {CAPTCHA_ENABLED && (
              <div className="flex w-full justify-center">
                <TurnstileWidget
                  ref={turnstileRef}
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitDisabled}
            className="h-11 w-full rounded-lg bg-emerald-500 text-white hover:bg-emerald-500"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-xs leading-[18px] text-emerald-200 md:hidden">
            EMS Enterprise v0.1
          </p>
        </form>
      </section>
    </main>
  );
}
