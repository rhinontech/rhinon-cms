import About from "@/components/Pages/About/About";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Rhinon Labs | Custom Dashboards & Automation Studio, India",
    description: "Rhinon Labs is a focused product studio in India. We build internal dashboards, workflow automations and AI tools for Indian startups and SMBs — shipping in 2–4 weeks.",
};

export default function page() {
    return (
        <About />
    )
}