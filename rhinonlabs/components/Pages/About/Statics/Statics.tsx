'use client'
import { motion } from "framer-motion";

const proofPoints = [
    {
        label: '2–4 weeks',
        heading: 'Typical delivery',
        body: "From kickoff to a live, working product. Not a prototype — something your team can actually use.",
    },
    {
        label: 'Yours to keep',
        heading: 'Full code ownership',
        body: "You get the code, the designs and every account we set up. No lock-in, no ongoing licence, no dependency on us to run it.",
    },
    {
        label: 'Weekly',
        heading: 'Release cadence',
        body: "We ship to a live staging link every week so you see real progress — not a big reveal at the end.",
    },
    {
        label: '30+',
        heading: 'Integrations supported',
        body: "CRMs, accounting tools, WhatsApp, Google Workspace, Tally, Slack and more — we connect what you already use.",
    },
]

const Statics = () => {
    return (
        <div className="py-20 px-5 flex flex-col gap-14 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">How We Work</p>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
                    What to expect<br />
                    <span className="text-white/50">when you work with us.</span>
                </h2>
            </div>
            <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2">
                {proofPoints.map((p, i) => (
                    <motion.div
                        key={i}
                        className="flex flex-col gap-3 bg-[#070a14] p-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.08 }}
                        viewport={{ once: true }}
                    >
                        <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">{p.label}</span>
                        <h3 className="text-xl font-semibold text-white">{p.heading}</h3>
                        <p className="text-[15px] text-white/60 leading-relaxed">{p.body}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default Statics;
