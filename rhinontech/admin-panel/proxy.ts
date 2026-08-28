import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("authToken")?.value;

  const isAuthRoute = pathname.startsWith("/auth/");
  const isOnboardRoute = pathname.startsWith("/onboard");
  const isSignDocumentsRoute = pathname.startsWith("/sign-documents");
  const isPublicPortal = pathname.startsWith("/p/");

  // Public project portal — no auth required
  if (isPublicPortal) {
    return NextResponse.next();
  }

  if (isOnboardRoute || isSignDocumentsRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (authToken) {
      const payload = decodeJWTPayload(authToken);
      if (payload?.roleSlug) {
        const guest = payload.userType === "guest" || payload.roleSlug === "collaborator";
        return NextResponse.redirect(
          new URL(guest ? "/portal" : `/${payload.roleSlug}/dashboard`, request.url)
        );
      }
    }
    return NextResponse.next();
  }

  if (!authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const payload = decodeJWTPayload(authToken);

  if (!payload?.roleSlug) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  // Check token expiry
  if (payload.exp && typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  const roleSlug = payload.roleSlug as string;
  const urlRole = pathname.split("/")[1];

  // External collaborators live at /portal and nowhere else.
  //
  // This has to be handled BEFORE the role-matching rule below, which would
  // otherwise read "portal" as a role that does not match "collaborator" and
  // bounce them to /collaborator/dashboard — where the layout guard sends them
  // straight back here. That pair was an infinite redirect loop.
  const isCollaborator = payload.userType === "guest" || roleSlug === "collaborator";
  if (isCollaborator) {
    if (pathname === "/portal" || pathname.startsWith("/portal/")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Superadmin (the CEO) may preview any role's URL, including custom roles
  // created dynamically from Settings — everyone else may only browse their own.
  if (urlRole && urlRole !== roleSlug && roleSlug !== "superadmin") {
    return NextResponse.redirect(
      new URL(`/${roleSlug}/dashboard`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
