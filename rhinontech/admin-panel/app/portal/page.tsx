import { Suspense } from "react";
import { CollaboratorWorkspace } from "@/components/Portal/CollaboratorWorkspace";

export default function PortalPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <CollaboratorWorkspace />
    </Suspense>
  );
}
