import { Suspense } from "react";
import { SignDocuments } from "@/components/Auth/SignDocuments/SignDocuments";

export default function SignDocumentsPage() {
  return (
    <Suspense>
      <SignDocuments />
    </Suspense>
  );
}
