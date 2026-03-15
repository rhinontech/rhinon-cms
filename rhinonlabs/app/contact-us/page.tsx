import ContactUs from "@/components/Pages/ContactUs/ContactUs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Request a discovery call to discuss your internal tools and operational challenges. 24-hour response time.",
};

export default function page() {
    return <ContactUs />
}