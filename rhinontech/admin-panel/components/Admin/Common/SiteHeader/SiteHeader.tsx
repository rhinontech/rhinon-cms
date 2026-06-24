"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { TbUser, TbChevronDown, TbBell, TbEye } from "react-icons/tb";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

function decodeJWT(token: string): { fullName?: string; companyEmail?: string; roleSlug?: string } {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600", "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-violet-500 to-purple-600",
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const roleViews = [
  { slug: "superadmin", label: "Super Admin" },
  { slug: "hr", label: "HR" },
  { slug: "employee", label: "Employee" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const roleSlug = pathname.split("/")[1] || "";
  const [currentUser, setCurrentUser] = useState<{ fullName?: string; companyEmail?: string; roleSlug?: string }>({
    fullName: "User",
    companyEmail: "",
  });

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) setCurrentUser(decodeJWT(token));
  }, []);

  const name      = currentUser.fullName    ?? "User";
  const firstName = name.split(" ")[0];
  const email     = currentUser.companyEmail ?? "";
  const initial   = name.charAt(0).toUpperCase();
  const canPreviewRoles = currentUser.roleSlug === "superadmin";
  const currentRoleView = roleViews.find((role) => role.slug === roleSlug)?.label ?? roleSlug;

  const switchRoleView = (nextRole: string) => {
    const parts = pathname.split("/");
    parts[1] = nextRole;
    router.push(parts.join("/") || `/${nextRole}/dashboard`);
  };

  const logOut = () => {
    Cookies.remove("authToken");
    Cookies.remove("permissions");
    router.push("/auth/login");
  };

  return (
    <div className="flex items-center justify-end rounded-lg bg-white border border-stone-200 px-4 h-[50px] shrink-0 gap-3">
      {canPreviewRoles && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-stone-50">
              <TbEye size={16} className="text-gray-400" />
              Viewing as {currentRoleView}
              <TbChevronDown size={13} className="text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Preview interface
            </div>
            {roleViews.map((role) => (
              <button
                key={role.slug}
                onClick={() => switchRoleView(role.slug)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 ${
                  role.slug === roleSlug ? "font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {role.label}
                {role.slug === roleSlug && <span className="text-xs text-blue-600">Active</span>}
              </button>
            ))}
            <p className="mt-1 border-t px-2 pt-2 text-xs leading-5 text-gray-400">
              Permissions stay Super Admin.
            </p>
          </PopoverContent>
        </Popover>
      )}

      {/* Notifications */}
      <button className="relative p-1.5 rounded-lg text-gray-400 hover:bg-stone-100 hover:text-gray-700 transition-colors">
        <TbBell size={18} />
      </button>

      <div className="h-5 w-px bg-stone-200" />

      {/* User menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors group">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
              {initial}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">{firstName}</span>
            <TbChevronDown size={13} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-56 p-2">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
          </div>
          <div className="border-t pt-1 space-y-0.5">
            <Link
              href={`/${roleSlug}/profile/info`}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <TbUser size={15} /> View Profile
            </Link>
            <button
              onClick={logOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 rounded-md"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
