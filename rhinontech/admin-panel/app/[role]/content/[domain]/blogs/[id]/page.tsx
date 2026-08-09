"use client";

import { BlogEditorPage } from "@/components/Admin/Content/BlogEditor/BlogEditorPage";
import { useParams } from "next/navigation";

export default function EditBlogRoute() {
  const params = useParams();
  return <BlogEditorPage id={params.id as string} />;
}
