import styles from "./ui.module.css";

// "● 03  WHY US?" section label.
export default function Eyebrow({ index, label, className }: { index?: string; label: string; className?: string }) {
  return (
    <p className={`${styles.eyebrow} ${className ?? ""}`}>
      <span className={styles.eyebrowDot} />
      {index && <span className={styles.eyebrowIndex}>{index}</span>}
      <span>{label}</span>
    </p>
  );
}
