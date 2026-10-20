"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Slider as SliderPrimitive } from "radix-ui"

// Thin electric track on dark; ring-outlined thumb that swells while dragged.
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex h-[26px] w-full touch-none items-center select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-0.5 grow overflow-hidden rounded-full bg-paper-2/18"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-electric" />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-[22px] shrink-0 rounded-full border-[6px] border-ink bg-electric shadow-[0_0_0_1px_var(--color-electric)] transition-transform duration-250 ease-expo outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-electric active:scale-118"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
