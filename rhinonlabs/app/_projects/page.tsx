import ProjectsPage from "@/components/Pages/Projects/ProjectsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Our Work",
    description: "Enterprise internal systems case studies. See how we've fixed broken dashboards, admin tools, and operational workflows for scaling teams.",
};

export default function Page() {
    return (
        <ProjectsPage />
    )
}