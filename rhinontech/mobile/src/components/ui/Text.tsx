import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

const variants = {
  largeTitle: { font: "font-bold", size: "text-[28px]", leading: "leading-[34px]", extra: "tracking-tight", color: "text-foreground" },
  title: { font: "font-bold", size: "text-[22px]", leading: "leading-7", extra: "tracking-tight", color: "text-foreground" },
  heading: { font: "font-semibold", size: "text-[17px]", leading: "leading-6", extra: "", color: "text-foreground" },
  body: { font: "font-sans", size: "text-[15px]", leading: "leading-[22px]", extra: "", color: "text-foreground" },
  label: { font: "font-medium", size: "text-[13px]", leading: "leading-[18px]", extra: "", color: "text-foreground" },
  caption: { font: "font-sans", size: "text-[12px]", leading: "leading-4", extra: "", color: "text-muted-foreground" },
  overline: { font: "font-semibold", size: "text-[11px]", leading: "", extra: "uppercase tracking-[1.2px]", color: "text-muted-foreground" },
} as const;

export type TextVariant = keyof typeof variants;

/**
 * Stylesheet order, not class order, decides between two utilities of one kind:
 * `text-[15px] text-[13px]` renders at 15. So a variant steps aside for whatever
 * the caller sets. Line height also scales away from the variant's when only the
 * size is overridden, which is why it is dropped with it.
 */
function resolve(variant: TextVariant, className = ""): string {
  const v = variants[variant];
  const size = /(^|\s)text-\[/.test(className);
  return cn(
    !/(^|\s)font-(sans|medium|semibold|bold|extrabold)/.test(className) && v.font,
    !size && v.size,
    !size && !/(^|\s)leading-/.test(className) && v.leading,
    v.extra,
    !/(^|\s)text-(?!\[)/.test(className) && v.color,
    className
  );
}

export function Text({ variant = "body", className, ...props }: TextProps & { variant?: TextVariant; className?: string }) {
  return <RNText className={resolve(variant, className)} {...props} />;
}
