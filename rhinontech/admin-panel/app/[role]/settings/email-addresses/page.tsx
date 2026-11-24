import { EmailAddresses } from "@/components/Admin/People/EmailAddresses";

/** Shared mailboxes (hello@, support@), next to the email domain they send from. */
export default function SettingsEmailAddressesPage() {
  return (
    <div className="h-full overflow-hidden rounded-r-xl glass-panel">
      <EmailAddresses />
    </div>
  );
}
