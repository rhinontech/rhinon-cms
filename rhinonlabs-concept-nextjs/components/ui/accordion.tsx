"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Accordion as AccordionPrimitive } from "radix-ui"

// Hairline-ruled list; a plus that folds into a minus when open.
function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-t border-ink/16 last:border-b", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header asChild>
      <h3>
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "group/trigger grid w-full items-center gap-3 text-left outline-none disabled:pointer-events-none disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
          <span aria-hidden="true" className="relative size-3.5 justify-self-end">
            <span className="absolute top-[calc(50%-0.75px)] left-0 h-[1.5px] w-full bg-current" />
            <span className="absolute top-[calc(50%-0.75px)] left-0 h-[1.5px] w-full rotate-90 bg-current transition-transform duration-500 ease-io group-data-[state=open]/trigger:rotate-0" />
          </span>
        </AccordionPrimitive.Trigger>
      </h3>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden duration-600 ease-io data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={className}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
