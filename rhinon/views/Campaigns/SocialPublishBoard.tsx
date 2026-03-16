"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Rocket, Send, Settings, LineChart, MessageSquare, Heart, Share2, Sparkles, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Campaign, Template } from "@/lib/types";
import { SocialPublishWizard } from "./SocialPublishWizard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const stageBadge: Record<string, string> = {
  Active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Paused:    "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/25",
  Completed: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/25",
  Draft:     "bg-secondary     text-muted-foreground              border-border",
};

export function SocialPublishBoard(): JSX.Element {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [posts, setPosts] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Campaign | null>(null);

  const fetchData = async () => {
    try {
      const [campaignsRes, templatesRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/templates"),
      ]);
      const [campaignsData, templatesData] = await Promise.all([
        campaignsRes.json(),
        templatesRes.json(),
      ]);

      const socialChannels = ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];
      const socialPosts = campaignsData.filter((c: Campaign) => socialChannels.includes(c.channel));

      setPosts(socialPosts);
      setTemplates(templatesData);

      // Proactively refresh stats for completed social posts
      socialPosts.forEach((p: Campaign) => {
        if (p.stage === "Completed" && p.platformPostId) {
          fetch(`/api/campaigns/${(p as any)._id || p.id}/stats`).catch(() => {});
        }
      });
    } catch (error) {
      console.error("Error fetching social posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      // In reality, this would hit the specific social generation endpoint
      const res = await fetch(`/api/campaigns/${id}/process`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("AI Content Generated!");
        await fetchData();
      }
    } catch (error) {
      console.error("Error processing post:", error);
      toast.error("Failed to process content.");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublishPost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLaunchingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Post successfully published to LinkedIn!");
        await fetchData();
      } else {
        toast.error(data.error || "Failed to publish post.");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("Failed to publish post.");
    } finally {
      setLaunchingId(null);
    }
  };

  const handleDeletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Post deleted successfully.");
        await fetchData();
      } else {
        toast.error(data.error || "Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefreshStats = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/stats`);
      const data = await res.json();
      if (!data.error) {
        toast.success("Stats synchronized!");
        await fetchData();
      }
    } catch (error) {
      console.error("Error refreshing stats:", error);
    } finally {
      setRefreshingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const PostCard = ({ post }: { post: Campaign }) => {
    const template = templates.find(t => ((t as any)._id || t.id) === post.templateId);
    
    return (
      <div className="card p-5 hover:border-cyan-500/40 hover:shadow-glow transition-all group flex flex-col h-full bg-card/50">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wide", stageBadge[post.stage])}>
            {post.channel}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
              {format(new Date(post.startDate), "MMM d, h:mm a")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <Settings size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border text-foreground min-w-[140px]">
                <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewPost(post); }}>View Preview</DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleDeletePost((post as any)._id || post.id, e)}
                  disabled={deletingId === ((post as any)._id || post.id)}
                  className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                >
                  {deletingId === ((post as any)._id || post.id) ? "Deleting..." : "Delete Post"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-6 flex-1">
          <h4 className="text-base font-bold text-foreground leading-tight mb-2 line-clamp-2">{post.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            Template: {template?.name || "None"}
          </p>
        </div>
        
        {/* Real Analytics Section */}
        {post.stage === "Completed" && (
          <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg mb-4 text-muted-foreground border border-border/50 group/stats relative">
            <div className="flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> <span className="text-xs font-bold text-foreground">{post.socialStats?.likes || 0}</span></div>
            <div className="flex items-center gap-1.5"><MessageSquare size={12} className="text-amber-500" /> <span className="text-xs font-bold text-foreground">{post.socialStats?.comments || 0}</span></div>
            <div className="flex items-center gap-1.5"><Share2 size={12} className="text-indigo-500" /> <span className="text-xs font-bold text-foreground">{post.socialStats?.shares || 0}</span></div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => handleRefreshStats((post as any)._id || post.id, e)}
              className={cn(
                "h-6 w-6 absolute -right-1 -top-1 bg-background border border-border shadow-sm rounded-full opacity-0 group-hover/stats:opacity-100 transition-opacity",
                refreshingId === ((post as any)._id || post.id) && "opacity-100"
              )}
            >
              <Settings size={10} className={cn(refreshingId === ((post as any)._id || post.id) && "animate-spin")} />
            </Button>
          </div>
        )}

        <div className="mt-auto flex gap-2">
          {processingId === ((post as any)._id || post.id) ? (
            <Button size="sm" disabled className="flex-1 bg-violet-600/20 text-violet-500 border-violet-500/20 h-9 font-bold text-[11px]">
               <Sparkles size={12} className="mr-1.5 animate-pulse" /> Generating...
            </Button>
          ) : (
            <Button size="sm" onClick={(e) => handleProcessPost((post as any)._id || post.id, e)} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-9 font-bold text-[11px] shadow-glow-sm">
               <Sparkles size={12} className="mr-1.5" /> Auto-Draft
            </Button>
          )}

          {launchingId === ((post as any)._id || post.id) ? (
            <Button size="sm" disabled className="flex-1 bg-cyan-500/20 text-cyan-600 border-cyan-500/20 h-9 font-bold text-[11px]">
              <div className="h-3 w-3 animate-spin border-2 border-cyan-500 border-t-transparent rounded-full mr-1.5" /> Publishing...
            </Button>
          ) : (
            <Button size="sm" onClick={(e) => handlePublishPost((post as any)._id || post.id, e)} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 h-9 font-bold text-[11px] shadow-glow-sm">
               <Send size={12} className="mr-1.5" /> Publish Now
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* Page Header */}
      <header className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
           <Rocket size={26} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Social Post Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Plan, generate, and schedule thought leadership content across platforms. 
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn("px-3 py-1.5 rounded-lg h-8 text-xs font-bold transition-all", viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid size={14} className="mr-1.5" /> Grid Planner
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn("px-3 py-1.5 rounded-lg h-8 text-xs font-bold transition-all", viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <List size={14} className="mr-1.5" /> Feed View
          </Button>
        </div>
        <SocialPublishWizard />
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-secondary/20">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <LineChart className="text-muted-foreground" size={24} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Posts Scheduled</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Create your first social broadcast to start building your audience and thought leadership engine.</p>
          <SocialPublishWizard />
        </div>
      ) : (
        <div className={cn(
          "gap-5",
          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-1 max-w-4xl mx-auto space-y-4"
        )}>
          {posts.map((post) => (
            <PostCard key={(post as any)._id || post.id} post={post} />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-card border-border text-foreground preview-dialog p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="text-cyan-500" size={18} /> 
              Preview: {previewPost?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="border border-border rounded-xl bg-secondary/30 relative overflow-hidden p-6 md:p-8">
               
               {!previewPost?.aiDraft && (
                 <div className="text-center py-12 text-muted-foreground italic text-sm">
                   <Sparkles className="mx-auto mb-3 opacity-50" size={32} />
                   <p>No content generated yet.</p>
                   <p className="mt-1">Click "Auto-Draft" to generate the post copy.</p>
                 </div>
               )}

               {previewPost?.aiDraft && (
                 <div className="space-y-6 max-w-2xl mx-auto">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden border border-border shadow-sm">
                       {/* Mock User Avatar */}
                       <img src="https://ui-avatars.com/api/?name=Rhinon+Admin&background=0284c7&color=fff" alt="User" />
                     </div>
                     <div>
                       <div className="font-bold text-sm text-foreground">Rhinon Admin</div>
                       <div className="text-xs text-muted-foreground">Just now • 🌍</div>
                     </div>
                   </div>
                   
                   <div className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                     {previewPost.aiDraft}
                   </div>

                   {previewPost.mediaUrl && (
                     <div className="mt-6 rounded-2xl overflow-hidden border border-border bg-black shadow-lg">
                       <img src={previewPost.mediaUrl} alt="Post Media" className="w-full h-auto object-contain max-h-[500px]" />
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>
          
          <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
             <Button variant="outline" onClick={() => setPreviewPost(null)}>Close Preview</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
