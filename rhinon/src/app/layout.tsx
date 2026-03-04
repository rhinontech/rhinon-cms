import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto, Outfit, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Common/providers/ThemeProvider";
import { SonnerProvider } from "@/context/SonnerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rhinon Tech",
  description: "Rhinon Tech - Your AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${outfit.variable} ${poppins.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let themeColor = localStorage.getItem('theme-color');
                if (themeColor && themeColor !== 'default') {
                  document.documentElement.setAttribute('data-theme', themeColor);
                }
                let themeFont = localStorage.getItem('theme-font');
                if (themeFont && themeFont !== 'default') {
                  document.documentElement.setAttribute('data-font', themeFont);
                }
                let themeRadius = localStorage.getItem('theme-radius');
                if (themeRadius && themeRadius !== '0.625rem') {
                  document.documentElement.setAttribute('data-radius', themeRadius);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SonnerProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
