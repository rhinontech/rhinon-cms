import ProjectDetail from "@/components/Pages/Projects/ProjectDetail";
import { projects } from "@/components/Pages/Projects/data";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export function generateStaticParams() {
    return projects.map((project) => ({
        id: project.id.toString(),
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const project = projects.find((p) => p.id.toString() === id);

    if (!project) {
        return {
            title: "Project Not Found",
        };
    }

    return {
        title: project.title,
        description: project.description,
        openGraph: {
            title: project.title,
            description: project.description,
            images: [project.images[0]], // Use first image from array
        },
    };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = projects.find((p) => p.id.toString() === id);

    if (!project) {
        notFound();
    }

    return <ProjectDetail project={project} />;
}
