import { Metadata } from "next";
import { Suspense } from "react";
import UnsubscribeForm from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe | Rhinon Labs",
  description: "Manage your email preferences and unsubscribe from Rhinon Labs communications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
          <div className="flex items-center space-x-3 text-neutral-400">
            <div className="w-5 h-5 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <UnsubscribeForm />
    </Suspense>
  );
}
