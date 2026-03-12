import { buildCookieHeader } from "@/lib/server-cookie";

export type Session = {
  userId: string;
  email: string;
  fullName: string | null;
  workspaceId: string;
  role: string;
  canManageBilling: boolean;
  subscription: {
    planCode: string;
    status: string;
    billingInterval: string;
    hasStripeCustomer: boolean;
    hasStripeSubscription: boolean;
  } | null;
  billingState: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function getSession(): Promise<Session | null> {
  const cookieHeader = await buildCookieHeader();

  try {
    const res = await fetch(`${API_URL}/v1/onboarding/status`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.authenticated || !data.userId || !data.workspaceId) return null;

    return {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName ?? null,
      workspaceId: data.workspaceId,
      role: data.role ?? "member",
      canManageBilling: data.canManageBilling ?? false,
      subscription: data.subscription ?? null,
      billingState: data.billingState ?? "none",
    };
  } catch {
    return null;
  }
}
