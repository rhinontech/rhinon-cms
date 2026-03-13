"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Mail, Linkedin, Plus, Search, MoreVertical } from "lucide-react";
import { dummyTemplates } from "@/app/lib/dummy-data";
import { Template } from "@/app/lib/types";
import { TemplateEditor } from "./TemplateEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TemplateGrid() {
  const [filter, setFilter] = useState<"All" | "Email" | "LinkedIn DM" | "LinkedIn Connection">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const filteredTemplates = dummyTemplates.filter((t) => {
    const matchesFilter = filter === "All" || t.channel === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (editingTemplate) {
    return (
      <TemplateEditor 
        template={editingTemplate} 
        onClose={() => setEditingTemplate(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {["All", "Email", "LinkedIn DM", "LinkedIn Connection"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === tab 
                  ? "bg-slate-800 text-cyan-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800"
            />
          </div>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium whitespace-nowrap">
            <Plus size={16} className="mr-2" /> New Template
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => (
          <div 
            key={template.id} 
            className="group card p-5 flex flex-col cursor-pointer hover:border-cyan-500/50 hover:shadow-glow transition-all"
            onClick={() => setEditingTemplate(template)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  template.channel === "Email" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                }`}>
                  {template.channel === "Email" ? <Mail size={16} /> : <Linkedin size={16} />}
                </div>
                <Badge variant="outline" className="bg-slate-900 border-slate-700">
                  {template.channel}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                  <DropdownMenuItem onClick={() => setEditingTemplate(template)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-rose-400">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold text-slate-200 text-base mb-1 truncate">{template.name}</h3>
            
            {template.subject && (
              <p className="text-xs text-slate-400 mb-3 truncate flex items-center gap-2">
                <span className="font-semibold text-slate-500">Subj:</span> {template.subject}
              </p>
            )}

            <div className="relative mt-auto">
              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                {template.body}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span>Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        ))}
        
        {/* Create New Card */}
        <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]">
          <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
            <Plus size={20} className="text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-300">Create Template</h3>
        </div>
      </div>
    </div>
  );
}
