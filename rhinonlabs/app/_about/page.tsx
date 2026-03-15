import About from "@/components/Pages/About/About";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description: "Founder-led team specializing in internal systems for scaling enterprises. We work directly with decision-makers to fix systems that slow teams down.",
};

export default function page() {
    return (
        <About />
    )
}