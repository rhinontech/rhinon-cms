"use client";

import { generateEmailHtml } from "@/lib/email-templates";

export default function EmailDebugPage() {
  const dummyContent = `
# Unlocking Growth at TechFlow

Hi Marcus,

I'm Alex from **Rhinon**, and I've been following TechFlow's recent expansion into the APAC market. 

We help high-growth companies like yours orchestrate their internal data to find hidden efficiencies and scale faster. Specifically, our **Deep Intel** engine can help you:

* **Automate Reporting**: No more manual spreadsheet updates.
* **Unified Dashboards**: Sales, Marketing, and Ops in one view.
* **Reactive Decisions**: Real-time alerts on your moving KPIs.

Would you be open to a 10-minute discovery call next Tuesday?

Best,
Alex Mercer
  `;

  const htmlContent = generateEmailHtml(dummyContent);

  return (
    <div className="min-h-screen bg-slate-900 p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl overflow-hidden">
        <header className="mb-8 border-b border-slate-700 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Email Template Lab</h1>
            <p className="text-slate-400 text-sm font-medium">Previewing Branded Night Theme orchestration</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              Responsive
            </span>
            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              Dark Theme
            </span>
          </div>
        </header>
        
        <div className="flex gap-8">
          {/* Controls/Source */}
          <div className="w-1/3 flex flex-col gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source Markdown</label>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-400 font-mono whitespace-pre-wrap border border-slate-900 leading-relaxed overflow-auto max-h-[500px]">
              {dummyContent}
            </pre>
          </div>

          {/* Render Frame */}
          <div className="flex-1 flex flex-col gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Live Preview (IFrame Container)</label>
            <div className="w-full h-[650px] bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-950">
              <iframe 
                srcDoc={htmlContent} 
                className="w-full h-full border-0"
                title="Email Template Preview"
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center italic font-medium">
              This renders the tr/td table structure exactly as it will appear in lead inboxes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
