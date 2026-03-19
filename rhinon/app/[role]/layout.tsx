import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { MobileNav } from "@/components/AppSidebar/MobileNav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="flex flex-col lg:flex-row h-full w-full lg:p-3 lg:gap-4">
      <AppSidebar roleSlug={resolvedParams.role} />
      <MobileNav roleSlug={resolvedParams.role} />
      <main className="flex-1 h-full min-w-0 p-5 lg:p-0">
        <ScrollArea className="h-full w-full">
          {children}
        </ScrollArea>
      </main>
    </div>
  );
}
