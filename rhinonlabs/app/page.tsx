import HomePage from "@/components/Pages/Home/HomePage"
import { Metadata } from "next";
import { FaqSchema, ServiceSchema } from "@/components/Common/SEO/PageSchemas";

export const metadata: Metadata = {
  title: { absolute: "Rhinon Labs | Custom AI Automation & Internal Dashboards" },
  description: "Scale your operations without adding headcount. Rhinon Labs builds custom AI agents, workflow automations, and internal tools that eliminate manual bottlenecks.",
  // Exactly the URL Google indexes for the homepage (with the trailing slash), so
  // the declared and Google-selected canonicals can't disagree.
  alternates: { canonical: "https://www.rhinonlabs.com/" },
  openGraph: {
    type: "website",
    url: "https://www.rhinonlabs.com/",
    title: "Rhinon Labs | Custom AI Automation & Internal Dashboards ",
    description:
      "Scale your operations without adding headcount. Rhinon Labs builds custom AI agents, workflow automations, and internal tools that eliminate manual bottlenecks.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Rhinon Labs — Custom AI Automation & Internal Dashboards" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rhinon Labs | AI MVP Development & Custom Software Studio",
    description:
      "Scale your operations without adding headcount. Rhinon Labs builds custom AI agents, workflow automations, and internal tools that eliminate manual bottlenecks.",
    images: ["/og-image.jpg"],
  },
};

const page = () => {
  return (
    <>
      <ServiceSchema />
      <FaqSchema />
      <HomePage />
    </>
  )
}

export default page
