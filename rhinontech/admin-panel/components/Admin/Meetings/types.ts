export interface MeetingEvent {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  organizer: string | null;
  attendees: { email: string; responseStatus: string | null }[];
  status: string | null;
}

/** `datetime-local` inputs speak local wall-clock time, so convert through the local zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTimeRange(event: MeetingEvent): string {
  if (event.allDay) return "All day";
  if (!event.start) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(event.start).toLocaleTimeString(undefined, opts);
  if (!event.end) return start;
  return `${start} – ${new Date(event.end).toLocaleTimeString(undefined, opts)}`;
}
