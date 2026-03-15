import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const RHINON_KNOWLEDGE = `
Rhinon is a high-end data automation and business intelligence platform.
Core Services:
1. Custom Business Intelligence Dashboards: Centralizing KPIs from sales, marketing, and operations into one view.
2. Data Automation: Eliminating manual reporting and data entry.
3. Operational Efficiency: Using internal data to find bottlenecks and improve decision-making.
4. Custom Tools: Tailored web applications that solve specific internal operational problems.
Target Market: SaaS companies, high-growth agencies, and data-driven enterprises.
Value Proposition: "Unlock the power of your data to drive smarter, reactive decisions."
`;

export async function generateAIEmailDraft(leadData: any, templateData: any) {
  const prompt = `
    You are an expert sales copywriter for Rhinon. 

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    LEAD CONTEXT:
    Name: ${leadData.name}
    Company: ${leadData.company}
    Title: ${leadData.title}
    Industry: ${leadData.industry || "Technology/Business"}
    
    RESEARCH GUIDANCE:
    Template Subject: ${templateData.subject}
    Template Body to Complete: ${templateData.body}
    Specific AI Instructions: ${templateData.aiInstructions}

    TASK:
    1. Complete the email draft based on the "Template Body to Complete".
    2. Fill in any placeholders or instructions inside brackets like [AI to fill X].
    3. Tailor the Benefits (Benefit 1, 2, 3) specifically to the lead's company (${leadData.company}), their industry (${leadData.industry || "industry"}), and their role (${leadData.title}).
    4. Mention something specific and plausible about the company based on its industry and growth stage.
    5. Maintain a professional, premium, and consultative tone.
    6. Replace ALL variables:
       - {{lead.name}} -> ${leadData.name}
       - {{lead.company}} -> ${leadData.company}
       - {{lead.title}} -> ${leadData.title}
       - {{sender.name}} -> Rhinon Professional
    
    OUTPUT:
    Return ONLY the final personalized message body. DO NOT include "Subject:" or any other headers.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

export async function enrichLeadWithAI(leadName: string, companyName: string) {
  const prompt = `
    Research the following company and person for a sales outreach.
    Lead Name: ${leadName}
    Company: ${companyName}

    Return a JSON object with the following fields:
    - companyDescription: A short summary of what they do.
    - recentNews: Any recent product launch, funding, or major event.
    - potentialPainPoint: One operational inefficiency they might have that custom dashboards or automation could fix.
    - linkedinDiscoveryHint: A suggestion on how to find their specific profile (e.g. keywords).

    Only return the JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  try {
    // Basic JSON extraction in case Gemini wraps it in code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response" };
  } catch (e) {
    return { error: "Invalid AI response format" };
  }
}

export async function findLinkedInUrl(leadName: string, companyName: string) {
  const prompt = `Find the LinkedIn profile URL for ${leadName} who works at ${companyName}. 
  If you cannot find the exact URL, provide a search query that would lead to their profile.
  Return only the URL or the query string.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

export async function generateAISocialDraft(templateData: any) {
  const prompt = `
    You are an expert social media and content manager for Rhinon.

    RHINON COMPANY KNOWLEDGE:
    ${RHINON_KNOWLEDGE}

    RESEARCH GUIDANCE:
    Template Source Content: ${templateData.body}
    Specific AI Instructions: ${templateData.aiInstructions}
    Channel: ${templateData.channel}

    TASK:
    1. Generate a high-quality, engaging social media post tailored for ${templateData.channel}.
    2. Incorporate the core message from the "Template Source Content".
    3. Strictly adhere to the "Specific AI Instructions".
    4. Maintain a professional, premium, and authoritative tone suitable for thought leadership.
    5. Do not include placeholders like [Insert Name] - ensure it is fully ready to be published on the Rhinon corporate account.
    
    OUTPUT:
    Return ONLY the final generated post copy. DO NOT include prefixes, headers, or quotes around the output.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
