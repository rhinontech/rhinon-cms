import { Award, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";
import { RegisterButton } from "../registration";
import { Card } from "../../shared/ui";

function Row({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[14px] text-[#334155]">
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#94A3B8]" aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** Sticky summary beside the content on desktop — price, facts, one button. */
export default function RegistrationCard({
  event,
  config,
}: {
  event: EventDetailModel;
  config: CategoryConfig;
}) {
  const certificate =
    config.certificate === "completion"
      ? "Certificate of completion"
      : config.certificate === "participation"
        ? "Certificate of participation"
        : null;

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF]" aria-hidden />
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-[28px] font-extrabold text-[#0B1B3D] tracking-tight">
            {config.restriction ? "Invite only" : "Free"}
          </p>
          {event.canRegister && !config.restriction ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#B45309] bg-[#FFF7ED] border border-[#FED7AA] rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" aria-hidden />
              Limited seats
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] text-[#64748B]">
          {!event.canRegister
            ? "This event is not taking registrations."
            : config.restriction
              ? "Places are confirmed by the programme team."
              : "Registration takes under a minute."}
        </p>

        <ul className="mt-6 space-y-3.5">
          <Row icon={CalendarDays}>{event.dateLabel}</Row>
          <Row icon={Clock3}>
            {event.timeLabel}
            <span className="block text-[12px] text-[#94A3B8]">{event.durationLabel}</span>
          </Row>
          <Row icon={MapPin}>
            {event.location}
            <span className="block text-[12px] text-[#94A3B8]">{event.mode}</span>
          </Row>
          {event.attending > 0 ? <Row icon={Users}>{event.attending}+ people attending</Row> : null}
          {certificate ? <Row icon={Award}>{certificate}</Row> : null}
        </ul>

        <RegisterButton
          label={event.ctaLabel}
          disabled={!event.canRegister}
          disabledLabel={event.isPast ? "Event has ended" : "Registrations closed"}
          className="mt-7 w-full"
        />
        {config.restriction ? (
          <p className="mt-3 text-center text-[12px] text-[#64748B]">{config.restriction}</p>
        ) : null}
      </div>
    </Card>
  );
}
