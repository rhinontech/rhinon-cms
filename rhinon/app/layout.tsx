import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
