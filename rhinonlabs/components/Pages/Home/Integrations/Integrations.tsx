import { Layers } from 'lucide-react';
import {
    siAirtable, siAnthropic, siAsana, siCalendly, siClickup, siFirebase, siGmail, siGooglecalendar,
    siGoogledrive, siGooglegemini, siGooglesheets, siHubspot, siIntercom, siJira, siMake, siN8n, siNotion,
    siPostgresql, siQuickbooks, siRazorpay, siShopify, siStripe, siSupabase, siTelegram, siWebflow,
    siWhatsapp, siWordpress, siXero, siZapier, siZoho, siZoom,
    type SimpleIcon,
} from 'simple-icons';

/**
 * Real brand logos (simple-icons, official colours), grouped by what the tool
 * does so the section answers "will it work with my stack?" at a glance.
 * Each logo sits on a light app-icon tile: several brand marks are near-black
 * (Notion, Anthropic, Razorpay) and would vanish on the dark page.
 *
 * Server component on purpose — the SVG paths ship as HTML, not JavaScript.
 */
const GROUPS: { title: string; blurb: string; tools: { name: string; icon: SimpleIcon }[] }[] = [
    {
        title: 'CRM & Sales',
        blurb: 'Leads captured, scored and followed up.',
        tools: [
            { name: 'HubSpot', icon: siHubspot },
            { name: 'Zoho', icon: siZoho },
            { name: 'Calendly', icon: siCalendly },
            { name: 'Airtable', icon: siAirtable },
        ],
    },
    {
        title: 'Payments & Accounting',
        blurb: 'Invoices, reminders and reconciliation.',
        tools: [
            { name: 'Stripe', icon: siStripe },
            { name: 'Razorpay', icon: siRazorpay },
            { name: 'QuickBooks', icon: siQuickbooks },
            { name: 'Xero', icon: siXero },
        ],
    },
    {
        title: 'Communication',
        blurb: 'Alerts and replies where your team already is.',
        tools: [
            { name: 'Gmail', icon: siGmail },
            { name: 'WhatsApp', icon: siWhatsapp },
            { name: 'Telegram', icon: siTelegram },
            { name: 'Zoom', icon: siZoom },
            { name: 'Intercom', icon: siIntercom },
        ],
    },
    {
        title: 'Work & Projects',
        blurb: 'Docs, tasks and schedules kept in sync.',
        tools: [
            { name: 'Notion', icon: siNotion },
            { name: 'Google Sheets', icon: siGooglesheets },
            { name: 'Google Drive', icon: siGoogledrive },
            { name: 'Google Calendar', icon: siGooglecalendar },
            { name: 'ClickUp', icon: siClickup },
            { name: 'Jira', icon: siJira },
            { name: 'Asana', icon: siAsana },
        ],
    },
    {
        title: 'Automation & AI',
        blurb: 'Your workflows, with models that do the reading.',
        tools: [
            { name: 'Zapier', icon: siZapier },
            { name: 'Make', icon: siMake },
            { name: 'n8n', icon: siN8n },
            { name: 'Gemini', icon: siGooglegemini },
            { name: 'Claude', icon: siAnthropic },
        ],
    },
    {
        title: 'Web, Commerce & Data',
        blurb: 'Storefronts, sites and the databases behind them.',
        tools: [
            { name: 'Shopify', icon: siShopify },
            { name: 'WordPress', icon: siWordpress },
            { name: 'Webflow', icon: siWebflow },
            { name: 'Supabase', icon: siSupabase },
            { name: 'Firebase', icon: siFirebase },
            { name: 'PostgreSQL', icon: siPostgresql },
        ],
    },
];

function Logo({ name, icon }: { name: string; icon: SimpleIcon }) {
    return (
        <li className="group/logo flex flex-col items-center gap-2 w-16">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_6px_20px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-transform duration-300 group-hover/logo:-translate-y-1">
                <svg role="img" aria-label={name} viewBox="0 0 24 24" className="h-6 w-6" fill={`#${icon.hex}`}>
                    <path d={icon.path} />
                </svg>
            </span>
            <span className="text-[11px] leading-tight text-white/60 text-center">{name}</span>
        </li>
    );
}

export function Integrations() {
    const total = GROUPS.reduce((n, g) => n + g.tools.length, 0);
    return (
        <section id="integrations" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]">
                    <Layers className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                        Integrations
                    </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6">
                    Works with the tools <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-[#c7d4ff] via-[#8fa6ff] to-[#5b7bff] pr-1">you already use</span>
                </h2>

                <p className="text-white/70 mb-16 max-w-2xl">
                    We connect your existing software instead of replacing it — data moves between them automatically, so nobody copies anything by hand.
                </p>

                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 text-left">
                    {GROUPS.map((g) => (
                        <div
                            key={g.title}
                            className="rounded-2xl border border-[#D8E7F2]/7 bg-white/[0.02] p-6 shadow-[inset_0_2px_1px_rgba(207,231,255,0.15)]"
                        >
                            <h3 className="text-white text-lg font-semibold tracking-tight">{g.title}</h3>
                            <p className="mt-1 mb-6 text-[14px] text-white/60">{g.blurb}</p>
                            <ul className="flex flex-wrap gap-x-3 gap-y-4">
                                {g.tools.map((t) => (
                                    <Logo key={t.name} {...t} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <p className="mt-14 text-white/70 max-w-2xl">
                    These {total} are just the common ones. If a tool has an API, webhook or export, we can connect it.
                </p>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-[4px]"
                style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)' }}
            />
        </section>
    );
}
