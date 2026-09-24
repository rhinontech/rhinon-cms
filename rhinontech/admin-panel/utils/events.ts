import { format, parseISO } from "date-fns";

export interface CalendarEventInput {
  summary: string;
  description?: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime: string;
  eventEndTime: string;
  timeZone?: string;
}

export const buildCalendarEvent = ({
  summary,
  description,
  eventStartDate,
  eventEndDate,
  eventStartTime,
  eventEndTime,
  timeZone = "Asia/Kolkata",
}: CalendarEventInput) => {
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = (time || "0:0").split(":").map(Number);
    if (!minutes) minutes = 0;
    if (modifier?.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier?.toLowerCase() === "am" && hours === 12) hours = 0;
    return { hours, minutes };
  };

  const createUTCFromIST = (dateStr: string, timeStr: string) => {
    if (!dateStr) return new Date().toISOString();
    const time = parseTime(timeStr);
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year || 2025, (month || 1) - 1, day || 1, time.hours, time.minutes, 0, 0));
    date.setUTCHours(date.getUTCHours() - 5);
    date.setUTCMinutes(date.getUTCMinutes() - 30);
    return date.toISOString();
  };

  const startDateTime = createUTCFromIST(eventStartDate, eventStartTime);
  const endDateTime = createUTCFromIST(eventEndDate, eventEndTime);

  return {
    summary,
    ...(description && { description }),
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
  };
};

export const formatDateRange = (start: string, end: string) => {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const startDay = getOrdinal(startDate.getDate());
    const startMonth = format(startDate, "MMM");
    const endDay = getOrdinal(endDate.getDate());
    const endMonth = format(endDate, "MMM");
    const year = format(endDate, "yyyy");

    if (start === end) {
      return `${endDay} ${endMonth}, ${year}`;
    }

    return `${startDay} ${startMonth} – ${endDay} ${endMonth}, ${year}`;
  } catch {
    return `${start} – ${end}`;
  }
};

export const formatTimeRange = (startTime: string | null | undefined, endTime: string | null | undefined) => {
  if (!startTime || !endTime || startTime === "null" || endTime === "null") return "N/A";
  return `${startTime.trim()} – ${endTime.trim()} IST`;
};
