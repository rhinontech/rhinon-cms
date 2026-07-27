import { Metadata } from "next";
import PrivacyTermsClient from "@/components/Pages/PrivacyTerms/PrivacyTermsClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rhinonlabs.com";

export const metadata: Metadata = {
  title: "Privacy Policy & Terms of Service | Rhinon Labs",
  description:
    "Review our Privacy Policy and Terms of Service. Learn how Rhinon Labs handles client data security, data sovereignty, AI ethics, and project intellectual property.",
  alternates: {
    canonical: `${SITE_URL}/privacy-terms`,
  },
  openGraph: {
    title: "Privacy Policy & Terms of Service | Rhinon Labs",
    description:
      "Detailed protocols governing privacy, data security, AI ethics, and service architecture at Rhinon Labs.",
    url: `${SITE_URL}/privacy-terms`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Rhinon Labs Legal Transparency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy & Terms of Service | Rhinon Labs",
    description:
      "Detailed protocols governing privacy, data security, AI ethics, and service architecture at Rhinon Labs.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function PrivacyTermsPage() {
  return <PrivacyTermsClient />;
}
