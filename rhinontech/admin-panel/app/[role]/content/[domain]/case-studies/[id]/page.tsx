"use client";

import { useParams } from "next/navigation";
import { CaseStudyEditorPage } from "@/components/Admin/Content/CaseStudyEditor/CaseStudyEditorPage";

export default function EditCaseStudyRoute() {
  const params = useParams();
  return <CaseStudyEditorPage id={params.id as string} />;
}
