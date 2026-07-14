import React from "react";
import { slugifyHeading } from "@/components/Common/Blog/blocks";

// Lightweight markdown renderer shared by blogs and case studies.
// Supports #/##/### headings, - / * / 1. lists, **bold**, > blockquotes,
// ``` fenced code blocks, and <br> line breaks — so pasted content never looks broken.
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Inline: split on <br>, then handle **bold** within each segment.
  const renderInline = (text: string, keyBase: string | number): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    text.split(/<br\s*\/?>/i).forEach((segment, bi) => {
      if (bi > 0) out.push(<br key={`${keyBase}-br-${bi}`} />);
      segment.split(/(\*\*.*?\*\*)/g).forEach((part, j) => {
        if (!part) return;
        if (part.startsWith("**") && part.endsWith("**")) {
          out.push(
            <strong key={`${keyBase}-b-${bi}-${j}`} className="font-black text-cyan-400">
              {part.slice(2, -2)}
            </strong>
          );
        } else {
          out.push(<React.Fragment key={`${keyBase}-t-${bi}-${j}`}>{part}</React.Fragment>);
        }
      });
    });
    return out;
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let list: React.ReactNode[] = [];
  const flushList = () => {
    if (list.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-4 my-8 ml-6 list-none">
          {list}
        </ul>
      );
      list = [];
    }
  };

  let inCode = false;
  let codeLines: string[] = [];
  const flushCode = () => {
    elements.push(
      <pre
        key={`pre-${elements.length}`}
        className="my-8 p-5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto text-sm leading-relaxed text-foreground/70 font-mono"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Fenced code block ```
    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }

    // Lists: bullets (- / *) and ordered (1.)
    const bullet = trimmed.match(/^[-*]\s+(.*)/);
    const ordered = trimmed.match(/^\d+\.\s+(.*)/);
    if (bullet || ordered) {
      const itemText = bullet ? bullet[1] : ordered![1];
      list.push(
        <li key={i} className="flex gap-4 text-foreground/80 text-lg leading-relaxed">
          <span className="text-cyan-500 font-bold shrink-0 mt-2">•</span>
          <span>{renderInline(itemText, i)}</span>
        </li>
      );
      return;
    }

    flushList();

    if (trimmed === "") {
      elements.push(<div key={i} className="h-6" />);
      return;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      elements.push(
        <blockquote key={i} className="my-6 border-l-2 border-cyan-500/40 pl-5 italic text-foreground/70 text-lg leading-relaxed">
          {renderInline(trimmed.replace(/^>\s?/, ""), i)}
        </blockquote>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-2xl font-black text-foreground mt-12 mb-6 tracking-tight">
          {renderInline(trimmed.slice(4), i)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          id={slugifyHeading(trimmed.slice(3))}
          className="text-3xl font-black text-foreground mt-16 mb-8 border-b-2 border-cyan-500/20 pb-4 tracking-tighter scroll-mt-32"
        >
          {renderInline(trimmed.slice(3), i)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-4xl md:text-5xl font-black text-foreground mt-20 mb-10 uppercase tracking-tighter leading-none">
          {renderInline(trimmed.slice(2), i)}
        </h1>
      );
    } else {
      elements.push(
        <p key={i} className="mb-6 text-lg md:text-xl text-foreground/80 leading-relaxed font-medium">
          {renderInline(line, i)}
        </p>
      );
    }
  });

  flushList();
  if (inCode) flushCode();

  return <div className="article-content">{elements}</div>;
}

export default MarkdownRenderer;
