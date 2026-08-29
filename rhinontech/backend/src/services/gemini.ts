import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { env } from "../config/env";
import { getSalesMemory } from "../config/salesMemory";
import {
  AUDIENCE_BRIEFS,
  getLinkedInPlaybook,
  POST_TYPE_BRIEFS,
  type LinkedInAudience,
  type LinkedInPostType,
} from "../config/linkedInPlaybook";

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

// Rewrites one offer-letter/NDA block's text per an admin's instruction —
// used by both the letter-template editor (master template) and the
// per-employee live preview (see routes/letterTemplates.ts). Takes the
// block's FULL text (not just the selected span) so the model can return a
// complete, well-formed replacement rather than the caller having to splice
// a fragment back into **bold**/{{token}} markup itself.
export async function rewriteLetterSentence(blockFullText: string, selectedText: string, instruction: string): Promise<string> {
  const prompt = `
    You are editing one paragraph of a formal HR document (an offer letter or
    NDA clause) for Rhinon Tech. Apply the requested change ONLY to the
    selected portion, keeping the rest of the passage exactly as-is.

    FULL PASSAGE:
    """${blockFullText}"""

    SELECTED TEXT WITHIN THE PASSAGE:
    """${selectedText}"""

    REQUESTED CHANGE:
    ${instruction}

    RULES:
    - Return the ENTIRE passage with the change applied, not just the changed part.
    - Preserve **bold** markup exactly (double-asterisk pairs) where it already exists.
    - Preserve every {{token.name}} placeholder verbatim, character-for-character — never rename, remove, or reword text inside {{ }}.
    - Keep the same formal, professional tone as the rest of the document.
    - Do not add headings, labels, quotes, or any commentary — output only the revised passage text.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim().replace(/^"""|"""$/g, "").trim();
}

export async function enrichLeadWithAI(
  leadName: string,
  companyName: string,
  context: {
    title?: string | null;
    industry?: string | null;
    keywords?: string | null;
    technologies?: string | null;
    website?: string | null;
    websiteText?: string | null;
  } = {}
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

/* ------------------------------------------------------------------ *
 * LinkedIn Publishing — the five approved Rhinon Labs post types.
 * The playbook (config/linkedInPlaybook.ts, or the live training-guide
 * .md at the repo root) is the system instruction; the per-type brief
 * pins the structure so each type is actually distinguishable in the feed.
 * ------------------------------------------------------------------ */

export interface LinkedInPostRequest {
  postType: LinkedInPostType;
  audience?: LinkedInAudience | null;
  /** What the post is about — the angle, topic or business problem. */
  topic?: string | null;
  /** Verified facts, metrics, client details. The ONLY source of factual claims. */
  sourceFacts?: string | null;
  /** Optional reusable template seed from the template library. */
  templateData?: { body?: string | null; aiInstructions?: string | null } | null;
  /** Freeform steer from the operator, e.g. "make the hook blunter". */
  customPrompt?: string | null;
}

export interface LinkedInPostResult {
  postType: LinkedInPostType;
  audience: string;
  objective: string;
  hook: string;
  post: string;
  cta: string;
  hashtags: string[];
  visualSuggestion: string;
  /** What the model needs from a human before this post can be published truthfully. */
  inputNeeded: string[];
}

export async function generateLinkedInPost(req: LinkedInPostRequest): Promise<LinkedInPostResult> {
  const brief = POST_TYPE_BRIEFS[req.postType];
  const audienceBrief = req.audience ? AUDIENCE_BRIEFS[req.audience] : null;

  const prompt = `
${getLinkedInPlaybook()}

---

# THIS REQUEST

POST TYPE (already decided — do not reclassify): ${req.postType} — ${brief.label}
OBJECTIVE: ${brief.objective}

REQUIRED STRUCTURE for this type, in order:
${brief.structure.map((s, i) => `${i + 1}. ${s}`).join("\n")}

TYPE-SPECIFIC RULES:
${brief.rules}

${audienceBrief ? `TARGET AUDIENCE:\n${audienceBrief}\n` : ""}
${req.topic ? `TOPIC / ANGLE:\n${req.topic}\n` : ""}
${
  req.sourceFacts
    ? `VERIFIED FACTS — the ONLY permitted source of factual claims, numbers, client names and outcomes:\n"""${req.sourceFacts}"""\n`
    : `VERIFIED FACTS: none supplied. You therefore may NOT state any metric, client name, outcome or personal experience. Write the post around the idea itself, and use [INPUT NEEDED] markers where a real detail would make it far stronger.\n`
}
${req.templateData?.body ? `TEMPLATE SEED (starting material, rewrite it — do not paste it):\n${req.templateData.body}\n` : ""}
${req.templateData?.aiInstructions ? `TEMPLATE INSTRUCTIONS:\n${req.templateData.aiInstructions}\n` : ""}
${req.customPrompt ? `OPERATOR INSTRUCTIONS (highest priority, but never override the proof discipline rules):\n${req.customPrompt}\n` : ""}

# OUTPUT
Return ONLY a JSON object, no surrounding text or code fences:
{
  "postType": "${req.postType}",
  "audience": "who this post is written for, one short phrase",
  "objective": "${brief.objective}",
  "hook": "the first line of the post, repeated here",
  "post": "the complete LinkedIn post as plain text, including the hook and the CTA, using \\n for line breaks. No markdown. No hashtags inside this field.",
  "cta": "the single call to action, repeated here",
  "hashtags": ["0 to 3 hashtags, each including the # character"],
  "visualSuggestion": "one suitable visual concept for this post type",
  "inputNeeded": ["each real fact a human must supply before publishing; empty array if the post is fully supported by the input"]
}
`;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return a parseable post. Try regenerating.");

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("AI returned malformed JSON. Try regenerating.");
  }

  const post: string = (parsed.post || "").trim();
  if (!post) throw new Error("AI returned an empty post. Try regenerating.");

  const hashtags: string[] = Array.isArray(parsed.hashtags)
    ? parsed.hashtags.filter((h: any) => typeof h === "string" && h.trim()).slice(0, 3).map((h: string) => (h.startsWith("#") ? h : `#${h}`))
    : [];

  // The model is told to flag gaps, but it is not always honest about it —
  // catch any [INPUT NEEDED] markers left in the body as a backstop.
  const markers = post.match(/\[INPUT NEEDED[^\]]*\]/gi) || [];
  const inputNeeded: string[] = [
    ...(Array.isArray(parsed.inputNeeded) ? parsed.inputNeeded.filter((s: any) => typeof s === "string" && s.trim()) : []),
    ...markers.map((m) => m.replace(/^\[|\]$/g, "").replace(/^INPUT NEEDED:?\s*/i, "").trim() || "A missing detail is marked in the post body."),
  ];

  return {
    postType: req.postType,
    audience: typeof parsed.audience === "string" ? parsed.audience : "",
    objective: typeof parsed.objective === "string" ? parsed.objective : brief.objective,
    hook: typeof parsed.hook === "string" ? parsed.hook : post.split("\n")[0],
    post,
    cta: typeof parsed.cta === "string" ? parsed.cta : "",
    hashtags,
    visualSuggestion: typeof parsed.visualSuggestion === "string" ? parsed.visualSuggestion : "",
    inputNeeded: Array.from(new Set(inputNeeded)),
  };
}
