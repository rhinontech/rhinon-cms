"use client";

import { useParams } from "next/navigation";
import { PageEditor } from "@/components/Admin/Pages/PageEditor";

export default function PageEditorRoute() {
  const params = useParams();
  return <PageEditor id={params.id as string} />;
}
