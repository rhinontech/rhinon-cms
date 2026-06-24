import { Suspense } from "react";
import { OnboardingSetup } from "@/components/Auth/Onboard/OnboardingSetup";

export default function OnboardPage() {
  return (
    <Suspense>
      <OnboardingSetup />
    </Suspense>
  );
}
