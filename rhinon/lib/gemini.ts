import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateAIEmailDraft(leadData: any, templateData: any) {
  const prompt = `
    You are an AI sales assistant for Rhinon Labs. 
    Rhinon Labs specializes in custom web applications, data dashboards, and automation tools.

    LEAD INFO:
    Name: ${leadData.name}
    Company: ${leadData.company}
    Title: ${leadData.title}
    
    TEMPLATE CONTEXT:
    Subject Line: ${templateData.subject}
    Base Body: ${templateData.body}
    AI Instructions: ${templateData.aiInstructions}

    TASK:
    Generate ONLY the personalized body message. 
    DO NOT include a "Subject:" line or any headers.
    Replace all variables like {{lead.name}}, {{lead.company}}, etc.
    Keep the tone professional, concise, and focused on operational efficiency.
    Do not use placeholders in your final output.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
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
