import "./globals.css";

export const metadata = {
  title: "Rhinon Labs — Homepage Concept",
  description:
    "Homepage design concept for Rhinon Labs. Internal review only — not for production.",
  robots: "noindex, nofollow",
};

export const viewport = {
  themeColor: "#ECECE8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="js">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
