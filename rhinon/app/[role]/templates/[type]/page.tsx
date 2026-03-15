import { TemplateGrid } from "@/views/Templates/TemplateGrid";

export default function TemplatesTypePage({ params }: { params: Promise<{ type: string }> }) {
  // Pass the type down to the grid
  return <TemplateGrid />;
}
