"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Drop-in replacement for a native <select>, rendered with the shadcn Select.
 *
 * Takes the same <option>/<optgroup> children and calls onChange with an
 * event-shaped `{ target: { value } }`, so existing call sites only swap the
 * tag name. Radix Select can't hold an empty-string value, so "" options (the
 * usual "Select…" / "None" entries) are mapped to a sentinel and back.
 */

const EMPTY = "__empty__"

type OptionItem = { kind: "option"; value: string; label: React.ReactNode; text: string; disabled?: boolean }
type GroupItem = { kind: "group"; label: string; options: OptionItem[] }
type Item = OptionItem | GroupItem

const toKey = (v: unknown) => (v === "" || v === undefined || v === null ? EMPTY : String(v))
const fromKey = (k: string) => (k === EMPTY ? "" : k)

function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children)
  return ""
}

function collect(children: React.ReactNode, out: Item[] = []): Item[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { value?: unknown; children?: React.ReactNode; disabled?: boolean; label?: string }
    if (child.type === React.Fragment) {
      collect(props.children, out)
    } else if (child.type === "option") {
      const label = props.children
      out.push({
        kind: "option",
        value: toKey(props.value ?? textOf(label)),
        label,
        text: textOf(label),
        disabled: props.disabled,
      })
    } else if (child.type === "optgroup") {
      out.push({
        kind: "group",
        label: props.label ?? "",
        options: collect(props.children).filter((i): i is OptionItem => i.kind === "option"),
      })
    }
  })
  return out
}

export type NativeSelectChangeEvent = {
  target: { value: string; name?: string }
  currentTarget: { value: string; name?: string }
  // No-ops so handlers written for the DOM event keep compiling
  stopPropagation: () => void
  preventDefault: () => void
}

export interface NativeSelectProps {
  value?: string | number | null
  defaultValue?: string | number
  onChange?: (e: NativeSelectChangeEvent) => void
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  title?: string
  placeholder?: string
  size?: "sm" | "default"
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  "aria-label"?: string
}

/**
 * The shadcn trigger pins its height via `data-[size=default]:h-9`, which beats a
 * plain `h-7` from the call site. Mirror any explicit height into that variant;
 * with no explicit height, let the call site's padding decide (like a native select).
 */
function triggerClasses(className?: string) {
  if (!className) return ""
  const cleaned = className.replace(/(^|\s)(appearance-none|pr-8|pr-9|pr-10)(?=\s|$)/g, " ")
  const heights = cleaned.match(/(^|\s)(?:sm:|md:|lg:)?h-[^\s]+/g)?.map((h) => h.trim()) ?? []
  if (heights.length === 0) return `${cleaned} data-[size=default]:h-auto`
  return `${cleaned} ${heights.map((h) => (h.includes(":") ? h.replace(":", ":data-[size=default]:") : `data-[size=default]:${h}`)).join(" ")}`
}

export function NativeSelect({
  value,
  defaultValue,
  onChange,
  children,
  className,
  contentClassName,
  disabled,
  required,
  name,
  id,
  title,
  placeholder,
  size,
  onClick,
  "aria-label": ariaLabel,
}: NativeSelectProps) {
  const items = React.useMemo(() => collect(children), [children])
  const controlled = value !== undefined

  const handleChange = (key: string) => {
    const v = fromKey(key)
    onChange?.({ target: { value: v, name }, currentTarget: { value: v, name }, stopPropagation() {}, preventDefault() {} })
  }

  const option = (o: OptionItem) => (
    <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </SelectItem>
  )

  return (
    <Select
      value={controlled ? toKey(value) : undefined}
      defaultValue={!controlled && defaultValue !== undefined ? toKey(defaultValue) : undefined}
      onValueChange={handleChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectTrigger
        id={id}
        title={title}
        size={size}
        aria-label={ariaLabel}
        onClick={onClick}
        // Native-select call sites style the control itself; keep their sizing,
        // drop classes that only made sense for the browser's own widget.
        className={cn(triggerClasses(className))}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/* Portal content still bubbles React events to the call site's parents —
          stop clicks so picking an option never triggers a surrounding row's onClick */}
      <SelectContent
        className={cn("max-h-72", contentClassName)}
        position="popper"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, i) =>
          item.kind === "group" ? (
            <React.Fragment key={`g-${i}`}>
              {i > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{item.label}</SelectLabel>
                {item.options.map(option)}
              </SelectGroup>
            </React.Fragment>
          ) : (
            option(item)
          ),
        )}
      </SelectContent>
    </Select>
  )
}
