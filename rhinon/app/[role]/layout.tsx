import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { role: string };
}) {
  return (
    <div className="flex h-full w-full p-5 md:p-8 gap-5">
      <AppSidebar roleSlug={params.role} />
      <main className="flex-1 h-full min-w-0">
        <ScrollArea className="h-full w-full">
          {children}
        </ScrollArea>
      </main>
    </div>
  );
}
