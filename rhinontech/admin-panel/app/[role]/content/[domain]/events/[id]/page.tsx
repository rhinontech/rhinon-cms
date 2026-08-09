"use client";

import { BlogEditorPage } from "@/components/Admin/Content/BlogEditor/BlogEditorPage";
import { useParams } from "next/navigation";

export default function EditEventRoute() {
  const params = useParams();
  return <BlogEditorPage id={params.id as string} resource="events" />;
}
