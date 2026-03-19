"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, RefreshCcw, FileText, MoreVertical, Edit2, Trash2, ExternalLink, Globe, FileClock } from "lucide-react";
import { Blog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BlogsView() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      }
    } catch (err) {
      toast.error("Failed to delete blog");
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(search.toLowerCase()) ||
    blog.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Rhinon Journal</h1>
          <p className="text-sm text-muted-foreground">Manage your thought leadership and insights.</p>
        </div>
        <Button 
          onClick={() => router.push(`/${role}/blogs/new`)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-xl px-6 shadow-glow-sm shadow-cyan-500/20"
        >
          <Plus size={18} className="mr-2" /> New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by title or slug..." 
            className="pl-10 h-11 bg-card border-border" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" className="h-11 border-border font-bold text-xs uppercase tracking-widest" onClick={fetchBlogs}>
          <RefreshCcw size={16} className={cn("mr-2", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full flex h-60 items-center justify-center rounded-3xl border border-dashed border-border bg-card/30">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-border bg-card/30 text-center">
            <FileText size={48} className="text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No blog posts found.</p>
            <Button variant="ghost" className="mt-4 text-cyan-500" onClick={() => router.push(`/${role}/blogs/new`)}>Create your first post</Button>
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div key={blog.id} className="group relative flex gap-6 p-6 rounded-[32px] border border-border bg-card/40 hover:bg-card/60 transition-all duration-300">
               <div className="h-32 w-48 shrink-0 rounded-2xl overflow-hidden border border-border bg-secondary/50">
                  {blog.coverImage ? (
                    <img src={blog.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                       <FileText size={32} />
                    </div>
                  )}
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-foreground truncate group-hover:text-cyan-500 transition-colors">{blog.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-foreground gap-2 cursor-pointer" onClick={() => router.push(`/${role}/blogs/${blog.id}/edit`)}>
                          <Edit2 size={14} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-foreground gap-2 cursor-pointer" onClick={() => window.open(`http://localhost:3001/blogs/${blog.slug}`, '_blank')}>
                           <ExternalLink size={14} /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-rose-500 gap-2 cursor-pointer" onClick={() => handleDelete(blog.id)}>
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 font-medium leading-relaxed uppercase tracking-tight opacity-70">
                    {blog.excerpt || "No excerpt provided."}
                  </p>

                  <div className="mt-auto flex items-center gap-4">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] border-transparent",
                      blog.status === "Published" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {blog.status}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                       <Globe size={12} className="text-cyan-500" />
                       /{blog.slug}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-auto">
                       <FileClock size={12} />
                       {format(new Date(blog.publishedAt), "MMM d, yy")}
                    </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
