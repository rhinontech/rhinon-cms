import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Rhinon pill buttons. Pair with <RollLabel> for the label roll-up on hover
// and <ButtonArrow> for the trailing arrow that turns on hover.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-3.5 rounded-full whitespace-nowrap font-display font-bold uppercase leading-none tracking-[0.01em] [font-stretch:106%] transition-[background-color,color,box-shadow,transform] duration-350 outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-navy text-white hover:bg-navy-2",
        electric: "bg-electric text-white",
        light: "bg-paper-2 text-ink",
        ghost: "shadow-[inset_0_0_0_1px_currentColor] hover:shadow-[inset_0_0_0_1.5px_currentColor]",
        "ghost-light": "text-paper-2 shadow-[inset_0_0_0_1px_rgb(245_245_242/0.4)]",
      },
      size: {
        default: "h-14 px-[26px] text-[13px] max-sm:h-[52px] max-sm:px-5",
        sm: "h-[38px] px-4 text-[11px] max-sm:h-[52px] max-sm:px-5",
        lg: "h-16 px-[30px] text-sm max-sm:h-14 max-sm:px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/** Trailing circular arrow; rotates to point up-right on hover. */
function ButtonArrow({ tone = "dark" }: { tone?: "dark" | "light" | "outline" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "-mr-3 grid size-7 place-items-center rounded-full font-sans text-sm transition-transform duration-500 ease-io group-hover/button:-rotate-45",
        tone === "dark" && "bg-white/16",
        tone === "light" && "bg-ink/9",
        tone === "outline" && "shadow-[inset_0_0_0_1px_currentColor]"
      )}
    >
      →
    </span>
  )
}

export { Button, ButtonArrow, buttonVariants }
