"use client";

import { Suspense } from "react";
import { SettingsAccounts } from "@/components/Admin/Settings/SettingsAccounts";

export default function SettingsAccountsPage() {
  return (
    <Suspense>
      <SettingsAccounts />
    </Suspense>
  );
}
