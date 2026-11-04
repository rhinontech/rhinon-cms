import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { success } from "@/lib/haptics";
import type { Lead, LeadStatus } from "@/lib/types";
import { Chips, FieldLabel, FormScreen, Input, Spinner } from "@/components/ui";

const STATUSES: LeadStatus[] = ["New", "Enriched", "Enrolled", "Emailed", "Replied", "Interested", "Bounced", "Unsubscribed"];

/** Create a lead, or edit one when `id` is passed. */
export default function LeadFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: lead, loading } = useApi<Lead>(id ? `/leads/${id}` : null);
  const [f, setF] = useState({ name: "", company: "", title: "", email: "", phone: "", website: "", linkedinUrl: "", instagramUrl: "", notes: "" });
  const [status, setStatus] = useState<LeadStatus>("New");
  const set = (key: keyof typeof f) => (v: string) => setF((cur) => ({ ...cur, [key]: v }));

  useEffect(() => {
    if (!lead) return;
    setF({ name: lead.name, company: lead.company, title: lead.title ?? "", email: lead.email, phone: lead.phone ?? "", website: lead.website ?? "", linkedinUrl: lead.linkedinUrl ?? "", instagramUrl: lead.instagramUrl ?? "", notes: lead.notes ?? "" });
    setStatus(lead.status);
  }, [lead]);

  if (id && loading) return <Spinner />;

  const save = async () => {
    const payload = { name: f.name.trim(), company: f.company.trim(), email: f.email.trim(), title: f.title.trim() || null, phone: f.phone.trim() || null, website: f.website.trim() || null, linkedinUrl: f.linkedinUrl.trim() || null, instagramUrl: f.instagramUrl.trim() || null, notes: f.notes.trim() || null, status };
    if (id) await api.put(`/leads/${id}`, payload);
    else await api.post("/leads", { ...payload, source: "Mobile app" });
    success();
    router.back();
  };

  return (
    <FormScreen title={id ? "Edit lead" : "New lead"} saveLabel={id ? "Save" : "Add lead"} onSave={save} canSave={!!f.name.trim() && !!f.company.trim() && !!f.email.trim()}>
      <Input label="Name" value={f.name} onChangeText={set("name")} />
      <Input label="Company" value={f.company} onChangeText={set("company")} />
      <Input label="Email" value={f.email} onChangeText={set("email")} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
      <Input label="Job title" value={f.title} onChangeText={set("title")} placeholder="Optional" />
      <Input label="Phone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" placeholder="Optional" />
      <Input label="Website" value={f.website} onChangeText={set("website")} autoCapitalize="none" autoCorrect={false} placeholder="Optional" />
      <Input label="LinkedIn" value={f.linkedinUrl} onChangeText={set("linkedinUrl")} autoCapitalize="none" autoCorrect={false} placeholder="Optional" />
      <Input label="Instagram" value={f.instagramUrl} onChangeText={set("instagramUrl")} autoCapitalize="none" autoCorrect={false} placeholder="@name or profile link (optional)" />
      <FieldLabel label="Status">
        <Chips options={STATUSES.map((s) => ({ value: s, label: s }))} value={status} onChange={setStatus} />
      </FieldLabel>
      <Input label="Notes" value={f.notes} onChangeText={set("notes")} multiline tall placeholder="Optional" />
    </FormScreen>
  );
}
