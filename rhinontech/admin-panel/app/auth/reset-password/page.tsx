import { Suspense } from "react";
import { ResetPassword } from "@/components/Auth/ResetPassword/ResetPassword";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center app-backdrop p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense>
          <ResetPassword />
        </Suspense>
      </div>
    </div>
  );
}
