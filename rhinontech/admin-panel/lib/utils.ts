import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Our custom type sizes (globals.css @theme) are font sizes, not colours; without
// this, twMerge drops `text-ui` whenever a `text-foreground` sits beside it.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["2xs", "ui"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
