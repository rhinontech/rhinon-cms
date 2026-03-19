import Link from "next/link";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { format } from "date-fns";
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  await dbConnect();
  
  let blogs = await Blog.find({ status: "Published" }).sort({ publishedAt: -1 });

  // Fallback to seed if no blogs exist (convenience for the user)
  if (blogs.length === 0) {
     // We can't easily seed here because it's a GET request in a server component
     // But we can show a placeholder or just wait for the user to hit /api/seed-blog
  }

  return (
    <div className="relative min-h-screen bg-background selection:bg-cyan-500/30">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-24 relative">
        {/* Header Section */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Rhinon Labs Insights</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.05] tracking-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Founder's</span> Journal
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Deep dives into MVP development, AI engineering, and growth strategies for modern founders.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link 
              key={blog._id} 
              href={`/blogs/${blog.slug}`}
              className="group relative flex flex-col bg-secondary/20 backdrop-blur-md rounded-[32px] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden"
            >
              {/* Image Container */}
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={blog.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"} 
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
                
                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {blog.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {blog.readTime}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-foreground mb-4 leading-tight group-hover:text-cyan-400 transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-3 mb-8 leading-relaxed">
                  {blog.excerpt}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px]">
                      <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        <img 
                          src={blog.author?.avatar || "https://github.com/prabhatpk.png"} 
                          alt={blog.author?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{blog.author?.name}</span>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {blogs.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-muted-foreground">No blogs found. Please hit <code className="bg-secondary px-2 py-1 rounded">/api/seed-blog</code> to see content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
