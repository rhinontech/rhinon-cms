import { TemplateEditor } from "@/views/Templates/TemplateEditor";

const SLUG_TO_FILTER: Record<string, string> = {
  "all": "All",
  "cold-email": "Cold Email",
  "linkedin-post": "LinkedIn Post",
  "linkedin-video": "LinkedIn Video",
  "linkedin-article": "LinkedIn Article",
};

export default async function NewTemplatePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const channel = SLUG_TO_FILTER[type] || "Cold Email";
  
  return <TemplateEditor template={null} initialChannel={channel} />;
}
