import { TemplateGrid } from "@/app/pages/Templates/TemplateGrid";
import { BookTemplate } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template Builder | Rhinon CMS",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <BookTemplate size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Template Builder</h1>
            <p className="text-sm text-slate-400">Design messaging and tune AI prompts</p>
          </div>
        </div>
      </div>

      <TemplateGrid />
    </div>
  );
}
