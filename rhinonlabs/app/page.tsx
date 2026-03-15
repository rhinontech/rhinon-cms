import HomePage from "@/components/Pages/Home/HomePage"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rhinon Web | Home",
  description: "Ship your product 3x faster without hiring a tech team. We help founders and SMBs build MVPs, websites, and AI products with affordable pricing.",
};

const page = () => {
  return (
    <HomePage />
  )
}

export default page
