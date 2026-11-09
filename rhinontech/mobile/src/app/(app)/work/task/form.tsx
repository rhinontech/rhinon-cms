import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { htmlToText, textToHtml } from "@/lib/format";
import { success } from "@/lib/haptics";
import type { Project, Task } from "@/lib/types";
import { Chips, DateField, FieldLabel, FormScreen, Input, PeoplePicker, Spinner } from "@/components/ui";

const PRIORITIES = ["Low", "Medium", "High"].map((p) => ({ value: p, label: p }));

/** Create a task, or edit one when `id` is passed. */
export default function TaskFormScreen() {
  const params = useLocalSearchParams<{ id?: string; projectId?: string }>();
  const { me, can } = useAuth();
  const editing = !!params.id;
  const list = useApi<Task[]>(editing ? (params.projectId ? `/tasks?scope=all&projectId=${params.projectId}` : "/tasks?scope=my") : null);
  const projects = useApi<Project[]>("/work/projects");
  const task = list.data?.find((t) => t.id === params.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [original, setOriginal] = useState("");
  const [projectId, setProjectId] = useState(params.projectId ?? "");
  const [assignee, setAssignee] = useState(me?.id ?? "");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");

  useEffect(() => {
    if (!task) return;
    const text = htmlToText(task.descriptionHtml) || task.description || "";
    setTitle(task.title);
    setDescription(text);
    setOriginal(text);
    setProjectId(task.projectId ?? "");
    setAssignee(task.assignee?.id ?? "");
    setDue(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setPriority(task.priority ?? "Medium");
  }, [task]);

  if (editing && list.loading) return <Spinner />;

  const save = async () => {
    const payload = {
      title: title.trim(),
      projectId: projectId || null,
      assigneeId: assignee || null,
      dueDate: due || null,
      priority,
      // Rewriting the description replaces its web formatting, so only touch it when it changed.
      ...(description !== original ? { description: description.trim(), descriptionHtml: textToHtml(description.trim()) } : {}),
    };
    if (editing) await api.put(`/tasks/${params.id}`, payload);
    else await api.post("/tasks", payload);
    success();
    router.back();
  };

  return (
    <FormScreen title={editing ? "Edit task" : "New task"} saveLabel={editing ? "Save" : "Create task"} onSave={save} canSave={!!title.trim()}>
      <Input label="Title" value={title} onChangeText={setTitle} autoFocus={!editing} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline tall placeholder="Optional" />
      {!!projects.data?.length && (
        <FieldLabel label="Project">
          <Chips options={[{ value: "", label: "None" }, ...projects.data.map((p) => ({ value: p.id, label: p.name }))]} value={projectId} onChange={setProjectId} />
        </FieldLabel>
      )}
      <FieldLabel label="Priority">
        <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
      </FieldLabel>
      <DateField label="Due date" value={due} onChange={setDue} />
      {can("chat:read") && (
        <FieldLabel label="Assigned to">
          <PeoplePicker selected={assignee ? [assignee] : []} onToggle={(id) => setAssignee((cur) => (cur === id ? "" : id))} />
        </FieldLabel>
      )}
    </FormScreen>
  );
}
