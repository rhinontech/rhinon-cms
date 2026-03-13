import type { Metadata } from "next";
import "@/app/global.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Rhinon CMS | Login",
  description: "Secure access to Rhinon Engine",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden", geist.variable)}>
      {/* Background gradients managed by global.css body are inherited, but we can add an extra glow here */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>
      
      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  );
}
