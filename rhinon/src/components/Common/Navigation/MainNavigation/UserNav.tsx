"use client";

import Link from "next/link";
import { LayoutGrid, LogOut, MoonIcon, SunIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Cookies from "js-cookie";
// import { logout } from "@/services/authServices";
import { useUserStore } from "@/utils/store";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function UserNav() {
  const router = useRouter();
  const [openConfirm, setOpenConfirm] = useState(false);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = Cookies.get("currentRole");

  const handleLogout = () => {
    const allCookies = Cookies.get();
    for (const cookie in allCookies) {
      Cookies.remove(cookie);
    }
    localStorage.clear();
    router.push("/auth/login");
  };

  const firstName = useUserStore((state) => state.userData.userFirstName);
  const lastName = useUserStore((state) => state.userData.userLastName);
  const email = useUserStore((state) => state.userData.userEmail);

  // Derive initials for the AvatarFallback
  const userInitials = `${firstName ? firstName.charAt(0) : ""}${lastName ? lastName.charAt(0) : ""
    }`.toUpperCase();

  return (
    <>
      <DropdownMenu>
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="#" alt="Avatar" />
                    <AvatarFallback className="bg-transparent">
                      {userInitials || "JD"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Profile</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          className="w-56 relative z-[1000]"
          align="end"
          forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {firstName} {lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="hover:cursor-pointer" asChild>
              <Link href={`/${role}/dashboard`} className="flex items-center">
                <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" asChild>
              <Link href={`/${role}/profile`} className="flex items-center">
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:cursor-pointer" asChild>
              <button className="flex items-center w-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <div className="relative mr-3">
                  <SunIcon className="w-4 h-4 rotate-90 scale-0 transition-transform ease-in-out duration-500 dark:rotate-0 dark:scale-100" />
                  <MoonIcon className="absolute top-0 left-0 w-4 h-4 rotate-0 scale-100 transition-transform ease-in-out duration-500 dark:-rotate-90 dark:scale-0" />
                </div>
                {mounted && (theme === "dark" ? "Light Mode" : "Dark Mode")}
              </button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onClick={() => setOpenConfirm(true)}>
            <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <DialogContent className="z-1000 max-w-xl">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You’ll need to log in again to
              access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
