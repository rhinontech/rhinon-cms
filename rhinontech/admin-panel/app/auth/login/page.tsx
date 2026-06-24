import { Suspense } from "react";
import { Login } from "@/components/Auth/Login/Login";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense>
          <Login />
        </Suspense>
      </div>
    </div>
  )
}
