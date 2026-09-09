import { cookies } from "next/headers";
import { auth } from "./config";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "./jwt";
import { ROLES } from "@/lib/constants";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (userRole !== ROLES.ADMIN && userRole !== ROLES.STAFF) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireCustomer() {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (userRole !== ROLES.CUSTOMER) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (!userRole || !roles.includes(userRole)) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  const userRole = session.user.role;

  if (userRole === ROLES.ADMIN) {
    return session;
  }

  if (userRole !== ROLES.STAFF) {
    redirect("/unauthorized");
  }

  return session;
}

export async function getOptionalSession() {
  return await auth();
}

/**
 * Resolves the signed-in user inside a Server Component, covering both auth
 * mechanisms this app uses: a NextAuth session (Google / NextAuth credentials)
 * and the HttpOnly `access_token` cookie issued by the custom login. Mirrors
 * what `createApiHandler` does for API routes.
 */
export async function getPageSessionUser(): Promise<{
  id: string;
  email?: string;
  role: string;
} | null> {
  try {
    const session = await auth();
    const user = session?.user as
      | { id?: string; email?: string; role?: string }
      | undefined;
    if (user?.id) {
      return {
        id: user.id,
        email: user.email,
        role: user.role || ROLES.CUSTOMER,
      };
    }
  } catch {
    // Fall through to the access-token cookie.
  }

  try {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return null;
    const payload = verifyAccessToken(token);
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role || ROLES.CUSTOMER,
    };
  } catch {
    return null;
  }
}

export function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === ROLES.ADMIN || session?.user?.role === ROLES.STAFF;
}

export function isCustomer(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === ROLES.CUSTOMER;
}

export function isAuthenticated(session: { user?: { id?: string } } | null): boolean {
  return !!session?.user?.id;
}
