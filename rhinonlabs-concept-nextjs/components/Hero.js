/* Hero — ported from website/components/sections/Hero.tsx.
   The `motion` springs are replaced with CSS keyframes so this project needs no new dependency. */
import styles from "./Hero.module.css";

const hero = {
  rating: "20+",
  ratingNote: (
    <>
      Trusted by <strong>startups and SMBs worldwide</strong>
    </>
  ),
  avatars: [1, 2, 3, 4, 5].map((n) => `/img/hero/avatar-${n}.jpg`),
  title: "Scale your",
  subtitle: "operations, not your headcount.",
  lead: (
    <>
      We design and build custom AI workflows, automations, and internal dashboards that{" "}
      <strong>reduce manual work</strong> and help your team work faster and smarter.
    </>
  ),
  clients: [1, 2, 3, 4, 5].map((n) => `/img/hero/client-${n}.svg`),
};

function Letters({ text, delay }) {
  return text.split(" ").map((word, wi) => (
    <span key={wi} className={styles.word}>
      {[...word].map((c, ci) => (
        <span key={ci} className={styles.letter} style={{ "--d": `${delay + (wi * 4 + ci) * 0.035}s` }}>
          {c}
        </span>
      ))}
    </span>
  ));
}

export default function Hero() {
  return (
    <section className={styles.hero} id="top" data-theme="light">
      <div className={styles.image}>
        <img src="/img/hero/hero-mascot.jpg" alt="Rhinon Labs mascot — a robot rhino waving" />
        <span className={styles.curtain} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <div className={styles.rating}>
          <div className={styles.avatars}>
            {hero.avatars.map((src, i) => (
              <span key={src} style={{ "--d": `${0.35 + i * 0.07}s` }}>
                <img src={src} alt="" />
              </span>
            ))}
          </div>
          <div>
            <p className={`mono ${styles.score}`}>
              <span className={styles.stars} aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <strong>{hero.rating}</strong>
            </p>
            <p className="mono">{hero.ratingNote}</p>
          </div>
        </div>

        <h1 className={styles.title} aria-label={`${hero.title} ${hero.subtitle}`}>
          <span className={`display ${styles.titleMain}`} aria-hidden="true">
            <Letters text={hero.title} delay={0.3} />
          </span>
        </h1>
        <p className={`display ${styles.subtitle}`} aria-hidden="true">
          <Letters text={hero.subtitle} delay={0.65} />
        </p>

        <p className={styles.lead}>{hero.lead}</p>

        <div className={styles.buttons}>
          <a className="btn btn--lg btn--blue" data-book="" href="#" target="_blank" rel="noopener">
            <span className="roll" data-label="Book a free discovery call">
              <span>Book a free discovery call</span>
            </span>
          </a>
          <a className="btn btn--lg btn--light" href="#build">
            <span className="roll" data-label="See what we build">
              <span>See what we build</span>
            </span>
          </a>
        </div>

        <div className={styles.ticker}>
          <div className={styles.track}>
            {[...hero.clients, ...hero.clients].map((src, i) => (
              <img key={i} src={src} alt="" aria-hidden={i >= hero.clients.length} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
