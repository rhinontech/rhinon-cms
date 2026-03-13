"use client";

import { use } from "react";
import { dummyTemplates } from "@/lib/dummy-data";
import { TemplateEditor } from "@/views/Templates/TemplateEditor";
import { notFound } from "next/navigation";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const template = dummyTemplates.find((t) => t.id === id);

  if (!template) {
    return notFound();
  }

  return <TemplateEditor template={template} />;
}
