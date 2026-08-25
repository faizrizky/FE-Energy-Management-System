import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginClient } from "./client";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  const redirectTo = params.redirectTo?.startsWith("/") ? params.redirectTo : "/dashboard";

  if (session) redirect(redirectTo);

  return <LoginClient redirectTo={redirectTo} />;
}