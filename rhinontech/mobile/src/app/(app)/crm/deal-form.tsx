import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { success } from "@/lib/haptics";
import type { Deal, PipelineStage } from "@/lib/types";
import { Chips, DateField, FieldLabel, FormScreen, Input, Spinner } from "@/components/ui";

/** Create a deal, or edit one when `id` is passed. Picking a stage is how a deal moves. */
export default function DealFormScreen() {
  const { id, primaryLeadId } = useLocalSearchParams<{ id?: string; primaryLeadId?: string }>();
  const { data: deal, loading } = useApi<Deal>(id ? `/deals/${id}` : null);
  const stages = useApi<PipelineStage[]>("/deals/stages");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState("");
  const [close, setClose] = useState("");
  const [lostReason, setLostReason] = useState("");
  const chosen = stages.data?.find((s) => s.id === stageId);

  useEffect(() => {
    if (!deal) return;
    setTitle(deal.title);
    setValue(String(Number(deal.value) || ""));
    setStageId(deal.stageId ?? "");
    setClose(deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : "");
  }, [deal]);

  if (id && loading) return <Spinner />;

  const save = async () => {
    const amount = Number(value.replace(/,/g, "") || 0);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid amount.");
    const payload = {
      title: title.trim(),
      value: amount,
      expectedCloseDate: close || null,
      ...(stageId ? { stageId } : {}),
      ...(chosen?.type === "Lost" && lostReason.trim() ? { lostReason: lostReason.trim() } : {}),
    };
    if (id) await api.put(`/deals/${id}`, payload);
    else await api.post("/deals", { ...payload, ...(primaryLeadId ? { primaryLeadId } : {}) });
    success();
    router.back();
  };

  return (
    <FormScreen title={id ? "Edit deal" : "New deal"} saveLabel={id ? "Save" : "Add deal"} onSave={save} canSave={!!title.trim()}>
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input label="Value (₹)" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="0" />
      {!!stages.data?.length && (
        <FieldLabel label="Stage">
          <Chips options={stages.data.map((s) => ({ value: s.id, label: s.name }))} value={stageId} onChange={setStageId} />
        </FieldLabel>
      )}
      {chosen?.type === "Lost" && <Input label="Why was it lost?" value={lostReason} onChangeText={setLostReason} placeholder="Optional" />}
      <DateField label="Expected close" value={close} onChange={setClose} />
    </FormScreen>
  );
}
