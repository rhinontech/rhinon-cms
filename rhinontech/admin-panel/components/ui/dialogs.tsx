"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

/**
 * App-wide replacements for window.confirm / alert / prompt, rendered with the
 * shadcn AlertDialog by <DialogHost /> (mounted once in app/layout.tsx).
 *
 *   if (!(await confirmDialog("Delete this lead?"))) return;
 *   alertDialog("Saved, but the email could not be sent.");
 *   const reason = await promptDialog("Reason for rejecting");   // string | null
 *
 * A plain string works like the native call: "Title?\n\nDetails" splits into a
 * title and description. Pass an object for explicit labels / styling.
 */

export interface DialogOptions {
  title?: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  /** Red confirm button. Inferred from the wording when omitted. */
  destructive?: boolean
  /** promptDialog only */
  defaultValue?: string
  placeholder?: string
}

type Kind = "confirm" | "alert" | "prompt"
type Request = { id: number; kind: Kind; options: DialogOptions; resolve: (v: unknown) => void }

let nextId = 0
let queue: Request[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const DESTRUCTIVE = /\b(delete|remove|revoke|discard|reject|cancel|offboard|archive|deactivate|disconnect|unpublish|withdraw|wipe|reset|deploy production|overwrite|clear)\b/i

function normalize(input: string | DialogOptions, kind: Kind): DialogOptions {
  if (typeof input !== "string") return input
  const text = input.trim()
  const split = text.indexOf("\n\n")
  const [title, description] = split > 0 ? [text.slice(0, split), text.slice(split + 2)] : [text, undefined]
  // Long single-paragraph messages read better as a description under a short title
  if (!description && title.length > 90) {
    return { title: kind === "alert" ? "Notice" : "Are you sure?", description: title }
  }
  return { title, description }
}

function open<T>(kind: Kind, input: string | DialogOptions): Promise<T> {
  // During SSR there is no host — mirror the native "cancel" result
  if (typeof window === "undefined") return Promise.resolve((kind === "confirm" ? false : kind === "prompt" ? null : undefined) as T)
  return new Promise<T>((resolve) => {
    queue = [...queue, { id: ++nextId, kind, options: normalize(input, kind), resolve: resolve as (v: unknown) => void }]
    emit()
  })
}

export const confirmDialog = (input: string | DialogOptions) => open<boolean>("confirm", input)
export const alertDialog = (input: string | DialogOptions) => open<void>("alert", input)
export const promptDialog = (input: string | DialogOptions, defaultValue?: string) =>
  open<string | null>("prompt", typeof input === "string" ? { ...normalize(input, "prompt"), defaultValue } : { defaultValue, ...input })

function useQueue() {
  return React.useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => queue,
    () => queue,
  )
}

export function DialogHost() {
  const items = useQueue()
  const current = items[0]
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    if (current?.kind === "prompt") setValue(current.options.defaultValue ?? "")
  }, [current])

  if (!current) return null
  const { kind, options } = current
  const destructive = options.destructive ?? (kind === "confirm" && DESTRUCTIVE.test(`${options.title ?? ""} ${typeof options.description === "string" ? options.description : ""}`))

  const finish = (result: unknown) => {
    queue = queue.filter((q) => q.id !== current.id)
    emit()
    current.resolve(result)
  }
  const cancelResult = kind === "confirm" ? false : kind === "prompt" ? null : undefined
  const confirmLabel = options.confirmText ?? (kind === "alert" ? "OK" : kind === "prompt" ? "Submit" : destructive ? "Confirm" : "Continue")

  return (
    <AlertDialog open onOpenChange={(o) => { if (!o) finish(cancelResult) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="whitespace-pre-line">{options.title}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription className="whitespace-pre-line">{options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {kind === "prompt" && (
          <Input
            autoFocus
            value={value}
            placeholder={options.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); finish(value) } }}
          />
        )}
        <AlertDialogFooter>
          {kind !== "alert" && (
            <AlertDialogCancel onClick={() => finish(cancelResult)}>{options.cancelText ?? "Cancel"}</AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={() => finish(kind === "confirm" ? true : kind === "prompt" ? value : undefined)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
