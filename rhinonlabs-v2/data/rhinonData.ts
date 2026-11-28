export const GENERATED_IMAGES = {
  aiDev: '/images/rhinon_ai_dev_3d_1795881042560.jpg',
  mobile3d: '/images/rhinon_mobile_3d_1795881042979.jpg',
  webSaas: '/images/rhinon_web_saas_3d_1795881043569.jpg',
  mvpPods: '/images/rhinon_mvp_pods_3d_1795881044399.jpg',
  agentsOrbit: '/images/rhinon_agents_orbit_3d_1795881069360.jpg',
  voiceDoc: '/images/rhinon_voice_doc_3d_1795881046625.jpg',
  labsRhinonOS: '/images/labs_rhinonos_core_1795881567252.jpg',
  labsRhinonMed: '/images/labs_rhinonmed_scribe_1795881567125.jpg',
  labsRhinonGuard: '/images/labs_rhinonguard_shield_1795881567953.jpg',
  labsRhinonFlow: '/images/labs_rhinonflow_docs_1795881568937.jpg',
  labsRhinonSeal: '/images/labs_rhinonseal_crypto_1795881569267.jpg',
  coralHero: '/images/mm_coral_hero_3d_1795879356205.jpg',
  coralBentoAgents: '/images/mm_coral_bento_agents_1795879356067.jpg',
  coralShield: '/images/mm_coral_shield_3d_1795879356749.jpg',
  heroSculpture: '/images/mm_hero_sculpture_1795878883219.jpg',
  agentsOrchestration: '/images/mm_agents_orchestration_1795878884267.jpg',
  securityVault: '/images/mm_security_vault_1795878885239.jpg',
  mobileCraft: '/images/mm_mobile_craft_1795878884313.jpg',
  clinicalHelix: '/images/mm_clinical_helix_1795878885661.jpg',
  labsCore: '/images/mm_labs_core_1795878886363.jpg',
};

export const STITCH_IMAGES = {
  logoLight: '/assets/Logo_Rhinon_Web_Full.png',
  logoDark: '/assets/Logo_Rhinon_Web_Full.png',
};

export const IMPACT_TICKER = [
  { name: 'Talynk', tag: 'MOBILE', stat: '18M+', delta: 'Downloads' },
  { name: 'VeloHealth', tag: 'HIPAA', stat: '100%', delta: 'Audit score' },
  { name: 'CredFlow', tag: 'FINTECH', stat: '4.2M+', delta: 'Active users' },
  { name: 'VitalEdge', tag: 'HEALTH', stat: '1.8M+', delta: 'Patients served' },
  { name: 'RhinonOS', tag: 'AGENTS', stat: '340+', delta: 'Live agents' },
  { name: 'PulseRing', tag: 'IOT', stat: '96.4%', delta: 'HRV accuracy' },
];

export interface ShowcaseItem {
  id: string;
  pillLabel: string;
  tag: string;
  title: string;
  desc: string;
  s1: string;
  l1: string;
  s2: string;
  l2: string;
  accentColor: string;
  image: string;
  highlights: string[];
}

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'rhinonos',
    pillLabel: 'RhinonOS Agents',
    tag: 'AI ORCHESTRATION',
    title: 'RhinonOS Enterprise Workspace',
    desc: 'Flagship autonomous AI operations engine running receivables reconciliation, CRM routing, and contract compliance inside your private cloud.',
    s1: '340+',
    l1: 'Agents in production',
    s2: '110+',
    l2: 'Workflows automated',
    accentColor: '#FF6A2B',
    image: GENERATED_IMAGES.aiDev,
    highlights: ['Autonomous Finance Teammates', 'ERP Sync & Audit Logs', 'Human Approval Gate'],
  },
  {
    id: 'talynk',
    pillLabel: 'Talynk Mobile',
    tag: 'WORKFORCE AI',
    title: 'Talynk Career Platform',
    desc: 'High-concurrency native mobile marketplace connecting skilled professionals with verified employers via multilingual AI matching.',
    s1: '18M+',
    l1: 'App store downloads',
    s2: '<120ms',
    l2: 'Matching latency',
    accentColor: '#9B87F5',
    image: GENERATED_IMAGES.mobile3d,
    highlights: ['Vernacular Voice Onboarding', 'Instant Employer Chat', 'Hyper-Scale Kubernetes'],
  },
  {
    id: 'rhinonguard',
    pillLabel: 'RhinonGuard',
    tag: 'AI GOVERNANCE',
    title: 'RhinonGuard Risk Register',
    desc: 'Unified enterprise AI registry mapping foundation models and agent actions to EU AI Act tiers, PII redaction rules, and audit trails.',
    s1: '100%',
    l1: 'Traceable audit logs',
    s2: 'EU AI Act',
    l2: 'Automated tiering',
    accentColor: '#FF6A2B',
    image: GENERATED_IMAGES.coralShield,
    highlights: ['4 Risk Tiers Tracked', '24/7 Policy Telemetry', 'Cryptographic Attestation'],
  },
  {
    id: 'aegisehr',
    pillLabel: 'AegisEHR',
    tag: 'HEALTHCARE AI',
    title: 'AegisEHR Clinical Suite',
    desc: 'Ambient medical scribe, FHIR R4 patient timeline, and automated clinician-patient coordination built with HIPAA BAA coverage.',
    s1: '68%',
    l1: 'Less after-hours charting',
    s2: '42%',
    l2: 'Fewer missed visits',
    accentColor: '#9B87F5',
    image: GENERATED_IMAGES.clinicalHelix,
    highlights: ['HIPAA BAA Standard', 'FHIR R4 Native Sync', 'Clinician Sign-Off Gate'],
  },
  {
    id: 'credflow',
    pillLabel: 'CredFlow',
    tag: 'FINTECH',
    title: 'CredFlow Advisor Network',
    desc: 'PCI-DSS isolated mobile fintech suite powering real-time underwriting, KYC automation, and instant commission settlement.',
    s1: '4.2M+',
    l1: 'End customers served',
    s2: '900K+',
    l2: 'Active advisors',
    accentColor: '#F5841F',
    image: GENERATED_IMAGES.webSaas,
    highlights: ['PCI-DSS Isolation', 'Real-Time Payout Ledger', 'Instant Digital KYC'],
  },
  {
    id: 'fleetpulse',
    pillLabel: 'FleetPulse',
    tag: 'LOGISTICS AI',
    title: 'FleetPulse Compliance',
    desc: 'Cross-border freight compliance command center and driver mobile companion covering DOT and NSC regulations in real time.',
    s1: '18',
    l1: 'Compliance modules',
    s2: '99.4%',
    l2: 'Extraction accuracy',
    accentColor: '#9B87F5',
    image: GENERATED_IMAGES.agentsOrbit,
    highlights: ['DOT & NSC Audit Ready', 'Automated Driver Alerts', 'Live Dispatch Telemetry'],
  },
];

export const METRICS_STRIP = [
  { brand: 'Talynk', value: '18M+', label: 'Downloads' },
  { brand: 'VeloHealth', value: '100%', label: 'Compliance rate' },
  { brand: 'VitalEdge', value: '1.8M+', label: 'Patients served' },
  { brand: 'CredFlow', value: '4.2M+', label: 'Customers served' },
  { brand: 'PulseRing', value: '96.4%', label: 'Heart rate & HRV accuracy' },
];

export const VALUE_STRIP = [
  {
    iconName: 'bolt' as const,
    iconBg: 'bg-[#FF6B35]/10 text-[#FF6B35]',
    title: '3x–4x faster delivery',
    desc: 'Staff-level pods with governed AI acceleration on every commit—first production PR merged by day 4.',
  },
  {
    iconName: 'key' as const,
    iconBg: 'bg-[#9B87F5]/15 text-[#7C5DFA]',
    title: '100% IP & model ownership',
    desc: 'Your source code, prompts, fine-tuned weights, and private VPC infrastructure remain exclusively yours.',
  },
  {
    iconName: 'users' as const,
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    title: '80+ senior engineers',
    desc: 'Zero junior bench billed at senior rates. 96% of clients expand with RhinonLabs for their next release.',
  },
];

export interface BentoServiceCard {
  id: string;
  iconName: 'bot' | 'smartphone' | 'globe' | 'rocket';
  title: string;
  desc: string;
  formOption: string;
  image: string;
  ctaLabel: string;
  imageBg: string;
  imageFit: string;
}

export const BENTO_SERVICES: BentoServiceCard[] = [
  {
    id: 'ai-agents',
    iconName: 'bot',
    title: 'Custom AI, RAG & Agents',
    desc: 'Production LLM apps, enterprise RAG, and autonomous workflow agents running inside your CRM, ERP, and documents—with human approval on every write.',
    formOption: 'AI or AI agents',
    image: GENERATED_IMAGES.aiDev,
    ctaLabel: 'Explore AI Engineering',
    imageBg: 'bg-[#F4F5F7]',
    imageFit: 'object-cover',
  },
  {
    id: 'mobile-apps',
    iconName: 'smartphone',
    title: 'Mobile App Engineering',
    desc: 'Native iOS, Android, and Flutter applications engineered from zero to millions of active users—including BLE hardware sync and store release.',
    formOption: 'Mobile app',
    image: GENERATED_IMAGES.mobile3d,
    ctaLabel: 'Explore Mobile Apps',
    imageBg: 'bg-[#F4F5F7]',
    imageFit: 'object-cover',
  },
  {
    id: 'web-platforms',
    iconName: 'globe',
    title: 'Web Apps & SaaS Platforms',
    desc: 'Customer portals, multi-tenant B2B SaaS platforms, and mission-critical internal operations built for sub-second speed and enterprise scale.',
    formOption: 'Web app or platform',
    image: GENERATED_IMAGES.webSaas,
    ctaLabel: 'Explore Web Platforms',
    imageBg: 'bg-[#F4F5F7]',
    imageFit: 'object-cover',
  },
  {
    id: 'mvp-pods',
    iconName: 'rocket',
    title: 'Fixed-Price MVPs & Senior Pods',
    desc: 'Two-week technical discovery, a working production MVP in 4–10 weeks, or senior engineers embedded into your team within 48 hours under NDA.',
    formOption: 'New product or MVP',
    image: GENERATED_IMAGES.mvpPods,
    ctaLabel: 'Launch With A Pod',
    imageBg: 'bg-white',
    imageFit: 'object-cover',
  },
];

export const WHY_PILLARS = [
  {
    iconName: 'bolt' as const,
    iconColor: 'text-[#FF6A2B]',
    title: '3x–4x Faster delivery',
    desc: 'Senior-only pods with governed AI acceleration on every commit, first commit in 4 days.',
  },
  {
    iconName: 'shield' as const,
    iconColor: 'text-[#9B87F5]',
    title: 'ISO 27001 & SOC 2 ready',
    desc: 'Certified security and quality governance on every engagement, with HIPAA and PCI controls.',
  },
  {
    iconName: 'key' as const,
    iconColor: 'text-[#FF6A2B]',
    title: '100% IP ownership',
    desc: 'Your code, your models, your data, fully yours from the first commit under mutual NDA.',
  },
  {
    iconName: 'users' as const,
    iconColor: 'text-[#9B87F5]',
    title: '80+ Senior engineers',
    desc: 'No junior bench billed at senior rates. Ever. 96% client retention across multi-phase builds.',
  },
];

export interface ServiceItem {
  iconName: 'brain' | 'bot' | 'smartphone' | 'globe' | 'rocket' | 'userPlus';
  iconColor: string;
  title: string;
  desc: string;
  formOption: string;
}

export const SERVICES: ServiceItem[] = [
  {
    iconName: 'brain',
    iconColor: 'text-[#9B87F5]',
    title: 'AI development',
    desc: 'LLM apps, enterprise RAG, computer vision and custom ML pipelines trained on your data and deployed inside your private cloud.',
    formOption: 'AI or AI agents',
  },
  {
    iconName: 'bot',
    iconColor: 'text-[#FF6A2B]',
    title: 'AI agents and automation',
    desc: 'Autonomous agents that read, decide and act inside your CRM, ERP and documents, with a human approving every production write.',
    formOption: 'AI or AI agents',
  },
  {
    iconName: 'smartphone',
    iconColor: 'text-[#9B87F5]',
    title: 'Mobile app development',
    desc: 'iOS, Android and Flutter applications engineered for speed, offline resilience, telemetry analytics, and seamless store launch.',
    formOption: 'Mobile app',
  },
  {
    iconName: 'globe',
    iconColor: 'text-[#FF6A2B]',
    title: 'Web apps and platforms',
    desc: 'Customer portals, B2B SaaS architectures and real-time operational consoles built to scale cleanly from beta to millions.',
    formOption: 'Web app or platform',
  },
  {
    iconName: 'rocket',
    iconColor: 'text-[#9B87F5]',
    title: 'MVP development',
    desc: 'Two-week architecture discovery followed by a production-grade MVP in 4 to 10 weeks, shipped by a team behind 320+ launches.',
    formOption: 'New product or MVP',
  },
  {
    iconName: 'userPlus',
    iconColor: 'text-[#FF6A2B]',
    title: 'Hire dedicated developers',
    desc: 'Staff-level engineers matched to your exact stack in 48 hours, overlapping your timezone and shipping inside your repo.',
    formOption: 'Extend my team with developers',
  },
];

export interface AutomationSolutionItem {
  id: string;
  iconName:
    | 'gitBranch'
    | 'workflow'
    | 'fileText'
    | 'audioLines'
    | 'stethoscope'
    | 'clipboardCheck'
    | 'scale'
    | 'heartPulse';
  color: string;
  label: string;
  tagline: string;
  trigger: string;
  agentAction: string;
  humanGate: string;
  outcomeStat: string;
  outcomeLabel: string;
  image: string;
}

export const AUTOMATION_SOLUTIONS: AutomationSolutionItem[] = [
  {
    id: 'bpa',
    iconName: 'gitBranch',
    color: 'text-[#FF6A2B]',
    label: 'Business process automation',
    tagline: 'Replace brittle manual handoffs across finance, rev-ops, and procurement.',
    trigger: 'ERP Invoice / PO Event',
    agentAction: 'Cross-checks ledger, vendor terms & tax rules automatically',
    humanGate: 'Controller approves exception writes in one click',
    outcomeStat: '68%',
    outcomeLabel: 'Reduction in cycle time',
    image: GENERATED_IMAGES.agentsOrbit,
  },
  {
    id: 'workflow',
    iconName: 'workflow',
    color: 'text-[#9B87F5]',
    label: 'AI workflow automation',
    tagline: 'Autonomous multi-step agents triggered directly from Slack, CRM, or webhooks.',
    trigger: 'Inbound Lead or Support Ticket',
    agentAction: 'Enriches account context, drafts tailored plan & routes owner',
    humanGate: 'Account lead reviews & dispatches outbound write',
    outcomeStat: '3.8x',
    outcomeLabel: 'Faster pipeline throughput',
    image: GENERATED_IMAGES.labsCore,
  },
  {
    id: 'idp',
    iconName: 'fileText',
    color: 'text-[#FF6A2B]',
    label: 'Intelligent document processing',
    tagline: 'Extract, validate, and structure PDFs, contracts, bills of lading, and claims.',
    trigger: 'Unstructured PDF / Scan Upload',
    agentAction: 'Parses line items, flags clause anomalies & maps to schema',
    humanGate: 'Analyst verifies flagged fields before ERP commit',
    outcomeStat: '99.4%',
    outcomeLabel: 'Extraction accuracy',
    image: GENERATED_IMAGES.voiceDoc,
  },
  {
    id: 'voice',
    iconName: 'audioLines',
    color: 'text-[#9B87F5]',
    label: 'AI voice agent',
    tagline: 'Ultra-low-latency conversational voice agents for intake, triage, and booking.',
    trigger: 'Inbound / Outbound Call Stream',
    agentAction: 'Qualifies caller intent, books calendar slots & syncs CRM live',
    humanGate: 'Warm handoff with transcript summary for edge cases',
    outcomeStat: '<350ms',
    outcomeLabel: 'Conversational response latency',
    image: GENERATED_IMAGES.voiceDoc,
  },
  {
    id: 'scribe',
    iconName: 'stethoscope',
    color: 'text-[#FF6A2B]',
    label: 'AI scribe for clinical notes',
    tagline: 'Ambient consultation capture formatted directly into structured EHR SOAP notes.',
    trigger: 'Clinician-Patient Encounter',
    agentAction: 'Generates structured SOAP note, ICD-10 & CPT coding',
    humanGate: 'Attending physician signs off before EHR lock',
    outcomeStat: '2.4 hrs',
    outcomeLabel: 'Saved per clinician daily',
    image: GENERATED_IMAGES.clinicalHelix,
  },
  {
    id: 'prior-auth',
    iconName: 'clipboardCheck',
    color: 'text-[#9B87F5]',
    label: 'Prior authorization automation',
    tagline: 'Assemble clinical evidence packets and check payer policy rules in seconds.',
    trigger: 'Order / Procedure Referral',
    agentAction: 'Matches medical necessity criteria & compiles payer packet',
    humanGate: 'Care coordinator signs & submits authorization',
    outcomeStat: '78%',
    outcomeLabel: 'Faster payer approvals',
    image: GENERATED_IMAGES.clinicalHelix,
  },
  {
    id: 'regulatory',
    iconName: 'scale',
    color: 'text-[#FF6A2B]',
    label: 'AI regulatory documents',
    tagline: 'Draft, trace, and audit compliance filings with cryptographic source citation.',
    trigger: 'Policy Update or Filing Cycle',
    agentAction: 'Maps model & operational controls to EU AI Act / SOC 2',
    humanGate: 'Compliance officer signs verifiable attestation log',
    outcomeStat: '100%',
    outcomeLabel: 'Traceable citation coverage',
    image: GENERATED_IMAGES.securityVault,
  },
  {
    id: 'healthcare',
    iconName: 'heartPulse',
    color: 'text-[#9B87F5]',
    label: 'Healthcare AI solutions',
    tagline: 'HIPAA-ready clinical triage, FHIR R4 interoperability, and patient follow-ups.',
    trigger: 'HL7 / FHIR R4 Clinical Event',
    agentAction: 'Synthesizes longitudinal history & flags care gaps',
    humanGate: 'Licensed care team approves intervention plan',
    outcomeStat: '100%',
    outcomeLabel: 'HIPAA BAA audit readiness',
    image: GENERATED_IMAGES.clinicalHelix,
  },
];

export const VELOCITY_STEPS = [
  {
    step: 'STEP 01',
    title: 'Principal architect owns',
    desc: 'A named senior architect owns your build end to end. No junior bench rotated onto critical paths.',
  },
  {
    step: 'STEP 02',
    title: 'Governed AI acceleration',
    desc: 'AI accelerates scaffolding under strict architectural rules, with secret and hallucination scans every commit.',
  },
  {
    step: 'STEP 03',
    title: 'Agentic QA every commit',
    desc: 'Automated regression and end-to-end test suites run continuously so defects surface in minutes.',
  },
  {
    step: 'STEP 04',
    title: 'Fixed-price outcome',
    desc: 'You know exact scope, deliverables, and cost upfront. We align incentives around shipping, not billable hours.',
  },
];

export interface CaseStudy {
  cat: string;
  name: string;
  desc: string;
  m1: string;
  m2: string;
  tags: string;
  problem: string;
  built: string;
  sector: 'Healthcare' | 'Fintech' | 'AI' | 'Ecommerce' | 'EdTech' | 'Logistics';
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    cat: 'Healthcare',
    name: 'VeloHealth Network',
    desc: 'Connecting regional payors, outpatient clinics, and pharmacies in real time.',
    m1: '32M+ Covered lives unified',
    m2: '1,900+ Pharmacies connected',
    tags: 'STRATEGY • WEB • APP',
    sector: 'Healthcare',
    problem:
      'Disconnected clinical eligibility checks and strict HIPAA audit demands slowed down prescription fulfillment.',
    built:
      'Unified FHIR care coordination portal and pharmacy routing API with zero-trust access controls.',
  },
  {
    cat: 'Workforce — Live',
    name: 'Talynk',
    desc: 'AI-matched skilled workforce discovery scaling nationwide across mobile.',
    m1: '18M+ Mobile app downloads',
    m2: '<120ms Candidate feed latency',
    tags: 'STRATEGY • DESIGN • APP',
    sector: 'AI',
    problem:
      'Regional job seekers struggled with English-only forms and slow recruiter response loops.',
    built:
      'Engineered the mobile-first architecture with voice profile intake and instant hiring chat from day zero.',
  },
  {
    cat: 'AI Recruiting — Live',
    name: 'TalentMesh AI',
    desc: 'Autonomous candidate screening and structured technical evaluation.',
    m1: '25K+ Verified engineers',
    m2: '1,800+ Hiring teams',
    tags: 'AI • WEB • APP',
    sector: 'AI',
    problem:
      'High-growth hiring teams faced weeks of manual resume triage and inconsistent interview scorecards.',
    built:
      'Multi-agent AI screening pipeline with explainable skill rubrics and live recruiter dashboards.',
  },
  {
    cat: 'Logistics (AI)',
    name: 'FleetPulse',
    desc: 'Cross-border freight compliance & driver inspection AI across US and Canada.',
    m1: '18 Compliance areas',
    m2: '99.4% Doc extraction',
    tags: 'AI • WEB • APP',
    sector: 'Logistics',
    problem:
      'Interstate trucking operators faced DOT audit penalties from fragmented driver logs and manual permits.',
    built:
      'Offline-ready driver mobile app synced with an AI compliance hub flagging expirations automatically.',
  },
  {
    cat: 'Fintech — Live',
    name: 'CredFlow',
    desc: 'Digital underwriting & financial product distribution for Tier 2 & 3 cities.',
    m1: '4.2M+ Customers served',
    m2: '900K+ Financial advisors',
    tags: 'STRATEGY • DESIGN • APP',
    sector: 'Fintech',
    problem:
      'Independent financial advisors lacked a single compliant mobile cockpit for instant KYC and payouts.',
    built:
      'PCI-DSS isolated advisor mobile app and real-time commission ledger handling millions of checks.',
  },
  {
    cat: 'Telehealth',
    name: 'Serenova Care',
    desc: 'Unified behavioral health, psychiatry scheduling, and care continuity.',
    m1: '18,000+ Active patients',
    m2: '42% Fewer no-shows',
    tags: 'DESIGN • WEB • APP',
    sector: 'Healthcare',
    problem:
      'High patient drop-off between initial clinical intake, insurance verification, and follow-up visits.',
    built:
      'HIPAA-compliant telehealth platform with automated care nudges and encrypted clinician session notes.',
  },
  {
    cat: 'Health & Wellness',
    name: 'VitalEdge',
    desc: 'Preventive diagnostics commerce paired with guided metabolic coaching.',
    m1: '1.8M+ Patients served',
    m2: '65K+ Monthly orders',
    tags: 'DESIGN • APP',
    sector: 'Healthcare',
    problem:
      'Diagnostics lab commerce was disconnected from longitudinal biomarker tracking and habit coaching.',
    built:
      'Dual mobile ecosystem uniting smart lab-report parsing, auto-refills, and personalized coaching.',
  },
  {
    cat: 'Retail Commerce',
    name: 'VogueCart',
    desc: 'Visual search fashion commerce engineered for sub-3-tap mobile checkout.',
    m1: '650K+ Downloads in Q1',
    m2: '+34% Checkout conversion',
    tags: 'DESIGN • APP',
    sector: 'Ecommerce',
    problem:
      'Legacy storefront suffered slow catalog discovery during flash drops and high cart abandonment.',
    built:
      'Rebuilt native iOS/Android shopping client with vector visual search and edge-cached inventory sync.',
  },
  {
    cat: 'Performance Club',
    name: 'PeakClub',
    desc: 'Invite-only athletic recovery & coaching companion app.',
    m1: '1,200+ Club athletes',
    m2: '4.9/5 App store rating',
    tags: 'DESIGN • APP',
    sector: 'Healthcare',
    problem:
      'Luxury athletic studios needed a bespoke member app integrating wearable HRV data and trainer bookings.',
    built:
      'Custom native member experience syncing recovery metrics, personalized nutrition, and studio scheduling.',
  },
  {
    cat: 'Ecommerce — Live',
    name: 'ScaleMart D2C',
    desc: 'High-throughput headless commerce engine serving nationwide fulfillment.',
    m1: '12M+ Orders shipped',
    m2: '12,000+ Pin codes',
    tags: 'SHOPIFY PLUS • WEB',
    sector: 'Ecommerce',
    problem:
      'Flash sale spikes routinely degraded checkout latency and desynced multi-warehouse inventory.',
    built:
      'Custom headless storefront integrating regional warehouse routing, RTO scoring, and edge caching.',
  },
  {
    cat: 'Health Tech (AI)',
    name: 'AegisEHR',
    desc: 'AI-native clinical workspace featuring ambient SOAP notes and coding support.',
    m1: '8 Clinical modules',
    m2: 'FHIR R4 Native API',
    tags: 'AI • WEB • APP',
    sector: 'Healthcare',
    problem:
      'Physicians spent over two hours after clinic hours finishing charts and fighting prior-auth denials.',
    built:
      'Ambient voice-to-SOAP documentation engine and automated payer necessity packet compiler.',
  },
  {
    cat: 'Health IoT — Live',
    name: 'PulseRing',
    desc: 'Ultra-low-latency smart ring wearable companion and sleep telemetry app.',
    m1: '96.4% HRV accuracy',
    m2: '40K+ Connected rings',
    tags: 'STRATEGY • APP • IOT',
    sector: 'Healthcare',
    problem:
      'Consumer smart ring hardware required reliable BLE background sync and clinical-grade sleep staging.',
    built:
      'Native BLE firmware bridge and clean biometric analytics app built for continuous daily wear.',
  },
  {
    cat: 'EdTech — Live',
    name: 'CodeSprout',
    desc: 'Interactive live coding classrooms and project sandboxes for K-12 learners.',
    m1: '8,500+ Students taught',
    m2: '9+ Countries reached',
    tags: 'DESIGN • WEB',
    sector: 'EdTech',
    problem:
      'Needed browser-based code execution, live mentor video, and automated parent milestone reports.',
    built:
      'Full-stack web learning platform supporting real-time collaborative coding rooms and AI hints.',
  },
];

export interface LabProduct {
  id: string;
  label: string;
  badge1: string;
  badge2: string;
  title: string;
  subtitle: string;
  desc: string;
  s1: string;
  l1: string;
  s2: string;
  l2: string;
  s3: string;
  l3: string;
  image: string;
  agentExample: string;
  capabilities: string[];
}

export const LABS_PRODUCTS: LabProduct[] = [
  {
    id: 'rhinonos',
    label: 'RhinonOS Agents',
    badge1: 'FLAGSHIP',
    badge2: 'PRODUCTION',
    title: 'RhinonOS Agents',
    subtitle: 'Autonomous Multi-Agent Core for Enterprise Operations',
    desc: 'Enterprise AI agents orchestrated across finance, RevOps, and procurement—connected directly to your ERP/CRM and governed by human approval gates.',
    s1: '340+',
    l1: 'agents live in production',
    s2: '15+',
    l2: 'business functions orchestrated',
    s3: '110+',
    l3: 'workflows automated end to end',
    image: GENERATED_IMAGES.labsRhinonOS,
    agentExample: '@RhinonOS-FinOps reconcile Q3 vendor invoices in NetSuite & flag variances',
    capabilities: ['Autonomous Execution', 'Persistent Memory', 'Human Approval Chain'],
  },
  {
    id: 'rhinonmed',
    label: 'RhinonMed Scribe',
    badge1: 'HEALTHCARE AI',
    badge2: 'FHIR R4',
    title: 'RhinonMed Scribe',
    subtitle: 'Ambient Clinical Intelligence & EHR Automation',
    desc: 'Ambient clinical documentation and patient triage engine engineered for multi-specialty hospital networks with native FHIR R4 EHR sync.',
    s1: '8',
    l1: 'clinical modules',
    s2: 'FHIR R4',
    l2: 'interoperability standard',
    s3: '100%',
    l3: 'HIPAA audit readiness',
    image: GENERATED_IMAGES.labsRhinonMed,
    agentExample: '@RhinonMed draft structured SOAP note & verify Epic medication allergies',
    capabilities: ['Ambient Medical Scribe', 'ICD-10 & CPT Coding', 'HIPAA BAA Ready'],
  },
  {
    id: 'rhinonguard',
    label: 'RhinonGuard',
    badge1: 'GOVERNANCE',
    badge2: 'EU AI ACT',
    title: 'RhinonGuard',
    subtitle: 'Enterprise AI Model Registry & Policy Guardrails',
    desc: 'Centralized AI governance control plane mapping production models, prompts, and autonomous agents to EU AI Act risk tiers and SOC 2 controls.',
    s1: '4',
    l1: 'risk tiers tracked',
    s2: '24/7',
    l2: 'guardrail telemetry',
    s3: '100%',
    l3: 'immutable audit logs',
    image: GENERATED_IMAGES.labsRhinonGuard,
    agentExample: '@RhinonGuard classify RAG endpoint & verify automated PII redaction',
    capabilities: ['EU AI Act Mapping', 'Prompt-Injection Guard', 'Immutable Audit Trail'],
  },
  {
    id: 'rhinonflow',
    label: 'RhinonFlow Docs',
    badge1: 'AUTOMATION',
    badge2: 'PRODUCTION',
    title: 'RhinonFlow Docs',
    subtitle: 'Prior Authorization & Intelligent Document Engine',
    desc: 'High-accuracy document parsing and automated prior-authorization packet builder for healthcare payers, freight carriers, and underwriting teams.',
    s1: '78%',
    l1: 'faster approvals',
    s2: '99.4%',
    l2: 'extraction accuracy',
    s3: '12x',
    l3: 'review throughput',
    image: GENERATED_IMAGES.labsRhinonFlow,
    agentExample: '@RhinonFlow compile payer medical necessity packet from clinical PDFs',
    capabilities: ['Auto-Packet Assembly', 'Policy Rule Matching', '12x Review Speed'],
  },
  {
    id: 'rhinonseal',
    label: 'RhinonSeal',
    badge1: 'PROVENANCE',
    badge2: 'CRYPTOGRAPHIC',
    title: 'RhinonSeal',
    subtitle: 'Verifiable Cryptographic Provenance for AI Outputs',
    desc: 'Cryptographic signing and tamper-proof verification layer for regulated enterprise AI reports, clinical exports, and automated financial audits.',
    s1: '100%',
    l1: 'signed provenance',
    s2: '<35ms',
    l2: 'verification latency',
    s3: 'SOC 2',
    l3: 'aligned controls',
    image: GENERATED_IMAGES.labsRhinonSeal,
    agentExample: '@RhinonSeal sign SHA-256 Merkle proof for exported compliance dossier',
    capabilities: ['SHA-256 Attestation', '<35ms Verification', 'Zero Tampering'],
  },
];

export interface IndustryItem {
  id: string;
  label: string;
  title: string;
  desc: string;
  cs: string;
  m1: string;
  l1: string;
  m2: string;
  l2: string;
  linkedCaseName?: string;
}

export const INDUSTRIES: IndustryItem[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    title: 'Healthcare',
    desc: 'HIPAA-ready platforms, EHR integrations and ambient clinical AI built with a BAA as standard and deterministic audit trails from day one.',
    cs: 'Case Highlight: AegisEHR & VeloHealth — uniting ambient medical scribes with compliant care coordination',
    m1: '68%',
    l1: 'faster clinician & patient coordination',
    m2: '42%',
    l2: 'fewer missed appointments',
    linkedCaseName: 'AegisEHR',
  },
  {
    id: 'fintech',
    label: 'Fintech',
    title: 'Fintech',
    desc: 'PCI-DSS isolated mobile banking, lending automation, and advisor distribution networks built for high-volume regulated transactions.',
    cs: 'Case Highlight: CredFlow — instant underwriting & advisor commission ledgers across emerging markets',
    m1: '4.2M+',
    l1: 'customers served nationwide',
    m2: '900K+',
    l2: 'active financial advisors',
    linkedCaseName: 'CredFlow',
  },
  {
    id: 'ecommerce',
    label: 'eCommerce',
    title: 'eCommerce',
    desc: 'Headless high-conversion storefronts, AI visual search, and native mobile shopping built for sub-3-tap checkout speed.',
    cs: 'Case Highlight: ScaleMart D2C & VogueCart — scaling omnichannel retail without checkout bottlenecks',
    m1: '12M+',
    l1: 'orders fulfilled seamlessly',
    m2: '+34%',
    l2: 'checkout conversion uplift',
    linkedCaseName: 'VogueCart',
  },
  {
    id: 'education',
    label: 'Education',
    title: 'Education',
    desc: 'Interactive live coding classrooms, AI assessment sandboxes, and global cohort platforms engineered for student scale.',
    cs: 'Case Highlight: CodeSprout — browser-native interactive STEM labs across 9+ countries',
    m1: '8,500+',
    l1: 'students mentored globally',
    m2: '9+',
    l2: 'countries supported',
    linkedCaseName: 'CodeSprout',
  },
  {
    id: 'logistics',
    label: 'Logistics',
    title: 'Logistics',
    desc: 'AI fleet compliance, offline-resilient driver apps, and real-time dispatch dashboards for cross-border North American carriers.',
    cs: 'Case Highlight: FleetPulse — automated DOT & NSC regulatory tracking across 18 compliance domains',
    m1: '18',
    l1: 'compliance areas automated',
    m2: '99.4%',
    l2: 'document accuracy',
    linkedCaseName: 'FleetPulse',
  },
  {
    id: 'realestate',
    label: 'Real estate',
    title: 'Real estate',
    desc: 'Intelligent lease abstraction, property discovery portals, and automated tenant workflows for commercial and residential portfolios.',
    cs: 'Case Highlight: AI lease intelligence & portfolio dispatch automation for multi-city operators',
    m1: '4x',
    l1: 'faster lease review turnaround',
    m2: '99.4%',
    l2: 'clause extraction accuracy',
  },
];

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  links: Array<{ label: string; action: 'story' | 'case' | 'linkedin'; target?: string }>;
  fullStory: string;
  outcome: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'marcus',
    quote:
      "We didn't just hire an engineering vendor—RhinonLabs integrated like our own founding product team. Every architectural decision was transparent, tested, and delivered ahead of schedule.",
    author: 'Marcus Lindqvist',
    role: 'Founder & CEO · PeakClub',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'PeakClub' },
    ],
    fullStory:
      'PeakClub partnered with RhinonLabs to craft their invite-only athletic recovery companion app from UX wireframes through native iOS & Android store launch.',
    outcome: '1,200+ active members with a sustained 4.9/5 store rating.',
  },
  {
    id: 'talentmesh',
    quote:
      'Dependable, accountable, and unusually fast. When an enterprise university pilot requested custom SSO and rubric filters overnight, RhinonLabs shipped and verified the build in 7 hours.',
    author: 'Rohan Kulkarni & Elena Vance',
    role: 'Co-founders · TalentMesh AI',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'TalentMesh AI' },
    ],
    fullStory:
      'Facing an urgent enterprise pilot deadline, RhinonLabs staff engineers shipped custom candidate evaluation workflows overnight, locking in multi-campus rollout.',
    outcome: '25K+ verified engineers and 1,800+ hiring teams onboarded.',
  },
  {
    id: 'david',
    quote:
      'We brought RhinonLabs in when all we had was an architecture sketch. They delivered the production v1 in weeks, scaled seamlessly to millions of users, and stayed as our long-term engineering partner.',
    author: 'David Chen',
    role: 'VP of Product · Talynk',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'Talynk' },
    ],
    fullStory:
      'RhinonLabs embedded senior mobile and distributed systems engineers from day zero, taking Talynk from concept through nationwide hyper-scale.',
    outcome: '18M+ mobile downloads with sub-120ms matching latency.',
  },
  {
    id: 'sarah',
    quote:
      'RhinonLabs helped us ship our AI MVP in five weeks with full HIPAA controls baked into CI/CD. Having a principal architect lead every sprint made the entire launch effortless.',
    author: 'Sarah Al-Mansoor',
    role: 'Director of Digital Health · AegisEHR',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'AegisEHR' },
    ],
    fullStory:
      'AegisEHR engaged a fixed-price RhinonLabs AI Velocity Pod to ship ambient medical documentation and FHIR R4 clinical integration ahead of hospital pilots.',
    outcome: '68% reduction in physician after-hours charting across 8 clinical modules.',
  },
  {
    id: 'priya',
    quote:
      'They understood our mission immediately and unified diagnostics e-commerce with personalized coaching into an intuitive app our patients genuinely love using every day.',
    author: 'Priya Nair',
    role: 'Head of Consumer Products · VitalEdge',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'VitalEdge' },
    ],
    fullStory:
      'VitalEdge partnered with RhinonLabs to unite preventive lab-test commerce and automated biomarker coaching inside a dual mobile experience.',
    outcome: '1.8M+ patients served and 65K+ monthly fulfilled orders.',
  },
  {
    id: 'arjun',
    quote:
      'From initial fintech concept to a nationwide advisor platform, RhinonLabs engineered every core ledger and KYC workflow inside our team with remarkable attention to security and speed.',
    author: 'Arjun Deshmukh',
    role: 'CEO · CredFlow',
    links: [
      { label: 'Read reference', action: 'story' },
      { label: 'See project', action: 'case', target: 'CredFlow' },
    ],
    fullStory:
      'From zero-to-one underwriting architecture through PCI-DSS hardening, RhinonLabs built the core mobile engine powering CredFlow nationwide.',
    outcome: '4.2M+ end customers served across 900K+ financial advisors.',
  },
];

export const SECURITY_PILLARS = [
  {
    num: '01',
    title: 'Data privacy & private VPC',
    detail:
      'Zero foundation-model training on client data, GDPR/DPDP/CCPA compliance, AES-256 encryption at rest, and TLS 1.3 in transit.',
  },
  {
    num: '02',
    title: 'Security & risk management',
    detail:
      'ISO 27001 aligned ISMS, automated secret and dependency scanning on every commit, and SOC 2 access controls.',
  },
  {
    num: '03',
    title: 'AI-specific governance',
    detail:
      'EU AI Act risk classification, prompt-injection guardrails, human-in-the-loop write approvals, and cryptographic audit logs.',
  },
  {
    num: '04',
    title: 'Regulated industry standards',
    detail:
      'HIPAA BAA readiness for clinical software, PCI-DSS payment isolation for fintech, and ISO 9001 quality execution.',
  },
];

export const PRESS_COVERAGE = [
  { outlet: 'ISO 27001 Aligned', headline: 'Enterprise Information Security Management Controls' },
  { outlet: 'HIPAA & FHIR R4', headline: 'Production Clinical & BAA-Ready Architectures' },
  { outlet: 'EU AI Act Ready', headline: 'Deterministic Guardrails & Signed Provenance' },
  { outlet: 'PCI-DSS Isolated', headline: 'High-Throughput Fintech & Payment Systems' },
  { outlet: 'ISO 9001 Standards', headline: 'Governed AI Velocity Pod Delivery Quality' },
  { outlet: '320+ Launches', headline: 'Mobile, SaaS & AI Deployments Across 22+ Countries' },
];

export const COUNTRY_PHONE_CODES: Record<string, { code: string; placeholder: string }> = {
  India: { code: '+91', placeholder: '+91 98XXX XXXXX' },
  'United States': { code: '+1', placeholder: '+1 (415) 555-0192' },
  'United Kingdom': { code: '+44', placeholder: '+44 7700 900077' },
  'United Arab Emirates': { code: '+971', placeholder: '+971 50 555 0142' },
  Canada: { code: '+1', placeholder: '+1 (416) 555-0148' },
  Australia: { code: '+61', placeholder: '+61 412 345 678' },
  Singapore: { code: '+65', placeholder: '+65 9123 4567' },
};

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: 'Do we own 100% of the source code, AI prompts, and trained models?',
    a: 'Yes. From the very first commit under mutual NDA, every line of code, prompt template, fine-tuned weight, Terraform script, and cloud pipeline belongs exclusively to you with zero vendor lock-in or licensing royalties.',
  },
  {
    q: 'How fast can an AI Velocity Pod start shipping production software?',
    a: 'We sign an NDA before your 30-minute discovery call, finalize fixed scope within 48 hours, and merge your first production pull request by day 4. Focused MVPs typically ship in 4–8 weeks.',
  },
  {
    q: 'Can you deploy RhinonOS Agents or RhinonMed Scribe inside our private VPC?',
    a: 'Yes. Every RhinonLabs AI system and custom agent workflow runs inside your AWS, Azure, or Google Cloud VPC so sensitive patient, financial, or ERP records never leave your security perimeter or train external models.',
  },
  {
    q: 'How does human-in-the-loop approval work for autonomous agents?',
    a: 'Agents read, extract, draft, and prepare ledger or EHR payloads autonomously, then pause at deterministic approval gates where an authorized team member confirms writes in one click with signed audit logs.',
  },
  {
    q: 'What compliance standards do your builds support out of the box?',
    a: 'Our CI/CD pipelines and cloud blueprints align with ISO 27001, SOC 2 Type II controls, GDPR/DPDP data privacy, HIPAA with Business Associate Agreements (BAA) for healthcare, PCI-DSS for fintech, and EU AI Act risk classification.',
  },
  {
    q: 'Should we choose a fixed-price MVP pod or dedicated senior developers?',
    a: 'Choose a fixed-price AI Velocity Pod when you want guaranteed delivery of a defined product milestone on an exact date and budget. Choose dedicated staff-level engineers (matched within 48 hours) when you want embedded capacity working inside your daily sprints.',
  },
];

