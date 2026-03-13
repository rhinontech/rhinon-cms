"use client";

import React from "react";
import { TemplateEditor } from "@/views/Templates/TemplateEditor";
import { dummyTemplates } from "@/lib/dummy-data";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const template = dummyTemplates.find((t) => t.id === id) || null;
  return <TemplateEditor template={template} />;
}
