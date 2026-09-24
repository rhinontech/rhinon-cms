import { apiFetch, apiUpload } from "@/lib/api";

export interface IEventGuest {
  eventId: string;
}

export interface IEventGuestStatus {
  userIds: (number | string)[];
  status: string;
  eventId: number | string;
}

export interface IEmailNotification {
  type: string;
  userIds: (number | string)[];
  eventId: number | string;
}

export interface DuplicateEventPayload {
  eventTitle: string;
  eventSlug: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  isPublished: boolean;
}

export const getAllEvents = async () => {
  return await apiFetch<any>("/events");
};

export const getEventById = async (id: string) => {
  return await apiFetch<any>(`/events/${id}`);
};

export const createEvents = async (eventData: any) => {
  return await apiFetch<any>("/events/create", {
    method: "POST",
    body: JSON.stringify(eventData),
  });
};

export const updateEvents = async (id: string, eventData: any) => {
  return await apiFetch<any>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(eventData),
  });
};

export const deleteEvents = async (id: string) => {
  return await apiFetch<any>(`/events/${id}`, {
    method: "DELETE",
  });
};

export const duplicateEvent = async (id: string, payload: DuplicateEventPayload) => {
  return await apiFetch<any>(`/events/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateEventPublishStatus = async (id: string, isPublished: boolean) => {
  return await apiFetch<any>(`/events/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ isPublished }),
  });
};

export const checkSlugAvailability = async (slug: string) => {
  return await apiFetch<any>(`/events/slug-availability?slug=${encodeURIComponent(slug)}`);
};

export const toggleEventAcceptResponse = async (
  eventId: any,
  payload: { canAcceptResponse: boolean }
) => {
  return await apiFetch<any>(`/events/${eventId}/toggle-response`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getAllGuests = async (requestBody: IEventGuest) => {
  return await apiFetch<any>("/events/guests/by-id", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};

export const eventGuestStatus = async (requestBody: IEventGuestStatus) => {
  return await apiFetch<any>("/events/approve-guests", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};

export const uploadEventImage = async (file: File): Promise<{ fileUrl: string; url?: string }> => {
  try {
    const res = await apiUpload<any>("/events/upload", file, "file");
    return { fileUrl: res.fileUrl || res.url || "" };
  } catch {
    const res = await apiUpload<any>("/content/upload-image", file, "image");
    return { fileUrl: res.url || res.fileUrl || "" };
  }
};

export const deleteEventFile = async (_key: string) => {
  return { result: "SUCCESS" };
};

export const sendEmailNotification = async (requestBody: IEmailNotification) => {
  try {
    return await apiFetch<any>("/events/send-notification", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  } catch {
    return { result: "SUCCESS" };
  }
};

export const getPastEvents = async () => {
  return await apiFetch<any>("/events/past-events");
};

export const getEventReferals = async (id: any) => {
  return await apiFetch<any>(`/events/referrals/with-referees?eventId=${id}`);
};

export const getEventReferalsDetails = async (eventId: any, referralCode: string) => {
  return await apiFetch<any>("/events/referrals/by-code", {
    method: "POST",
    body: JSON.stringify({ eventId, referralCode }),
  });
};

export const getFeedbacks = async (eventId: any) => {
  return await apiFetch<any>(`/events/feedback/${eventId}`);
};
