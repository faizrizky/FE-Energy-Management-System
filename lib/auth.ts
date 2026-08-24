import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "PJ Gedung" | "Komandan";
}

/**
 * Reads the current session on the server. Swap this out once real
 * JWT verification / NextAuth is wired up — call sites don't change.
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("ems_token")?.value;
  if (!token) return null;

  // TODO: verify JWT + decode claims once auth endpoint is finalized.
  return {
    id: "me",
    name: "Administrator",
    email: "administrator@gmail.com",
    role: "Administrator",
  };
}
