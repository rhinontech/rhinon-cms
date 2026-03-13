import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Rhinon CMS",
  description: "Private operations and outbound engine",
};

import { ScrollArea } from "@/components/ui/scroll-area";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="h-screen overflow-hidden">
        <div className="flex h-full w-full p-5 md:p-8 gap-5">
          <AppSidebar />
          <main className="flex-1 h-full min-w-0">
            <ScrollArea className="h-full w-full">
              {children}
            </ScrollArea>
          </main>
        </div>
      </body>
    </html>
  );
}
