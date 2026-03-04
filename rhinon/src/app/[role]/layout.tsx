"use client";

import { RootSidebar } from "@/components/Common/Navigation/MainNavigation/RootSidebar";
import { SiteHeader } from "@/components/Common/Navigation/MainNavigation/SiteHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBannerStore } from "@/store/useBannerStore";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { isVisible, content, type, hideBanner } = useBannerStore();

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div
        className={cn(
          isVisible
            ? "[--header-height:calc(--spacing(28))]"
            : "[--header-height:calc(--spacing(14))]"
        )}>
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <RootSidebar />
            <SidebarInset className="shadow-none flex-1 w-[calc(100vw-var(--sidebar-width))]">
              <div className="flex flex-1 flex-col gap-4 border rounded-lg">{children}</div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </main>
  );
}
