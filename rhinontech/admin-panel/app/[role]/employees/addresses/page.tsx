import { redirect } from "next/navigation";

/** Shared mailboxes moved to Settings → Email addresses; old links land there. */
export default async function EmailAddressesMovedPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/settings/email-addresses`);
}
