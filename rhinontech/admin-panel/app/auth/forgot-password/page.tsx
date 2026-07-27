import { Suspense } from "react";
import { ForgotPassword } from "@/components/Auth/ForgotPassword/ForgotPassword";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center app-backdrop p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense>
          <ForgotPassword />
        </Suspense>
      </div>
    </div>
  );
}
