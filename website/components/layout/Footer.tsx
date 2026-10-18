import GridLines from "@/components/ui/GridLines";
import { footer } from "@/lib/content";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={`section theme-dark ${styles.footer}`}>
      <GridLines />
      <div className={`grid4 ${styles.inner}`}>
        <nav className={styles.links}>
          {footer.links.map((l) => (
            <a key={l.label} href={l.href} className="mono">
              {l.label}
            </a>
          ))}
        </nav>
        <span />
        <p className={`mono ${styles.copy}`}>{footer.copyright}</p>
        <a href={footer.credit.href} target="_blank" rel="noreferrer" className={`mono ${styles.credit}`}>
          {footer.credit.label}
          <img src={footer.credit.photo} alt={footer.credit.name} title={footer.credit.name} />
        </a>
      </div>
    </footer>
  );
}
