import RollText from "./RollText";
import { Chevron } from "./Icons";
import { cn } from "@/lib/utils";

type PillProps = {
  href?: string;
  children: string;
  tone?: "dark" | "light" | "outline" | "glow";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

const pillTones = {
  dark: "bg-navy text-white hover:bg-navy-2",
  light: "bg-paper-2 text-ink hover:bg-white",
  outline: "border border-sec-line text-sec-ink hover:bg-paper-2/6",
  glow: "border-[1.5px] border-transparent text-paper-2 [background:linear-gradient(#111,#111)_padding-box,linear-gradient(90deg,var(--color-navy),var(--color-electric))_border-box] hover:[background:linear-gradient(#1a1a1a,#1a1a1a)_padding-box,linear-gradient(90deg,var(--color-electric),var(--color-navy))_border-box]",
};

/** Big rounded pill (hero / pricing). */
export function PillButton({ href, children, tone = "dark", className, type = "button", onClick }: PillProps) {
  const cls = cn(
    "group/roll relative flex h-[70px] items-center justify-center rounded-full px-8 font-display text-[15px] font-bold tracking-[-0.03em] uppercase transition-[background-color,color,transform] duration-400 ease-expo active:scale-[0.98]",
    pillTones[tone],
    className
  );
  const label = <RollText text={children} />;
  if (href)
    return (
      <a href={href} className={cls}>
        {label}
      </a>
    );
  return (
    <button type={type} className={cls} onClick={onClick}>
      {label}
    </button>
  );
}

type LineProps = {
  href?: string;
  children: string;
  className?: string;
  type?: "button" | "submit";
};

/** Text + chevron with the brand gradient underline; ink wipes up behind it on hover. */
export function LineCta({ href, children, className, type = "button" }: LineProps) {
  const cls = cn(
    "group/roll relative isolate flex h-[78px] w-full items-center justify-between overflow-hidden border-t border-sec-line px-7 text-left font-display text-[15px] font-bold tracking-[-0.03em] text-sec-ink uppercase transition-colors duration-450 ease-expo hover:text-sec-bg",
    "before:absolute before:inset-0 before:-z-1 before:origin-bottom before:scale-y-0 before:bg-sec-ink before:transition-transform before:duration-[550ms] before:ease-expo hover:before:scale-y-100",
    className
  );
  const inner = (
    <>
      <RollText text={children} />
      <Chevron className="size-5 transition-transform duration-450 ease-expo group-hover/roll:translate-x-1" />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,var(--color-navy)_0%,var(--color-navy-2)_45%,var(--color-electric)_100%)]" />
    </>
  );
  if (href)
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  return (
    <button type={type} className={cls}>
      {inner}
    </button>
  );
}
