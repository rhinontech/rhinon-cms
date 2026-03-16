"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Mail, Plus, Search, MoreVertical, BookTemplate } from "lucide-react";
import { Template } from "@/lib/types";
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
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FILTERS = ["All", "Cold Email"] as const;
type Filter = (typeof FILTERS)[number];

const SLUG_TO_FILTER: Record<string, Filter> = {
  "all": "All",
  "cold-email": "Cold Email"
};

const FILTER_TO_SLUG: Record<string, string> = {
  "All": "all",
  "Cold Email": "cold-email"
};

export function TemplateGrid() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const typeParam = params.type as string;
  
  const filter = SLUG_TO_FILTER[typeParam] || "All";
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => ((t as any)._id || t.id) !== id));
        toast.success("Template deleted");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesFilter = filter === "All" || t.channel === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
          <BookTemplate size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messaging Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Design and save reusable outreach content.</p>
        </div>
      </header>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => router.push(`/${role}/templates/${FILTER_TO_SLUG[tab]}`)}
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
          <Link href={`/${role}/templates/cold-email/new`}>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black whitespace-nowrap px-6 rounded-xl shadow-glow-sm">
              <Plus size={16} className="mr-1.5" /> New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => (
          <div
            key={(template as any)._id || template.id}
            className="group card p-5 flex flex-col cursor-pointer hover:border-cyan-500/40 hover:shadow-glow transition-all"
            onClick={() => router.push(`/${role}/templates/${FILTER_TO_SLUG[template.channel]}/${(template as any)._id || template.id}/edit`)}
          >
            {/* Card header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Mail size={15} />
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
                  <DropdownMenuItem onClick={() => router.push(`/${role}/templates/${FILTER_TO_SLUG[template.channel]}/${(template as any)._id || template.id}/edit`)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive font-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete((template as any)._id || template.id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{template.name}</h3>

            {template.subject && (
              <p className="text-xs text-muted-foreground mb-3 truncate flex items-center gap-1 font-medium">
                <span className="font-black text-[10px] uppercase text-cyan-600">Subj:</span> {template.subject}
              </p>
            )}

            <div className="relative mt-auto">
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {template.body}
              </p>
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              <span>Updated {format(new Date(template.updatedAt), "MMM d")}</span>
            </div>
          </div>
        ))}

        {/* Create New tile */}
        <Link href={`/${role}/templates/cold-email/new`} className="block">
          <div className="h-full min-h-[180px] border-2 border-dashed border-border hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
            <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus size={18} className="text-muted-foreground group-hover:text-cyan-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-muted-foreground text-sm group-hover:text-foreground transition-colors">Create Template</h3>
          </div>
        </Link>
      </div>
    </div>
  );
}
