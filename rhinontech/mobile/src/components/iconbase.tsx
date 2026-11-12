import type { LucideIcon as L } from "lucide-react-native";
import type { ComponentType } from "react";

import { tw } from "@/lib/tw";
import { useEnv, useInherit } from "./rn";

export type IconProps = { size?: number; strokeWidth?: number; className?: string | undefined; style?: object; color?: string; fill?: string; absoluteStrokeWidth?: boolean };
export type LucideIcon = ComponentType<IconProps>;

/** A lucide icon that reads its colour from the surrounding text (CSS currentColor) and takes Tailwind classes. */
export function withIcon(Icon: L): LucideIcon {
  function Wrapped({ size = 24, strokeWidth = 2, className, style, color, fill }: IconProps) {
    const env = useEnv();
    const inherited = useInherit();
    const p = tw(className, env);
    const col = color ?? p.inherit.color ?? inherited.color ?? env.c.ink;
    return <Icon size={size} strokeWidth={strokeWidth} color={col} fill={fill ?? p.meta.fill ?? "none"} style={[{ flexShrink: 0 }, p.style, style] as never} />;
  }
  Wrapped.displayName = `Icon(${Icon.displayName ?? "lucide"})`;
  return Wrapped;
}
