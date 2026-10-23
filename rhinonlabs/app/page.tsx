import HomePage from "@/components/Pages/Home/HomePage"
import { Metadata } from "next";
import { FaqSchema, ServiceSchema } from "@/components/Common/SEO/PageSchemas";

export const metadata: Metadata = {
  title: { absolute: "Rhinon Labs — MVP, AI & Software Development for Startups" },
  description: "Ship your product 3x faster without hiring a tech team. We help founders and SMBs build MVPs, websites, and AI products with affordable pricing.",
  // Exactly the URL Google indexes for the homepage (with the trailing slash), so
  // the declared and Google-selected canonicals can't disagree.
  alternates: { canonical: "https://www.rhinonlabs.com/" },
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
