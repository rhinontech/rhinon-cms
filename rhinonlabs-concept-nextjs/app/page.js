import HomepageClient from "@/components/HomepageClient";
import {
  siteConfig,
  tools,
  onboarding,
  systems,
  process as processSteps,
  work,
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
            <a href="#build" data-letters="">
              What we build
            </a>
            <span className="mono">01</span>
          </li>
          <li>
            <a href="#cost" data-letters="">
              Cost calculator
            </a>
            <span className="mono">02</span>
          </li>
          <li>
            <a href="#process" data-letters="">
              How we work
            </a>
            <span className="mono">03</span>
          </li>
          <li>
            <a href="#work" data-letters="">
              Selected work
            </a>
            <span className="mono">04</span>
          </li>
          <li>
            <a href="#faq" data-letters="">
              FAQ
            </a>
            <span className="mono">05</span>
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
        {/* ───────────── Hero ───────────── */}
        <section className="hero" id="top" data-theme="light">
          <div className="wrap">
            <div className="hero__meta mono">
              <span>
                <span className="dot dot--blue" aria-hidden="true" />
                AI · Automation · Product studio
              </span>
              <span>Hyderabad, India — working worldwide</span>
              <span>Typical delivery: 2–4 weeks</span>
            </div>

            <h1 className="hero__title display">
              <span className="line" style={{ "--l": 0 }}>
                <span className="line__in">Scale your</span>
              </span>
              <span className="line line--2" style={{ "--l": 1 }}>
                <span className="line__in">operations,</span>
              </span>
              <span className="line line--3" style={{ "--l": 2 }}>
                <span className="line__in">
                  not your <em>headcount.</em>
                </span>
              </span>
            </h1>

            <div className="hero__grid">
              <div className="hero__copy">
                <p className="lead" data-reveal="" style={{ "--d": "700ms" }}>
                  We design and build custom AI workflows, automations, and
                  internal dashboards that reduce manual work and help your team
                  work faster and smarter.
                </p>
                <div
                  className="hero__ctas"
                  data-reveal=""
                  style={{ "--d": "820ms" }}
                >
                  <a
                    className="btn btn--blue"
                    data-book=""
                    href="#"
                    target="_blank"
                    rel="noopener"
                  >
                    <span
                      className="roll"
                      data-label="Book a free discovery call"
                    >
                      <span>Book a free discovery call</span>
                    </span>
                    <span className="btn__arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                  <a className="btn btn--ghost" href="#build">
                    <span className="roll" data-label="See what we build">
                      <span>See what we build</span>
                    </span>
                  </a>
                </div>
                <p
                  className="hero__trust mono"
                  data-reveal=""
                  style={{ "--d": "940ms" }}
                >
                  Trusted by 20+ startups and SMBs worldwide ·{" "}
                  <a data-phone="" href="#" />
                </p>
              </div>

              <figure
                className="system"
                aria-label="Example workflow: your tools connected through an AI agent"
              >
                <div className="system__in">
                  <figcaption className="system__head mono">
                    <span>
                      <span
                        className="dot dot--lime pulse"
                        aria-hidden="true"
                      />
                      Live preview
                    </span>
                    <span>Example workflow</span>
                  </figcaption>
                  <svg
                    className="system__map"
                    viewBox="0 0 640 380"
                    role="img"
                    aria-label="Website form, Gmail and WhatsApp feed an AI agent, which updates the CRM, Google Sheets, Slack and a dashboard"
                  >
                    <defs>
                      <path
                        id="p1"
                        d="M156 66 C 222 66, 228 172, 272 172"
                      />
                      <path id="p2" d="M156 172 L 272 172" />
                      <path
                        id="p3"
                        d="M156 278 C 222 278, 228 172, 272 172"
                      />
                      <path
                        id="p4"
                        d="M368 172 C 412 172, 418 66, 484 66"
                      />
                      <path id="p5" d="M368 172 L 484 172" />
                      <path
                        id="p6"
                        d="M368 172 C 412 172, 418 278, 484 278"
                      />
                      <path id="p7" d="M320 220 L 320 300" />
                    </defs>
                    <g className="links">
                      <use href="#p1" />
                      <use href="#p2" />
                      <use href="#p3" />
                      <use href="#p4" />
                      <use href="#p5" />
                      <use href="#p6" />
                      <use href="#p7" />
                    </g>
                    <g className="nodes">
                      <g className="node" transform="translate(20 46)">
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          Website form
                        </text>
                      </g>
                      <g className="node" transform="translate(20 152)">
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          Gmail
                        </text>
                      </g>
                      <g className="node" transform="translate(20 258)">
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          WhatsApp
                        </text>
                      </g>
                      <g
                        className="node node--out"
                        transform="translate(484 46)"
                      >
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          CRM
                        </text>
                      </g>
                      <g
                        className="node node--out"
                        transform="translate(484 152)"
                      >
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          Google Sheets
                        </text>
                      </g>
                      <g
                        className="node node--out"
                        transform="translate(484 258)"
                      >
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          Slack
                        </text>
                      </g>
                      <g
                        className="node node--dash"
                        transform="translate(252 300)"
                      >
                        <rect width={136} height={40} rx={9} />
                        <text x={16} y={25}>
                          Dashboard
                        </text>
                      </g>
                    </g>
                    <g className="agent">
                      <circle
                        className="agent__ring"
                        cx={320}
                        cy={172}
                        r={62}
                      />
                      <circle
                        className="agent__core"
                        cx={320}
                        cy={172}
                        r={48}
                      />
                      <text x={320} y={168} textAnchor="middle">
                        AI
                      </text>
                      <text x={320} y={184} textAnchor="middle">
                        AGENT
                      </text>
                    </g>
                    <g className="packets">
                      <circle r={3.5}>
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="0s"
                        >
                          <mpath href="#p1" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5}>
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="0.8s"
                        >
                          <mpath href="#p2" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5}>
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="1.6s"
                        >
                          <mpath href="#p3" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5} className="out">
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="0.4s"
                        >
                          <mpath href="#p4" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5} className="out">
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="1.2s"
                        >
                          <mpath href="#p5" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5} className="out">
                        <animateMotion
                          dur="2.4s"
                          repeatCount="indefinite"
                          begin="2s"
                        >
                          <mpath href="#p6" />
                        </animateMotion>
                      </circle>
                      <circle r={3.5} className="out">
                        <animateMotion
                          dur="1.6s"
                          repeatCount="indefinite"
                          begin="0.6s"
                        >
                          <mpath href="#p7" />
                        </animateMotion>
                      </circle>
                    </g>
                  </svg>
                  <ol
                    className="system__log mono"
                    id="log"
                    aria-hidden="true"
                  />
                </div>
              </figure>
            </div>
          </div>
        </section>

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

        {/* ───────────── 01 Statement ───────────── */}
        <section className="statement x" data-theme="dark" id="why">
          <div className="wrap">
            <p className="kicker mono">
              <span className="idx">01</span>The problem
            </p>
            <p className="statement__text" data-fill="">
              Your team isn&rsquo;t slow.{" "}
              <em>Your systems are.</em> Data gets copied between tools,
              follow-ups live in someone&rsquo;s memory, and every answer starts
              with &ldquo;let me check.&rdquo; We find the manual work hiding in
              your business — and build the <em>systems</em> that take it off
              your plate.
            </p>
            <ul className="statement__facts mono">
              <li data-reveal="">
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                Built around the tools you already use
              </li>
              <li data-reveal="" style={{ "--d": "90ms" }}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                You own the code and the data
              </li>
              <li data-reveal="" style={{ "--d": "180ms" }}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                Optional support after launch
              </li>
            </ul>
          </div>
        </section>

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

        {/* ───────────── 03 Systems ───────────── */}
        <section className="systems x" data-theme="light" id="build">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker mono">
                  <span className="idx">03</span>What we build
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

        {/* ───────────── 04 Calculator ───────────── */}
        <section className="calc x" data-theme="dark" id="cost">
          <div className="wrap calc__grid">
            <div className="calc__inputs">
              <p className="kicker mono">
                <span className="idx">04</span>The cost of waiting
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

        {/* ───────────── 05 Process ───────────── */}
        <section className="process" data-theme="light" id="process">
          <div className="process__pin">
            <div className="wrap process__head">
              <div>
                <p className="kicker mono">
                  <span className="idx">05</span>How we work
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

        {/* ───────────── 06 Work ───────────── */}
        <section className="work x" data-theme="dark" id="work">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="kicker mono">
                  <span className="idx">06</span>Selected work
                </p>
                <h2 className="h2" data-split="">
                  Products we&rsquo;ve <em>shipped.</em>
                </h2>
              </div>
              <a
                className="btn btn--ghost"
                data-site="/case-studies"
                href="#"
                target="_blank"
                rel="noopener"
              >
                <span className="roll" data-label="All case studies">
                  <span>All case studies</span>
                </span>
                <span className="btn__arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
            <div className="work__stack" id="stack">
              {work.map((w, i) => (
                <article key={i} className="wcard" style={{ "--i": i }}>
                  <div className="wcard__media">
                    <img
                      src={w.img}
                      alt={`${w.name} — ${w.title}`}
                      width={1600}
                      height={930}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="wcard__body">
                    <div className="wcard__meta mono">
                      <span className="chip">{w.tag}</span>
                      <span className="chip">{w.kind}</span>
                    </div>
                    <h3 className="wcard__name">{w.name}</h3>
                    <p className="wcard__title">{w.title}</p>
                    <p className="wcard__desc">{w.desc}</p>
                    <div className="wcard__foot">
                      <a
                        className="btn btn--light"
                        href={`${siteConfig.site}/case-studies/${w.slug}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <span
                          className="roll"
                          data-label="Read the case study"
                        >
                          <span>Read the case study</span>
                        </span>
                        <span className="btn__arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                      <span className="mono wcard__idx">
                        {pad(i + 1)} / {pad(work.length)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="work__more-title mono">Also built by us</p>
            <ul className="work__more" id="more">
              {more.map((m, i) => (
                <li key={i} className="more" data-reveal="">
                  <div className="more__img">
                    <img
                      src={m.img}
                      alt={m.name}
                      width={1200}
                      height={700}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{m.name}</h3>
                  <p>{m.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────────── 07 Results ───────────── */}
        <section className="results x" data-theme="light" id="results">
          <div className="wrap">
            <p className="kicker mono">
              <span className="idx">07</span>What changes
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

        {/* ───────────── 08 FAQ ───────────── */}
        <section className="faq x" data-theme="light" id="faq">
          <div className="wrap faq__grid">
            <div className="faq__side">
              <p className="kicker mono">
                <span className="idx">08</span>FAQ
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

      {/* ───────────── 09 Footer CTA ───────────── */}
      <footer className="foot" data-theme="dark" id="contact">
        <div className="wrap">
          <p className="kicker mono">
            <span className="idx">09</span>Start here
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
