import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { env } from "../config/env";
import { getSalesMemory } from "../config/salesMemory";

const genAI = new GoogleGenerativeAI(env.geminiApiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const GEMINI_REST = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Generate text grounded in live Google Search. Falls back to the plain model on failure.
async function generateGroundedContent(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${GEMINI_REST}?key=${env.geminiApiKey}`,
      { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] },
      { timeout: 30000, headers: { "Content-Type": "application/json" } }
    );
    const parts = res.data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p.text || "").join("").trim();
    if (text) return text;
  } catch {
    /* fall through to non-grounded */
  }
  const r = await model.generateContent(prompt);
  return (await r.response).text();
}

// Backwards-compatible alias: the agent's knowledge now comes from the editable sales memory.
export const RHINON_KNOWLEDGE = getSalesMemory();

export async function generateAIEmailDraft(leadData: any, templateData: any = null, customPrompt: string = "", senderName: string = "Rhinon Professional") {
  let prompt = `
    You are an expert sales copywriter for Rhinon Tech. 

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    LEAD CONTEXT:
    Name: ${leadData.name}
    Company: ${leadData.company}
    Title: ${leadData.title || "Target Prospect"}
    
    TASK:
    1. Generate a professional sales outreach email targeting this lead.
  `;

  if (templateData) {
    prompt += `
    RESEARCH GUIDANCE:
    Template Subject: ${templateData.subject || "No subject provided"}
    Template Body to Complete: ${templateData.body}
    Specific AI Instructions: ${templateData.aiInstructions || "None"}

    SUB-TASK:
    - Complete the email draft based on the "Template Body to Complete".
    - Fill in any placeholders or instructions inside brackets like [AI to fill X].
    - Tailor the Benefits specifically to the lead's company (${leadData.company}) and their role (${leadData.title || "role"}).
    `;
  }

  if (customPrompt) {
    prompt += `
    CUSTOM USER INSTRUCTIONS:
    ${customPrompt}

    SUB-TASK:
    - Incorporate the custom instructions provided above.
    `;
  }

  prompt += `
    GENERAL REQUIREMENTS:
    - Maintain a professional, premium, and consultative tone.
    - Replace ALL variables:
       - {{lead.name}} -> ${leadData.name}
       - {{lead.company}} -> ${leadData.company}
       - {{lead.title}} -> ${leadData.title || "colleague"}
       - {{sender.name}} -> ${senderName}
    
    OUTPUT:
    Return a JSON object with:
    - "subject": A compelling subject line.
    - "body": The final personalized message body.
    
    DO NOT include any other headers or surrounding text. Only return the JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse AI JSON response:", text);
  }

  return { body: text, subject: `Scaling ${leadData.company}'s operations` };
}

export async function generateTemplateWithAI(prompt: string, channel = "Email") {
  const isSocial = ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article", "LinkedIn DM", "LinkedIn Connection"].includes(channel);

  const fullPrompt = isSocial
    ? `
    You are an expert social media content strategist for Rhinon Tech.

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    CHANNEL: ${channel}
    USER REQUEST: ${prompt}

    TASK:
    Create a reusable ${channel} content template. The "body" is the seed content / writing guide for the AI.
    The AI will expand/rewrite the body into a final polished post when a campaign is executed.

    Return ONLY a JSON object with:
    - "name": Short descriptive template name (e.g. "Data Automation Thought Leadership")
    - "body": Seed content, key talking points, or a draft post (no placeholders needed for social)
    - "aiInstructions": 2-3 sentences telling the AI the tone, style, hashtags to include, and any channel-specific tips for ${channel}

    Do not include any surrounding text. Only return valid JSON.
  `
    : `
    You are an expert sales copywriter for Rhinon Tech, a high-end data automation and business intelligence platform.

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    USER REQUEST: ${prompt}

    TASK:
    Create a reusable cold outreach email template.
    Use placeholders like {{lead.name}}, {{lead.company}}, {{lead.title}} wherever personalization makes sense.

    Return ONLY a JSON object with:
    - "name": Short descriptive template name (e.g. "SaaS Founder Intro")
    - "subject": A compelling subject line (may include {{lead.company}})
    - "body": The full email body with placeholders
    - "aiInstructions": 2-3 sentences guiding the AI on how to personalize this when sending

    Do not include any surrounding text. Only return valid JSON.
  `;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const text = response.text().trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse AI template JSON:", text);
  }

  return { error: "Failed to generate template" };
}

export async function generateImagePromptForCampaign(campaignName: string, channel: string, draft: string): Promise<string> {
  const prompt = `
    You are a visual art director for Rhinon Tech, a premium data automation company.

    Campaign: "${campaignName}" (${channel})
    Post content summary: ${draft.slice(0, 300)}

    Generate a concise, vivid image generation prompt (under 80 words) for a professional LinkedIn post image.
    Style: clean, modern, tech-forward, dark background with cyan/blue accents, no text in image.
    Return ONLY the image prompt text, nothing else.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function generateAISocialDraft(templateData: any = null): Promise<string> {
  const prompt = `
    You are an expert LinkedIn content creator for Rhinon Tech.

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    ${templateData ? `TEMPLATE GUIDANCE:\n${templateData.body}\nAI Instructions: ${templateData.aiInstructions || "None"}` : ""}

    TASK:
    Write a compelling LinkedIn post for Rhinon Tech.
    - Professional yet engaging tone
    - 150-300 words
    - Include relevant hashtags at the end
    - No markdown formatting (plain text only)

    Return only the post text, no JSON, no labels.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

const STAGE_GUIDE: Record<number, string> = {
  0: "Stage 0 — no contact yet. Goal: start a conversation. Do NOT pitch. Ask about their operations.",
  2: "Stage 2 — no reply after the first email. Goal: introduce an operational hypothesis relevant to their industry. Reference likely pain.",
  3: "Stage 3 — no reply after the second email. Goal: provide proof. Introduce ApexisPro and the outcome. Do not oversell.",
  4: "Stage 4 — no reply after the third email. Goal: pattern interrupt. Ask one simple, specific question.",
};

export async function generateStagedOutreachEmail(
  lead: any,
  opts: { stage: number; enrichment?: any; senderName?: string; websiteText?: string }
) {
  const { stage, enrichment, senderName = "Rhinon Labs", websiteText } = opts;
  const prompt = `
    You are the Rhinon Labs outbound sales agent. Follow this memory EXACTLY — identity, ICP, pain patterns, email philosophy, stages, and output rules:

    ${getSalesMemory()}

    PROSPECT PROFILE:
    Name: ${lead.name}
    Title: ${lead.title || "Unknown"}
    Company: ${lead.company}
    Industry: ${lead.industry || "Unknown"}
    Company size: ${lead.employeeCount ?? "Unknown"} employees
    Location: ${lead.location || "Unknown"}
    Website: ${lead.website || "Unknown"}
    Services/keywords: ${(lead.keywords || "").slice(0, 600)}
    Tech stack: ${(lead.technologies || "").slice(0, 300)}

    ${enrichment ? `RESEARCH (verified):\n    Company: ${enrichment.companyDescription || ""}\n    Likely pain: ${enrichment.potentialPainPoint || ""}\n    Recent news: ${enrichment.recentNews || ""}` : ""}
    ${websiteText ? `\n    WEBSITE CONTENT (from their own site — use a real, specific detail from here to personalize):\n    """${websiteText.slice(0, 2500)}"""\n` : ""}

    CURRENT OUTREACH STAGE:
    ${STAGE_GUIDE[stage] || STAGE_GUIDE[0]}

    TASK:
    Follow Research -> Pain Hypothesis -> Personalization -> Email. Write the next email for this stage.
    Address the email to ${lead.name}. Sign off as ${senderName}.
    Hard rules: under 120 words, no buzzwords, no generic agency language, business-operator tone.
    Sell visibility / efficiency / operational scale — never sell "dashboard", "portal", "automation", or "AI agent".

    Return ONLY a JSON object with: "prospectSummary", "likelyPain", "reasoning", "subject", "body".
    Do not include any other text.
  `;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text();
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {
    /* fall through */
  }
  return { subject: `A quick thought on ${lead.company}'s operations`, body: text.trim(), prospectSummary: "", likelyPain: "", reasoning: "" };
}

export async function enrichLeadWithAI(
  leadName: string,
  companyName: string,
  context: { title?: string; industry?: string; keywords?: string; technologies?: string; website?: string; websiteText?: string } = {}
) {
  const signals = [
    context.title ? `Role: ${context.title}` : "",
    context.industry ? `Industry: ${context.industry}` : "",
    context.keywords ? `Business keywords: ${context.keywords.slice(0, 600)}` : "",
    context.technologies ? `Known tech stack: ${context.technologies.slice(0, 400)}` : "",
  ].filter(Boolean).join("\n    ");

  const prompt = `
    Research the following company and person for a B2B sales outreach. Use Google Search to find
    CURRENT, VERIFIABLE facts. Do NOT invent facts — if you cannot verify something, leave it generic
    or say so. Prefer information from their own website and recent search results.

    Lead Name: ${leadName}
    Company: ${companyName}
    ${context.website ? `Website: ${context.website}` : ""}
    ${signals ? `\n    KNOWN SIGNALS (do not contradict these):\n    ${signals}\n` : ""}
    ${context.websiteText ? `\n    WEBSITE CONTENT (extracted from their own site — treat as authoritative):\n    """${context.websiteText.slice(0, 3500)}"""\n` : ""}

    Return a JSON object with the following fields:
    - companyDescription: A short, factual summary of what they actually do (based on their site / search).
    - recentNews: Any recent, verifiable launch, project, funding, or event. Empty string if none found.
    - potentialPainPoint: One concrete operational inefficiency they likely have that custom dashboards / workflow automation could fix, tied to their actual business.
    - linkedinDiscoveryHint: How to find this person's specific LinkedIn profile.

    Only return the JSON.
  `;

  const text = await generateGroundedContent(prompt);
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response" };
  } catch (e) {
    return { error: "Invalid AI response format" };
  }
}
