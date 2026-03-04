"use client";

import React from "react";
import Image from "next/image";



export default function Loading({ areaOnly = false }: { areaOnly?: boolean }) {
  // We can't enforce a 1s delay from inside this component if it's unmounted by the parent.
  // This component is purely presentational.
  // The delay logic should be in the parent component that controls the visibility (e.g., using setTimeout).
  
  return (
    <div
      className={
        areaOnly
          ? "absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-sm"
          : "fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 bg-transparent">
        <Image src="/loader.gif" alt="loading" width={150} height={150} className="rounded-md"/>
      </div>
    </div>
  );
}
