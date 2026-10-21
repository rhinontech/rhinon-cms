"use client";

import { confirmDialog } from "@/components/ui/dialogs";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in red for deletes/resets. */
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

/**
 * Promise-based confirmation dialog — kept for existing call sites; it now
 * delegates to the app-wide confirmDialog (components/ui/dialogs.tsx), so every
 * confirmation in the admin panel shares one dialog.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete campaign?", destructive: true })) { … }
 */
const confirm: Confirm = ({ title, description, confirmLabel, cancelLabel, destructive }) =>
  confirmDialog({
    title,
    description,
    confirmText: confirmLabel ?? "Confirm",
    cancelText: cancelLabel,
    destructive: destructive ?? false,
  });

/** No longer needed (the host lives in app/layout.tsx); kept so existing wrappers still render. */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useConfirm(): Confirm {
  return confirm;
}
