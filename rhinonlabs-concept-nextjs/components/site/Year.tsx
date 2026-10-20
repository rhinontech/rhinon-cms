"use client";

import { useEffect, useState } from "react";

/** Current year, read after mount so the prerendered page never goes stale. */
export default function Year() {
  const [year, setYear] = useState<number>();
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
