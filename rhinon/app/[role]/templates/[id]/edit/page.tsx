"use client";

import { TemplateEditor } from "@/views/Templates/TemplateEditor";
import { dummyTemplates } from "@/lib/dummy-data";

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = dummyTemplates.find((t) => t.id === params.id) || null;
  return <TemplateEditor template={template} />;
}
