// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ===== NAV ITEMS =====
const NAV_ITEMS = {
  main: [
    { id: "access_dashboard", title: "Dashboard", path: "dashboard" },
    { id: "manage_users", title: "Users", path: "users" },
  ],
  footer: [
    { id: "manage_settings", title: "Settings", path: "settings" },
  ],
};


// ===== HELPERS =====
const getBasePath = (pathname: string) => pathname.split("/")[1] || "";
const getSecondPath = (pathname: string) => pathname.split("/")[2] || "";

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify",
  "/auth/changePassword",
  "/auth/reset-password",
  "/auth/verify-account",
  "/auth/create-account",
  "/auth/admin-create-account",
  "/auth/teamsOnboarding",
  "/auth/onboarding",
];

const PUBLIC_PAGES = ["/kb", "/role"];

const ALLOWED_FOR_INVALID_PLAN = [
  "dashboard",
  "billings",
  "settings",
  "profile",
];

// ===== MIDDLEWARE =====
export function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Extract cookies
  const authToken = request.cookies.get("authToken")?.value;
  const currentRole = request.cookies.get("currentRole")?.value;
  const isPlanValid = request.cookies.get("isPlanValid")?.value === "true";
  const roleAccessRaw = request.cookies.get("roleAccess")?.value;

  // Decode role access
  let roleAccess: Record<string, string[]> = {};
  if (roleAccessRaw) {
    try {
      roleAccess = JSON.parse(decodeURIComponent(roleAccessRaw));
    } catch (e) {
      console.error("Invalid roleAccess cookie:", e);
    }
  }

  // ===== PUBLIC ROUTES =====
  if (
    PUBLIC_PAGES.some((path) => pathname.startsWith(path)) ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // ===== AUTH ROUTES =====
  if (PUBLIC_AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    // Authenticated users shouldn’t access login/signup pages
    if (authToken && pathname !== "/auth/teamsOnboarding") {
      return NextResponse.redirect(new URL("/", origin));
    }
    return NextResponse.next();
  }

  // ===== AUTH CHECK =====
  if (!authToken || !currentRole) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  // ===== PATH ROLE MATCH CHECK =====
  const basePath = getBasePath(pathname);
  if (basePath && basePath !== currentRole) {
    return NextResponse.redirect(new URL(`/${currentRole}/dashboard`, origin));
  }

  // ===== PLAN RESTRICTION =====
  const secondPath = getSecondPath(pathname);
  if (!isPlanValid) {
    if (secondPath && !ALLOWED_FOR_INVALID_PLAN.includes(secondPath)) {
      return NextResponse.redirect(
        new URL(`/${currentRole}/dashboard`, origin)
      );
    }
    return NextResponse.next();
  }

  // ===== ROLE-BASED ACCESS CONTROL =====
  if (
    secondPath &&
    secondPath !== "dashboard" &&
    secondPath !== "profile" &&
    currentRole !== "superadmin"
  ) {
    const allowedPageIds = roleAccess[currentRole] || [];
    const allNavItems = [...NAV_ITEMS.main, ...NAV_ITEMS.footer];
    const allowedPaths = allNavItems
      .filter((item) => allowedPageIds.includes(item.id))
      .map((item) => item.path);

    if (!allowedPaths.includes(secondPath)) {
      return NextResponse.redirect(
        new URL(`/${currentRole}/dashboard`, origin)
      );
    }
  }

  return NextResponse.next();
}

// ===== MATCHER CONFIG =====
export const config = {
  matcher: [
    // Match all routes except:
    // - Next.js static/image assets
    // - API routes
    // - Favicons, robots, manifest
    // - Public files with extensions
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|site.webmanifest|.*\\..*).*)",
  ],
};
