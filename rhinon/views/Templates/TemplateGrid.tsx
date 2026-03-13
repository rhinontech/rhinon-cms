"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Mail, Linkedin, Plus, Search, MoreVertical } from "lucide-react";
import { dummyTemplates } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Email", "LinkedIn DM", "LinkedIn Connection"] as const;
type Filter = (typeof FILTERS)[number];

export function TemplateGrid() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = dummyTemplates.filter((t) => {
    const matchesFilter = filter === "All" || t.channel === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                filter === tab
                  ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Link href="/templates/new">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold whitespace-nowrap">
              <Plus size={15} className="mr-2" /> New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group card p-5 flex flex-col cursor-pointer hover:border-cyan-500/40 hover:shadow-glow transition-all"
            onClick={() => router.push(`/templates/${template.id}/edit`)}
          >
            {/* Card header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  template.channel === "Email"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                )}>
                  {template.channel === "Email" ? <Mail size={15} /> : <Linkedin size={15} />}
                </div>
                <Badge variant="outline" className="bg-secondary border-border text-muted-foreground text-[11px]">
                  {template.channel}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                  <DropdownMenuItem onClick={() => router.push(`/templates/${template.id}/edit`)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{template.name}</h3>

            {template.subject && (
              <p className="text-xs text-muted-foreground mb-3 truncate flex items-center gap-1">
                <span className="font-bold">Subj:</span> {template.subject}
              </p>
            )}

            <div className="relative mt-auto">
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {template.body}
              </p>
              {/* Fade — adapts to card bg in both modes */}
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        ))}

        {/* Create New tile */}
        <Link href="/templates/new" className="block">
          <div className="h-full min-h-[180px] border-2 border-dashed border-border hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center mb-3">
              <Plus size={18} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-muted-foreground text-sm">Create Template</h3>
          </div>
        </Link>
      </div>
    </div>
  );
}
