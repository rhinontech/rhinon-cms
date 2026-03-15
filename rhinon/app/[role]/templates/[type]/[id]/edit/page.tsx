"use client";

import React, { useEffect, useState, use } from "react";
import { TemplateEditor } from "@/views/Templates/TemplateEditor";
import { Template } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${id}`);
        const data = await res.json();
        setTemplate(data);
      } catch (error) {
        console.error("Error fetching template:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return <TemplateEditor template={template} />;
}
