import HomePage from "@/components/Pages/Home/HomePage"
import { Metadata } from "next";
import { FaqSchema, ServiceSchema } from "@/components/Common/SEO/PageSchemas";

export const metadata: Metadata = {
  title: { absolute: "Rhinon Labs — MVP, AI & Software Development for Startups" },
  description: "Ship your product 3x faster without hiring a tech team. We help founders and SMBs build MVPs, websites, and AI products with affordable pricing.",
  alternates: { canonical: "https://www.rhinonlabs.com" },
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
