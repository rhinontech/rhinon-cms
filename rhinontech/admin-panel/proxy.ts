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
  const isPublicPortal = pathname.startsWith("/p/");

  // Public project portal — no auth required
  if (isPublicPortal) {
    return NextResponse.next();
  }

  if (isOnboardRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (authToken) {
      const payload = decodeJWTPayload(authToken);
      if (payload?.roleSlug) {
        return NextResponse.redirect(
          new URL(`/${payload.roleSlug}/dashboard`, request.url)
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
  const allowedPreviewRoles = ["superadmin", "hr", "employee"];

  if (
    urlRole &&
    urlRole !== roleSlug &&
    !(roleSlug === "superadmin" && allowedPreviewRoles.includes(urlRole))
  ) {
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
