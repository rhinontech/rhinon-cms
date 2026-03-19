import { notFound } from "next/navigation";
import { Metadata } from "next";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
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
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) return { title: "Blog Not Found" };

  return {
    title: `${blog.title} | Rhinon Labs`,
    description: blog.excerpt,
    openGraph: {
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  };
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  const processInlines = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
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
        <ul key={`list-${renderedElements.length}`} className="space-y-4 my-8 ml-6 list-none">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      const content = trimmedLine.replace(/^[\*\-]\s+/, "");
      currentList.push(
        <li key={i} className="flex gap-4 text-foreground/80 text-lg leading-relaxed">
          <span className="text-cyan-500 font-bold shrink-0 mt-2">•</span>
          <span>{processInlines(content)}</span>
        </li>
      );
      return;
    }

    flushList();

    if (trimmedLine === "") {
       renderedElements.push(<div key={i} className="h-6" />);
       return;
    }

    if (trimmedLine.startsWith("### ")) {
      renderedElements.push(<h3 key={i} className="text-2xl font-black text-foreground mt-12 mb-6 tracking-tight">{trimmedLine.replace("### ", "")}</h3>);
    } else if (trimmedLine.startsWith("## ")) {
      renderedElements.push(<h2 key={i} className="text-3xl font-black text-foreground mt-16 mb-8 border-b-2 border-cyan-500/20 pb-4 tracking-tighter">{trimmedLine.replace("## ", "")}</h2>);
    } else if (trimmedLine.startsWith("# ")) {
      renderedElements.push(<h1 key={i} className="text-4xl md:text-5xl font-black text-foreground mt-20 mb-10 uppercase tracking-tighter leading-none">{trimmedLine.replace("# ", "")}</h1>);
    } else {
      renderedElements.push(<p key={i} className="mb-6 text-lg md:text-xl text-foreground/80 leading-relaxed font-medium">{processInlines(line)}</p>);
    }
  });

  flushList();

  return (
    <div className="article-content">
      {renderedElements}
    </div>
  );
};

export default async function BlogDetailsPage({ params }: PageProps) {
  await dbConnect();
  const { slug } = await params;
  
  const blog = await Blog.findOne({ slug });

  if (!blog) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-background selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[0%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative">
        {/* Navigation */}
        <Link 
          href="/blogs" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-cyan-400 transition-colors mb-16 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Journal
        </Link>

        {/* Article Header */}
        <div className="space-y-10 mb-20">
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Exclusive Insight</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-[0.15em]">
                <Clock size={14} /> {blog.readTime}
             </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
            {blog.title}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
            {blog.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-8 pt-10 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px] shadow-glow-sm">
                 <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    <img src={blog.author?.avatar} alt={blog.author?.name} className="w-full h-full object-cover" />
                 </div>
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1.5">{blog.author?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Founder @ Rhinon Labs</p>
              </div>
            </div>

            <div className="flex items-center gap-8 ml-auto">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Published</p>
                  <p className="text-xs font-bold text-foreground">{format(new Date(blog.publishedAt), "MMMM d, yyyy")}</p>
               </div>
               <button className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-cyan-500 hover:text-black transition-all group shadow-sm">
                  <Share2 size={20} className="group-hover:scale-110 transition-transform" />
               </button>
            </div>
          </div>
        </div>

        {/* Feature Image */}
        {blog.coverImage && (
          <div className="w-full aspect-video rounded-[40px] overflow-hidden border border-white/5 shadow-2xl mb-24 relative group">
            <img 
              src={blog.coverImage} 
              alt={blog.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        )}

        {/* Content Body */}
        <div className="relative group">
          <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-blue-500/20 to-transparent hidden lg:block" />
          
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={blog.content} />
          </div>

          {/* Social Tags */}
          <div className="mt-20 flex flex-wrap gap-3">
            {blog.tags?.map((tag: string) => (
              <span key={tag} className="px-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-bold text-muted-foreground hover:border-cyan-500/30 transition-colors cursor-default">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[32px] bg-secondary/20 border border-white/5 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="absolute top-0 left-0 p-8 opacity-[0.03] pointer-events-none">
               <Sparkles size={200} className="text-cyan-500" />
             </div>
             
             <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center gap-3 text-emerald-400 justify-center md:justify-start">
                  <ShieldCheck size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Authentic content</span>
               </div>
               <p className="text-xl font-black text-foreground">Stay ahead of the tech curve.</p>
             </div>

             <div className="flex gap-4">
                <button className="px-10 h-14 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-glow hover:translate-y-[-2px]">
                   Join 5,000+ Founders
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
