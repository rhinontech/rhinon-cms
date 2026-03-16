import { notFound } from "next/navigation";
import { Metadata } from "next";
import dbConnect from "@/lib/db";
import Campaign from "@/models/Campaign";
import SocialPost from "@/models/SocialPost";
import { format } from "date-fns";
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await dbConnect();
  const { slug } = await params;
  
  // Try to find by slug first, then ID in both collections
  let article: any = await SocialPost.findOne({ slug });
  if (!article) article = await Campaign.findOne({ slug });
  
  if (!article && slug.length === 24) {
    article = await SocialPost.findById(slug) || await Campaign.findById(slug);
  }

  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title || article.name || article.mediaTitle,
    description: article.mediaDescription || "Read the latest thought leadership from Rhinon Tech.",
    openGraph: {
      images: article.mediaUrl ? [article.mediaUrl] : [],
    },
  };
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  // Pre-process bold text and placeholders across the whole content
  const processInlines = (text: string) => {
    // Replace placeholders
    const sanitized = text.replace(/\{\{sender\.name\}\}/g, "Prabhat Patra");
    const parts = sanitized.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-black text-cyan-400">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="space-y-3 my-6 ml-4">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();

    // List items
    if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      const content = trimmedLine.replace(/^[\*\-]\s+/, "");
      currentList.push(
        <li key={i} className="flex gap-3 text-foreground/80">
          <span className="text-cyan-500 font-bold shrink-0 mt-1.5">•</span>
          <span>{processInlines(content)}</span>
        </li>
      );
      return;
    }

    // If not a list item, flush any existing list
    flushList();

    if (trimmedLine === "") {
       renderedElements.push(<div key={i} className="h-4" />);
       return;
    }

    // Headers
    if (trimmedLine.startsWith("### ")) {
      renderedElements.push(<h3 key={i} className="text-xl font-bold text-foreground mt-8 mb-4">{trimmedLine.replace("### ", "")}</h3>);
    } else if (trimmedLine.startsWith("## ")) {
      renderedElements.push(<h2 key={i} className="text-2xl font-black text-foreground mt-10 mb-6 border-b border-border/50 pb-2">{trimmedLine.replace("## ", "")}</h2>);
    } else if (trimmedLine.startsWith("# ")) {
      renderedElements.push(<h1 key={i} className="text-3xl font-black text-foreground mt-12 mb-8 uppercase tracking-tight">{trimmedLine.replace("# ", "")}</h1>);
    } else {
      // Regular paragraph
      renderedElements.push(<p key={i} className="mb-4">{processInlines(line)}</p>);
    }
  });

  // Final flush
  flushList();

  return (
    <div className="text-foreground/90 leading-relaxed text-lg font-medium article-content">
      {renderedElements}
    </div>
  );
};

export default async function ArticlePage({ params }: PageProps) {
  await dbConnect();
  const { slug } = await params;
  
  let article: any;
  try {
    article = await SocialPost.findOne({ slug });
    if (!article) article = await Campaign.findOne({ slug });
    
    if (!article && slug.length === 24) {
      article = await SocialPost.findById(slug) || await Campaign.findById(slug);
    }
  } catch (err) {
    notFound();
  }

  if (!article || article.channel !== "LinkedIn Article") {
    notFound();
  }

  const publishDate = article.updatedAt || new Date();

  return (
    <div className="relative min-h-screen bg-background selection:bg-cyan-500/30">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[5%] w-[35%] h-[35%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-cyan-400 transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        {/* Article Header */}
        <div className="space-y-8 mb-16">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Insight & Strategy</span>
             </div>
             <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
             <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                <Clock size={12} /> 5 Min Read
             </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.1] tracking-tight">
            {article.title || article.name || article.mediaTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-0.5 shadow-glow-sm">
                 <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center">
                    <User size={20} className="text-cyan-400" />
                 </div>
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1">Prabhat Patra</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Founder @ Rhinon Tech</p>
              </div>
            </div>

            <div className="flex items-center gap-6 ml-auto">
               <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Published</p>
                  <p className="text-xs font-bold text-foreground">{format(publishDate, "MMMM d, yyyy")}</p>
               </div>
               <button className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all">
                  <Share2 size={18} />
               </button>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {article.mediaUrl && (
          <div className="w-full aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-2xl mb-16 relative group">
            <img 
              src={article.mediaUrl} 
              alt={article.title || article.mediaTitle || "Article Cover"} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="card p-10 md:p-16 border-border/50 bg-secondary/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Sparkles size={100} className="text-cyan-500" />
          </div>
          
          <MarkdownRenderer content={article.content || article.aiDraft || ""} />

          <div className="mt-16 pt-12 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-3 text-emerald-400">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Content By Rhinon Engine</span>
             </div>
             <div className="flex gap-4">
                <button className="px-6 h-11 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-glow-sm">
                   Subscribe
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
