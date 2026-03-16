"use client";

import React, { useEffect, useState, use } from "react";
import { LibraryEditor } from "@/views/Library/LibraryEditor";
import { Loader2 } from "lucide-react";

export default function EditLibraryAssetPage({ params }: { params: Promise<{ role: string, id: string, type: string }> }) {
  const { role, id, type } = use(params);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        setAsset(data);
      } catch (error) {
        console.error("Error fetching library asset:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return <LibraryEditor asset={asset} />;
}
