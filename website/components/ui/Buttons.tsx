import RollText from "./RollText";
import { Chevron } from "./Icons";
import styles from "./ui.module.css";

type PillProps = {
  href?: string;
  children: string;
  tone?: "dark" | "light" | "outline" | "glow";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

/** Big rounded pill (hero / pricing). */
export function PillButton({ href, children, tone = "dark", className, type = "button", onClick }: PillProps) {
  const cls = `${styles.pill} ${styles[`pill_${tone}`]} roll-host ${className ?? ""}`;
  const label = <RollText text={children} />;
  if (href) return <a href={href} className={cls}>{label}</a>;
  return <button type={type} className={cls} onClick={onClick}>{label}</button>;
}

type LineProps = {
  href?: string;
  children: string;
  className?: string;
  type?: "button" | "submit";
};

/** Text + chevron with the brand gradient underline that fills on hover. */
export function LineCta({ href, children, className, type = "button" }: LineProps) {
  const cls = `${styles.line} roll-host ${className ?? ""}`;
  const inner = (
    <>
      <RollText text={children} />
      <Chevron className={styles.lineIcon} />
      <span className={styles.lineBar} aria-hidden="true" />
    </>
  );
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <button type={type} className={cls}>{inner}</button>;
}
