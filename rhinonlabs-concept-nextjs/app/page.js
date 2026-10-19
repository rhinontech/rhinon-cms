import HomepageClient from "@/components/HomepageClient";
import Hero from "@/components/Hero";
import Problem from "@/components/web/sections/Problem";
import Services from "@/components/web/sections/Services";
import Advantages from "@/components/web/sections/Advantages";
import CaseStudy from "@/components/web/sections/CaseStudy";
import MoreCases from "@/components/web/sections/MoreCases";
import FirstStep from "@/components/web/sections/FirstStep";
import {
  siteConfig,
  tools,
  onboarding,
  systems,
  process as processSteps,
  more,
  stats,
  faqs,
  ICONS,
  CAT_LABELS,
  HAND_ICON,
  BOLT_ICON,
} from "@/lib/data";

/* ── Helpers ──────────────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, "0");

export default function Home() {
  /* Pre-render the tool ticker row */
  const toolRow = tools.map((t, i) => <span key={i}>{t}</span>);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* Texture & structure layers */}
      <div className="grain" aria-hidden="true" />
      <div className="columns" aria-hidden="true">
        <div className="columns__in">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      {/* ───────────── Header ───────────── */}
      <header className="hdr" id="hdr">
        <a
          className="hdr__logo"
          href="#top"
          aria-label="Rhinon Labs — back to top"
        >
          <img
            src="/img/logo-light.webp"
            alt="Rhinon Labs"
            width={120}
            height={42}
          />
        </a>
        <button
          className="hdr__menu mono"
          id="menuBtn"
          aria-expanded="false"
          aria-controls="menu"
        >
          <span className="plus" aria-hidden="true" />
          <span className="roll" data-label="Index">
            <span>Index</span>
          </span>
        </button>
        <div className="hdr__right">
          <span className="hdr__clock mono">
            <span className="dot dot--lime pulse" aria-hidden="true" />
            Hyderabad <time id="clock">--:--</time> IST
          </span>
          <a
            className="btn btn--blue btn--sm"
            data-book=""
            href="#"
            target="_blank"
            rel="noopener"
          >
            <span className="roll" data-label="Book a call">
              <span>Book a call</span>
            </span>
          </a>
        </div>
      </header>

      <nav className="menu" id="menu" aria-label="Site">
        <ul className="menu__links">
          <li>
            <a href="#cost" data-letters="">
              Cost calculator
            </a>
            <span className="mono">01</span>
          </li>
          <li>
            <a href="#services" data-letters="">
              Services
            </a>
            <span className="mono">02</span>
          </li>
          <li>
            <a href="#build" data-letters="">
              What we build
            </a>
            <span className="mono">03</span>
          </li>
          <li>
            <a href="#process" data-letters="">
              How we work
            </a>
            <span className="mono">04</span>
          </li>
          <li>
            <a href="#case" data-letters="">
              Case study
            </a>
            <span className="mono">05</span>
          </li>
          <li>
            <a href="#faq" data-letters="">
              FAQ
            </a>
            <span className="mono">06</span>
          </li>
        </ul>
        <a className="menu__mail" data-mail="" href="#" />
        <div className="menu__foot mono">
          <a data-phone="" href="#" />
          <a data-whatsapp="" href="#" target="_blank" rel="noopener">
            WhatsApp ↗
          </a>
        </div>
      </nav>

      <main id="main">
        <Hero />

        {/* ───────────── Tools ticker ───────────── */}
        <section
          className="ticker"
          data-theme="dark"
          aria-label="Tools we connect"
        >
          <p className="ticker__label mono">
            Plugs into
            <br />
            what you use
          </p>
          <div className="ticker__viewport">
            <div className="ticker__track" id="tools">
              <div className="ticker__group">{toolRow}</div>
              <div className="ticker__group" aria-hidden="true">
                {toolRow}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 01 The problem (website video layout) ───────────── */}
        <div className="web" data-theme="dark">
          <Problem />
        </div>

        {/* ───────────── 02 Before / after ───────────── */}
        <section className="ba x" data-theme="light" id="before-after">
          <div className="wrap ba__grid">
            <div className="ba__intro">
              <p className="kicker mono">
                <span className="idx">02</span>Before / after
              </p>
              <h2 className="h2" data-split="">
                Same work.
                <br />
                <em>Zero</em> busywork.
              </h2>
              <p className="lead" data-reveal="">
                Onboarding one new client — first by hand, then with a system
                we&rsquo;d build around your tools.
              </p>
              <div
                className="switch"
                role="group"
                aria-label="Show the process"
              >
                <span className="switch__thumb" aria-hidden="true" />
                <button type="button" aria-pressed="true" data-mode="manual">
                  By hand
                </button>
                <button type="button" aria-pressed="false" data-mode="auto">
                  Automated
                </button>
              </div>
              <p className="fine mono">Illustrative example</p>
            </div>

            <div className="flow" data-reveal="">
              <div className="flow__head mono">
                <span>New client onboarding</span>
                <span className="flow__state">
                  <span className="s-manual">6 manual steps</span>
                  <span className="s-auto">1 trigger</span>
                </span>
              </div>
              <ol className="flow__rows" id="flowRows">
                {onboarding.map((r, i) => (
                  <li key={i} style={{ "--i": i }}>
                    <span
                      className="flow__icon"
                      dangerouslySetInnerHTML={{
                        __html: HAND_ICON + BOLT_ICON,
                      }}
                    />
                    <span className="flow__step">{r.step}</span>
                    <span className="flow__time mono">
                      <span className="t-manual">{r.manual}</span>
                      <span className="t-auto">Auto</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="flow__total">
                <span className="mono">Total</span>
                <span className="flow__sum">
                  <span className="s-manual">
                    ≈ 1 hour of work + 2 days of waiting
                  </span>
                  <span className="s-auto">Runs in under a minute</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 03 Calculator ───────────── */}
        <section className="calc x" data-theme="dark" id="cost">
          <div className="wrap calc__grid">
            <div className="calc__inputs">
              <p className="kicker mono">
                <span className="idx">03</span>The cost of waiting
              </p>
              <h2 className="h2" data-split="">
                What is manual work <em>costing</em> you?
              </h2>
              <div className="field">
                <label className="field__top mono" htmlFor="cPeople">
                  <span>People doing repetitive work</span>
                  <output id="oPeople">4</output>
                </label>
                <input
                  id="cPeople"
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  defaultValue={4}
                />
              </div>
              <div className="field">
                <label className="field__top mono" htmlFor="cHours">
                  <span>Hours each, per week</span>
                  <output id="oHours">6</output>
                </label>
                <input
                  id="cHours"
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  defaultValue={6}
                />
              </div>
              <div className="field">
                <label className="field__top mono" htmlFor="cRate">
                  <span>Cost per hour</span>
                  <output id="oRate">₹600</output>
                </label>
                <input
                  id="cRate"
                  type="range"
                  min={200}
                  max={3000}
                  step={50}
                  defaultValue={600}
                />
              </div>
            </div>

            <div className="calc__out" data-reveal="">
              <p className="mono calc__label">
                Spent on repetitive work, every year
              </p>
              <p className="calc__big" id="cTotal" aria-live="polite">
                ₹0
              </p>
              <div className="weeks" id="weeks" aria-hidden="true">
                {Array.from({ length: 52 }, (_, i) => (
                  <i key={i} style={{ "--i": i }} />
                ))}
              </div>
              <p className="calc__weeks">
                That&rsquo;s about <b id="cWeeks">0</b> full work-weeks a year
                — time your team could spend on work that actually grows the
                business.
              </p>
              <a
                className="btn btn--lime"
                data-book=""
                href="#"
                target="_blank"
                rel="noopener"
              >
                <span
                  className="roll"
                  data-label="Find what to automate first"
                >
                  <span>Find what to automate first</span>
                </span>
                <span className="btn__arrow" aria-hidden="true">
                  →
                </span>
              </a>
              <p className="fine mono">
                Estimate based on your inputs and 48 working weeks a year.
              </p>
            </div>
          </div>
        </section>

        {/* ───────────── 04 Services (ported from website/) ───────────── */}
        <div className="web" data-theme="dark">
          <Services />
        </div>

        {/* ───────────── 05 Systems ───────────── */}
        <section className="systems x" data-theme="light" id="build">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker mono">
                  <span className="idx">05</span>What we build
                </p>
                <h2 className="h2" data-split="">
                  Systems, <em>not</em>
                  <br />
                  more tools.
                </h2>
              </div>
              <div
                className="tabs"
                role="tablist"
                aria-label="Filter systems"
                id="tabs"
              >
                <button
                  className="tab mono"
                  role="tab"
                  aria-selected="true"
                  data-filter="all"
                >
                  All <sup>18</sup>
                </button>
                <button
                  className="tab mono"
                  role="tab"
                  aria-selected="false"
                  data-filter="dashboards"
                >
                  Dashboards <sup>06</sup>
                </button>
                <button
                  className="tab mono"
                  role="tab"
                  aria-selected="false"
                  data-filter="automation"
                >
                  Automations <sup>06</sup>
                </button>
                <button
                  className="tab mono"
                  role="tab"
                  aria-selected="false"
                  data-filter="agents"
                >
                  AI agents <sup>06</sup>
                </button>
              </div>
            </div>
            <ul className="systems__grid" id="systems">
              {systems.map((s, i) => (
                <li key={i} className="sys" data-cat={s.cat}>
                  <div className="sys__top mono">
                    <span>S/{pad(i + 1)}</span>
                    <span className="chip">{CAT_LABELS[s.cat]}</span>
                  </div>
                  <span
                    dangerouslySetInnerHTML={{ __html: ICONS[s.cat] }}
                  />
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────────── 06 Process ───────────── */}
        <section className="process" data-theme="light" id="process">
          <div className="process__pin">
            <div className="wrap process__head">
              <div>
                <p className="kicker mono">
                  <span className="idx">06</span>How we work
                </p>
                <h2 className="h2" data-split="">
                  Four steps from <em>chaos</em>
                  <br />
                  to clarity.
                </h2>
              </div>
              <div className="rail" aria-hidden="true">
                <div className="rail__fill" id="railFill" />
                <ol className="rail__ticks mono" id="railTicks">
                  {processSteps.map((_, i) => (
                    <li key={i}>{pad(i + 1)}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="process__viewport">
              <div className="process__track" id="track">
                {processSteps.map((p, i) => (
                  <article key={i} className="step">
                    <div className="step__top mono">
                      <span>Step {pad(i + 1)}</span>
                      <span>/{pad(processSteps.length)}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <p className="step__get mono">
                      <span className="tick" aria-hidden="true">
                        ✓
                      </span>
                      You get: {p.get}
                    </p>
                    <span className="step__num" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 07 Why us (ported from website/) ───────────── */}
        <div className="web" data-theme="light">
          <Advantages />
        </div>

        {/* ───────────── 08 Case study + More projects (ported from website/) ───────────── */}
        <div className="web" data-theme="light">
          <CaseStudy />
          <MoreCases />
        </div>

        {/* ───────────── 09 Results ───────────── */}
        <section className="results x" data-theme="light" id="results">
          <div className="wrap">
            <p className="kicker mono">
              <span className="idx">09</span>What changes
            </p>
            <h2 className="h2" data-split="">
              Less busywork.
              <br />
              <em>More</em> business.
            </h2>
            <div className="stats" id="stats">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="stat"
                  data-reveal=""
                  style={{ "--d": `${i * 90}ms` }}
                >
                  <p className="stat__v">
                    {s.value != null ? (
                      <span data-count={s.value}>0</span>
                    ) : (
                      <span>{s.text}</span>
                    )}
                    {s.suffix && (
                      <span className="stat__s">{s.suffix}</span>
                    )}
                    {s.unit && <span className="stat__u">{s.unit}</span>}
                  </p>
                  <span className="stat__l mono">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── 10 Easy first step (ported from website/) ───────────── */}
        <div className="web" data-theme="dark">
          <FirstStep />
        </div>

        {/* ───────────── 11 FAQ ───────────── */}
        <section className="faq x" data-theme="light" id="faq">
          <div className="wrap faq__grid">
            <div className="faq__side">
              <p className="kicker mono">
                <span className="idx">11</span>FAQ
              </p>
              <h2 className="h2" data-split="">
                Questions, <em>answered.</em>
              </h2>
              <div className="ask" data-reveal="">
                <p>
                  Still deciding? Talk to the people who&rsquo;ll build it.
                </p>
                <div className="ask__btns">
                  <a
                    className="btn btn--blue btn--sm"
                    data-phone-btn=""
                    href="#"
                  >
                    <span className="roll" data-label="Call us">
                      <span>Call us</span>
                    </span>
                  </a>
                  <a
                    className="btn btn--ghost-light btn--sm"
                    data-whatsapp=""
                    href="#"
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="roll" data-label="WhatsApp">
                      <span>WhatsApp</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
            <div className="faq__list" id="faqs">
              {faqs.map(([q, a], i) => (
                <div key={i} className={`qa${i === 0 ? " is-open" : ""}`}>
                  <h3>
                    <button
                      className="qa__q"
                      id={`qq${i}`}
                      aria-expanded={i === 0 ? "true" : "false"}
                      aria-controls={`qa${i}`}
                    >
                      <span className="qa__n mono">{pad(i + 1)}</span>
                      <span>{q}</span>
                      <span className="qa__icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    className="qa__a"
                    id={`qa${i}`}
                    role="region"
                    aria-labelledby={`qq${i}`}
                  >
                    <div>
                      <p>{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ───────────── 12 Footer CTA ───────────── */}
      <footer className="foot" data-theme="dark" id="contact">
        <div className="wrap">
          <p className="kicker mono">
            <span className="idx">12</span>Start here
          </p>
          <h2 className="foot__title display" data-split="">
            Let&rsquo;s build
            <br />
            your <em>system.</em>
          </h2>
          <div className="foot__cta" data-reveal="">
            <a
              className="btn btn--blue btn--lg"
              data-book=""
              href="#"
              target="_blank"
              rel="noopener"
            >
              <span className="roll" data-label="Book a free discovery call">
                <span>Book a free discovery call</span>
              </span>
              <span className="btn__arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a
              className="btn btn--ghost btn--lg"
              data-whatsapp=""
              href="#"
              target="_blank"
              rel="noopener"
            >
              <span className="roll" data-label="Message on WhatsApp">
                <span>Message on WhatsApp</span>
              </span>
            </a>
          </div>

          <div className="foot__cols">
            <div>
              <h3 className="mono">Talk</h3>
              <a data-phone="" href="#" data-letters="" />
              <a data-mail="" href="#" data-letters="" />
            </div>
            <div>
              <h3 className="mono">Studio</h3>
              <p>
                Hyderabad, Telangana
                <br />
                India — working worldwide
              </p>
            </div>
            <div>
              <h3 className="mono">Explore</h3>
              <a
                data-site="/services"
                href="#"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                Services
              </a>
              <a
                data-site="/case-studies"
                href="#"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                Case studies
              </a>
              <a
                data-site="/blogs"
                href="#"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                Blog
              </a>
            </div>
            <div>
              <h3 className="mono">Follow</h3>
              <a
                href="https://www.linkedin.com/company/rhinonlabs"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                LinkedIn
              </a>
              <a
                href="https://x.com/RhinonLabs"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                X / Twitter
              </a>
              <a
                href="https://www.instagram.com/rhinonlabs/"
                target="_blank"
                rel="noopener"
                data-letters=""
              >
                Instagram
              </a>
            </div>
          </div>

          <div className="foot__markwrap" aria-hidden="true">
            <div className="foot__mark" id="mark">
              Rhinon Labs
            </div>
          </div>

          <div className="foot__base mono">
            <span>
              © <span id="year" /> Rhinon Labs
            </span>
            <span>
              Homepage concept — internal review, not for production
            </span>
            <a href="#top" className="totop">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Client-side interactivity */}
      <HomepageClient />
    </>
  );
}
