import { apiDownload, apiFetch } from "@/lib/api";
import type { IEvent } from "../types";

/* ------------------------------------------------------------------ types */

export type GuestStatus = "Approved" | "Waitlist" | "Declined";

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  role: string | null;
  userType: string | null;
  guestType: GuestStatus;
  graduationYear: string | null;
  collegeName: string | null;
  referralCode: string | null;
  ownReferralCode: string | null;
  feedbackData: Record<string, unknown> | null;
  feedbackSubmittedAt: string | null;
  certificateApproved: boolean;
  certificateGenerated: boolean;
  certificateId: string | null;
  certificateGeneratedAt: string | null;
  additionalData: Record<string, unknown> | null;
  createdAt: string;
}

export type ReminderStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type TargetType = "All" | "Approved" | "Waitlist" | "Declined";
export type TargetRole = "All" | "Professional" | "Student";

export interface ReminderTemplate {
  id: string;
  eventId: string;
  templateName: string;
  subject: string;
  body: string;
  targetGuestType: TargetType;
  targetGuestRole: TargetRole;
  status: ReminderStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveredTo: string[];
  failedRecipients: string[];
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentType =
  | "Pending"
  | "Approved"
  | "Declined"
  | "Registered"
  | "Registered_Student"
  | "Registered_Professional";

export interface EnrollmentTemplate {
  id: string;
  type: EnrollmentType;
  subject: string | null;
  body: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  updatedAt: string;
}

export interface CertificateField {
  id: "name" | "date" | "certificateId";
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
}

export interface CertificateTemplate {
  id: string;
  certificateName: string;
  imageSize: { width: number; height: number };
  fields: CertificateField[];
  templateImage: string;
  emailSubject: string | null;
  emailBody: string | null;
}

export interface ReferralRow {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  type: string;
  guestType: GuestStatus | null;
  referralCode: string;
  memberCount: number;
  approvedCount: number;
  waitlistCount: number;
}

export interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: string | null;
  guestType: GuestStatus;
  createdAt: string;
}

/* ------------------------------------------------------------------ calls */

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export interface SenderOption { localPart: string; address: string; label: string; name: string | null }
export interface EventSender {
  localPart: string | null;
  name: string | null;
  /** What guests see right now, on this event's brand domain. */
  current: { address: string | null; name: string | null };
  options: SenderOption[];
}

export const eventsApi = {
  sender: (eventId: string) => apiFetch<EventSender>(`/events/${eventId}/email/sender`),
  setSender: (eventId: string, localPart: string | null, name: string | null) =>
    apiFetch<{ current: EventSender["current"] }>(`/events/${eventId}/email/sender`, json("PUT", { localPart, name })),
  list: () => apiFetch<{ events: IEvent[] }>(`/events`).then((r) => r.events ?? []),
  event: (id: string) => apiFetch<{ event: IEvent }>(`/events/${id}`).then((r) => r.event),
  update: (id: string, body: Partial<IEvent>) => apiFetch(`/events/${id}`, json("PUT", body)),
  publish: (id: string, isPublished: boolean) => apiFetch(`/events/${id}/publish`, json("POST", { isPublished })),
  toggleResponses: (id: string, canAcceptResponse: boolean) =>
    apiFetch(`/events/${id}/toggle-response`, json("PATCH", { canAcceptResponse })),
  duplicate: (id: string, body: Record<string, unknown>) =>
    apiFetch<{ newEvent: IEvent; copied: { enrollmentEmails: number; certificateTemplate: boolean } }>(
      `/events/${id}/duplicate`,
      json("POST", body)
    ),
  remove: (id: string) => apiFetch(`/events/${id}`, { method: "DELETE" }),

  guests: (eventId: string) =>
    apiFetch<{ registrations: Guest[] }>(`/events/guests/by-id`, json("POST", { eventId })).then((r) => r.registrations ?? []),
  setStatus: (eventId: string, userIds: string[], status: GuestStatus, notify = true) =>
    apiFetch<{ updated: number; emailed: number }>(`/events/approve-guests`, json("POST", { eventId, userIds, status, notify })),
  notify: (eventId: string, userIds: string[], type: EnrollmentType) =>
    apiFetch<{ sent: number; skipped: string[] }>(`/events/send-notification`, json("POST", { eventId, userIds, type })),

  referrals: (eventId: string) =>
    apiFetch<{ data: ReferralRow[] }>(`/events/referrals/with-referees?eventId=${eventId}`).then((r) => r.data ?? []),
  referees: (eventId: string, referralCode: string) =>
    apiFetch<{ referrer: { name: string; email: string } | null; referredMembers: Referee[] }>(
      `/events/referrals/by-code`,
      json("POST", { eventId, referralCode })
    ),

  reminders: (eventId: string) =>
    apiFetch<{ templates: ReminderTemplate[] }>(`/events/${eventId}/email/templates`).then((r) => r.templates ?? []),
  audience: (eventId: string) =>
    apiFetch<{ breakdown: { guestType: GuestStatus; userType: string | null; count: string | number }[] }>(
      `/events/${eventId}/email/audience`
    ).then((r) => r.breakdown ?? []),
  createReminder: (eventId: string, body: Partial<ReminderTemplate>) =>
    apiFetch<{ template: ReminderTemplate }>(`/events/${eventId}/email/template`, json("POST", body)).then((r) => r.template),
  updateReminder: (id: string, body: Partial<ReminderTemplate>) =>
    apiFetch<{ template: ReminderTemplate }>(`/events/email/template/${id}`, json("PUT", body)).then((r) => r.template),
  deleteReminder: (id: string) => apiFetch(`/events/email/template/${id}`, { method: "DELETE" }),
  scheduleReminder: (id: string, scheduledAt: string) =>
    apiFetch<{ template: ReminderTemplate }>(`/events/email/template/${id}/schedule`, json("POST", { scheduledAt })),
  cancelReminder: (id: string) => apiFetch(`/events/email/template/${id}/cancel`, json("POST", {})),
  testReminder: (id: string, email: string, name?: string) =>
    apiFetch(`/events/email/template/${id}/test`, json("POST", { email, name })),
  sendReminderNow: (id: string) =>
    apiFetch<{ sent: number; totalGuests: number; failedEmails: string[] }>(
      `/events/email/template/sendEmailNow`,
      json("POST", { templateId: id })
    ),

  enrollment: (eventId: string) =>
    apiFetch<{ templates: EnrollmentTemplate[] }>(`/events/${eventId}/enrollment-emails`).then((r) => r.templates ?? []),
  saveEnrollment: (eventId: string, type: EnrollmentType, body: Partial<EnrollmentTemplate>) =>
    apiFetch<{ template: EnrollmentTemplate }>(`/events/${eventId}/enrollment-emails/${type}`, json("PUT", body)),
  deleteEnrollment: (eventId: string, type: EnrollmentType) =>
    apiFetch(`/events/${eventId}/enrollment-emails/${type}`, { method: "DELETE" }),
  testEnrollment: (eventId: string, type: EnrollmentType, email: string) =>
    apiFetch(`/events/${eventId}/enrollment-emails/${type}/test`, json("POST", { email })),

  certificate: (eventId: string) =>
    apiFetch<{ data: CertificateTemplate | null }>(`/events/certificate/${eventId}`).then((r) => r.data),
  saveCertificate: (eventId: string, body: Omit<CertificateTemplate, "id" | "emailSubject" | "emailBody">) =>
    apiFetch<{ data: CertificateTemplate }>(`/events/certificate/save`, json("POST", { eventId, ...body })).then((r) => r.data),
  previewCertificate: (eventId: string, name?: string) =>
    apiFetch<{ image: string }>(`/events/certificate/preview`, json("POST", { eventId, name })).then((r) => r.image),
  saveCertificateEmail: (eventId: string, emailSubject: string, emailBody: string) =>
    apiFetch(`/events/certificate/save-email-template`, json("POST", { eventId, emailSubject, emailBody })),
  testCertificateEmail: (eventId: string, email: string) =>
    apiFetch(`/events/send-certificate-test-email`, json("POST", { eventId, email })),
  approveCertificate: (guestId: string) =>
    apiFetch<{ message: string }>(`/events/certificate/approve`, json("PUT", { guestId })),
  bulkApproveCertificates: (eventId: string) =>
    apiFetch<{ stats: { considered: number; approved: number; skipped: number } }>(
      `/events/certificate/bulk-approve`,
      json("PUT", { eventId })
    ),
  issueCertificate: (guestId: string) =>
    apiFetch<{ data: { certificateId: string; certificateUrl: string } }>(`/events/certificate/generate`, json("POST", { guestId })),
  bulkIssueCertificates: (eventId: string) =>
    apiFetch<{ issued: number; failed: { name: string; error: string }[]; remaining: number }>(
      `/events/certificate/bulk-generate`,
      json("POST", { eventId })
    ),
  certificateUrl: (guestId: string) =>
    apiFetch<{ certificateUrl: string }>(`/events/certificate/download-url`, json("POST", { guestId })).then((r) => r.certificateUrl),

  feedback: (eventId: string) => apiFetch<{ data: Guest[] }>(`/events/feedback/${eventId}`).then((r) => r.data ?? []),
  exportFeedback: (eventId: string, slug: string) => apiDownload(`/events/feedback/${eventId}/export`, `${slug}-feedback.csv`),
};
