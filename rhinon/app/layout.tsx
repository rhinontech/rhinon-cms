import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/app/components/AppSidebar/AppSidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Rhinon CMS",
  description: "Private operations and outbound engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <main className="min-h-screen p-5 text-sm md:p-8">
          <div className="mx-auto grid max-w-[1600px] gap-5 lg:grid-cols-[250px_1fr]">
            <AppSidebar />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
