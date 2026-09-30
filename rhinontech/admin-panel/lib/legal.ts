"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

/** Where the legal documents live, and which version of the terms is current. */
export interface LegalInfo {
  termsVersion: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  dpaUrl: string | null;
  acceptanceRequired: boolean;
}

// Public and identical for everyone, so one fetch is shared by every caller on the page.
let cache: LegalInfo | null = null;
let inFlight: Promise<LegalInfo | null> | null = null;

function load(): Promise<LegalInfo | null> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = fetch(`${API_URL}/public/legal`)
      .then((res) => (res.ok ? (res.json() as Promise<LegalInfo>) : null))
      .then((data) => {
        cache = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useLegal(): LegalInfo | null {
  const [legal, setLegal] = useState<LegalInfo | null>(cache);
  useEffect(() => {
    let active = true;
    load().then((data) => active && setLegal(data));
    return () => {
      active = false;
    };
  }, []);
  return legal;
}
