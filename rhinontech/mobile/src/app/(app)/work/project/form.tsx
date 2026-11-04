import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { success } from "@/lib/haptics";
import type { Project, Team } from "@/lib/types";
import { Chips, FieldLabel, FormScreen, Input, Spinner } from "@/components/ui";

const STATUSES = ["Active", "Pipeline", "Paused", "Completed"].map((s) => ({ value: s, label: s }));
const VISIBILITY = [
  { value: "workspace", label: "Everyone" },
  { value: "team", label: "One team" },
  { value: "private", label: "Only me" },
];

/** Create a project, or edit one when `id` is passed. */
export default function ProjectFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const list = useApi<Project[]>(id ? "/work/projects" : null);
  const teams = useApi<Team[]>("/teams");
  const project = list.data?.find((p) => p.id === id);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [visibility, setVisibility] = useState("workspace");
  const [teamId, setTeamId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setStatus(project.status ?? "Active");
    setVisibility(project.visibility ?? "workspace");
    setTeamId(project.teamId ?? "");
    setNotes(project.notes ?? "");
  }, [project]);

  if (id && list.loading) return <Spinner />;

  const save = async () => {
    const payload = { name: name.trim(), status, visibility, teamId: visibility === "team" ? teamId : null, notes: notes.trim() };
    if (id) await api.put(`/work/projects/${id}`, payload);
    else await api.post("/work/projects", payload);
    success();
    router.back();
  };

  return (
    <FormScreen title={id ? "Edit project" : "New project"} saveLabel={id ? "Save" : "Create project"} onSave={save} canSave={!!name.trim() && (visibility !== "team" || !!teamId)}>
      <Input label="Name" value={name} onChangeText={setName} autoFocus={!id} />
      <FieldLabel label="Status">
        <Chips options={STATUSES} value={status} onChange={setStatus} />
      </FieldLabel>
      <FieldLabel label="Who can see it">
        <Chips options={VISIBILITY} value={visibility} onChange={setVisibility} />
      </FieldLabel>
      {visibility === "team" && (
        <FieldLabel label="Team">
          <Chips options={(teams.data ?? []).map((t) => ({ value: t.id, label: t.name }))} value={teamId} onChange={setTeamId} />
        </FieldLabel>
      )}
      <Input label="Notes" value={notes} onChangeText={setNotes} multiline tall placeholder="Optional" />
    </FormScreen>
  );
}
