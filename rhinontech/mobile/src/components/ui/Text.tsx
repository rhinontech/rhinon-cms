import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

const variants = {
  largeTitle: "font-bold text-[32px] leading-[38px] tracking-tight text-foreground",
  title: "font-semibold text-[22px] leading-7 tracking-tight text-foreground",
  heading: "font-semibold text-[17px] leading-6 text-foreground",
  body: "font-sans text-[15px] leading-[22px] text-foreground",
  label: "font-medium text-[13px] leading-[18px] text-foreground",
  caption: "font-sans text-[12px] leading-4 text-muted-foreground",
  overline: "font-semibold text-[11px] uppercase tracking-[1.2px] text-muted-foreground",
} as const;

export type TextVariant = keyof typeof variants;

export function Text({ variant = "body", className, ...props }: TextProps & { variant?: TextVariant; className?: string }) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}
