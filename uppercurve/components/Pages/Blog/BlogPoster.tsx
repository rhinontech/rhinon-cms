import React from "react";
import { BlogPost } from "./blogData";

export function BlogPoster({
  post,
  featured = false,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden h-full w-full ${post.gradient || "bg-gradient-to-br from-indigo-500 via-indigo-700 to-slate-950"}`}>
      {post.coverImage ? (
        <>
          <img
            src={post.coverImage}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </>
      ) : (
        <>
          {/* Dot grid texture */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:14px_14px] opacity-25" />
          {/* Soft light + shadow glows */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-black/40 blur-3xl" />
        </>
      )}

      {/* Poster content */}
      <div className={`relative z-10 h-full flex flex-col justify-between ${featured ? "p-8" : "p-6"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 [font-family:var(--font-montserrat)]">
            UpperCurve Blog
          </span>
          <span className="bg-white/15 border border-white/25 text-white text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            {post.category}
          </span>
        </div>

        <div>
          {/* <div
            className={`text-white font-[500] tracking-tight leading-[1.08] font-poppins ${featured ? "text-2xl sm:text-3xl md:text-4xl" : "text-xl sm:text-2xl"
              }`}
          >
            {post.title}
          </div> */}
          <div className="mt-3 text-xs font-semibold text-white/75 tracking-wide font-poppins blog-time">
            {post.dateLabel} · {post.readTime}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogPoster;
