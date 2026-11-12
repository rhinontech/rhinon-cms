import {
  BookOpen,
  Megaphone,
  Palette,
  Rocket,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "@/components/icons";
import type { WikiIcon } from "@/lib/mock-more";

/** The icon each wiki page can wear. Pages store a name; the colour comes from the page's tone. */
export const WIKI_ICON: Record<WikiIcon, LucideIcon> = {
  rocket: Rocket,
  palette: Palette,
  megaphone: Megaphone,
  users: Users,
  book: BookOpen,
  shield: ShieldCheck,
};
