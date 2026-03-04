"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type OtpInputProps = {
  length?: number
  onComplete?: (code: string) => void
  className?: string
  name?: string
  isError?: boolean
  onChange?: (code: string) => void
  value?: string // added to control from parent
}

export function OtpInput({
  length = 8,
  onComplete,
  className,
  name = "confirmation-code",
  isError = false, // added
  onChange, // added
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(() => Array(length).fill(""))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const onChangeRef = useRef(onChange)
  const onCompleteRef = useRef(onComplete)
  const submittedRef = useRef(false)

  const code = useMemo(() => values.join(""), [values])

  useEffect(() => {
    onChangeRef.current = onChange || undefined
    onCompleteRef.current = onComplete || undefined
  }, [onChange, onComplete])

  useEffect(() => {
    onChangeRef.current?.(code)
  }, [code])

  useEffect(() => {
    const isFull = code.length === length && !values.includes("")
    if (isFull && !submittedRef.current) {
      submittedRef.current = true
      onCompleteRef.current?.(code)
    }
    if (!isFull) {
      submittedRef.current = false
    }
  }, [code, length, values])

  const handleChange = (idx: number, val: string) => {
    const next = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1)
    if (!next && values[idx] === "") return

    const newValues = [...values]
    newValues[idx] = next.toUpperCase() // optional: force uppercase
    setValues(newValues)

    if (next && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault()
      inputsRef.current[idx - 1]?.focus()
    }
    if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault()
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "")
    if (!pasted) return
    e.preventDefault()

    const chars = pasted.slice(0, length).toUpperCase().split("")
    const newValues = [...values]
    for (let i = 0; i < chars.length; i++) {
      const position = idx + i
      if (position < length) newValues[position] = chars[i]
    }
    setValues(newValues)

    const nextIndex = Math.min(idx + chars.length, length - 1)
    inputsRef.current[nextIndex]?.focus()
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-3", className)}
      role="group"
      aria-label="Confirmation code inputs"
    >
      <label className="sr-only" htmlFor={`${name}-0`}>
        Enter confirmation code
      </label>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          id={`${name}-${i}`}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          autoComplete="one-time-code"
          maxLength={1}
          value={values[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          aria-invalid={isError || undefined}
          data-invalid={isError ? "true" : "false"}
          className={cn(
            "h-14 w-12 rounded-lg border bg-background text-foreground",
            "text-center text-xl font-medium tracking-widest uppercase",
            "focus-visible:outline-none focus-visible:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isError ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-ring",
          )}
        />
      ))}
    </div>
  )
}
