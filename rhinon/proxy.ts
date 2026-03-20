import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "./lib/auth";
import { hasCapability } from "./lib/authorization";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets and API routes (except if we want to protect APIs too)
  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const session = sessionCookie ? decodeSession(sessionCookie.value) : null;

  // 2. Auth Page Access (Login/Signup)
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/debug/email";
  const isOnboardingPage = pathname === "/onboarding";

  if (isAuthPage) {
    if (session) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      return NextResponse.redirect(new URL(`/${session.roleSlug}/dashboard`, req.url));
    }
    return NextResponse.next();
  }

  if (isOnboardingPage) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!session.mustChangePassword) {
      return NextResponse.redirect(new URL(`/${session.roleSlug}/dashboard`, req.url));
    }

    return NextResponse.next();
  }

  // 3. Root redirect
  if (pathname === "/") {
    if (session) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      return NextResponse.redirect(new URL(`/${session.roleSlug}/dashboard`, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Role-Based Route Protection
  // Protected paths follow /[role]/... pattern
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session.mustChangePassword) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const pathRolePart = pathSegments[0];
  const validRoleSlugs = ["super_admin", "admin", "manager", "sales", "marketer", "support"];

  // 4a. If path doesn't start with a role, but we have a session, redirect to /{role}/{path}
  if (!validRoleSlugs.includes(pathRolePart)) {
    return NextResponse.redirect(new URL(`/${session.roleSlug}/${pathname.replace(/^\//, "")}`, req.url));
  }

  // 4b. If the path role prefix doesn't match session role slug, redirect to correct role
  if (pathRolePart !== session.roleSlug) {
    return NextResponse.redirect(new URL(`/${session.roleSlug}/dashboard`, req.url));
  }

  // 5. Admin-only sections (Client side too, but middleware can help)
  if (pathname.includes("/team") && !hasCapability(session, "manage_users")) {
    return NextResponse.redirect(new URL(`/${session.roleSlug}/dashboard`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
