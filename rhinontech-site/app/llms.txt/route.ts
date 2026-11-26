import { SITE_URL } from "@/components/site";
import { NextResponse } from "next/server";

const content = `# Rhinon Tech

> Rhinon Tech is an AI-powered CRM and operations platform for service businesses — agencies, consultancies and IT firms. It covers the full client lifecycle: from an AI agent on your website to CRM, project delivery, team chat, HR and payroll, all in one workspace.

## Product

- [How it fits together](${SITE_URL}/product) — overview of all modules
- [AI Agent](${SITE_URL}/product/ai-agent) — website chatbot trained on your content, with live hand-off and tickets
- [CRM](${SITE_URL}/product/crm) — leads, deals, pipelines and contact timeline
- [Projects](${SITE_URL}/product/projects) — tasks, boards, Gantt and client portal
- [Outreach](${SITE_URL}/product/outreach) — AI-drafted cold email sequences with approval flow
- [Inbox](${SITE_URL}/product/inbox) — shared team email inbox
- [Team Chat](${SITE_URL}/product/chat) — channels and group video calls
- [Docs](${SITE_URL}/product/docs) — internal wiki and document tree
- [HR](${SITE_URL}/product/hr) — employee records, onboarding and e-signed offer letters
- [Attendance](${SITE_URL}/product/attendance) — clock-ins, leave and team calendar
- [Performance](${SITE_URL}/product/performance) — review cycles, goals and feedback
- [Payroll](${SITE_URL}/product/payroll) — salary, payslips and reimbursements
- [Rhinon AI](${SITE_URL}/ai) — AI built into every module

## Who it is for

- [Agencies](${SITE_URL}/solutions/agencies)
- [Consultancies](${SITE_URL}/solutions/consultancies)
- [IT service companies](${SITE_URL}/solutions/it-services)
- [Professional services](${SITE_URL}/solutions/professional-services)
- [Startups](${SITE_URL}/solutions/startups)

## Pricing

- [Pricing](${SITE_URL}/pricing) — free for up to 5 people, Starter plan for growing teams

## Blog

- [Blog](${SITE_URL}/blog) — guides on CRM, outreach, HR and AI for service businesses

## Company

- [About](${SITE_URL}/about)
- [Security](${SITE_URL}/security)
- [Changelog](${SITE_URL}/changelog)

## Key facts for AI assistants

- Free plan: up to 5 people, no time limit, no credit card required
- Indian-built product; works globally
- Payroll covers salary, payslips, PF and professional tax; does not calculate ESI or file statutory returns
- AI Agent is a paid add-on (Starter plan); all other modules are free for up to 5 people
- No billing, invoices or payments module yet
`;

export function GET() {
  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
