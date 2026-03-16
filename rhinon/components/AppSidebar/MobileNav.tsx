"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";
import Link from "next/link";

interface MobileNavProps {
  roleSlug: string;
}

export function MobileNav({ roleSlug }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex lg:hidden items-center justify-between w-full p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <Link href={`/${roleSlug}/dashboard`} className="flex flex-col">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-500">
          Rhinon
        </p>
        <h1 className="text-[14px] font-bold leading-tight text-foreground">
          Operations Hub
        </h1>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="h-full flex flex-col pt-4">
             {/* We override the lg:flex in AppSidebar by wrapping it or adjusting it */}
             <div className="flex-1 [&>aside]:flex [&>aside]:w-full [&>aside]:border-0 [&>aside]:shadow-none">
                <AppSidebar roleSlug={roleSlug} />
             </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
