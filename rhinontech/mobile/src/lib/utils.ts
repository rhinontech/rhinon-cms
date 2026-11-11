export type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, unknown>;

/** clsx without the dependency. Later classes win because the class engine applies them in order. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return;
    if (typeof v === "string" || typeof v === "number") out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") for (const k in v) if (v[k]) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(" ");
}
