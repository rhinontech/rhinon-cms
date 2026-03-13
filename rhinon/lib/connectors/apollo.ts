import axios from "axios";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_BASE_URL = "https://api.apollo.io/v1";

export interface ApolloPerson {
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  title: string;
  organization_name: string;
  linkedin_url?: string;
  organization_website?: string;
}

/**
 * Search for people/leads using the Apollo.io API.
 * This is designed for the free tier usage patterns.
 */
export async function searchApolloLeads(params: {
  q_person_titles: string[];
  q_organization_domains?: string[];
  page?: number;
}) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is missing from environment variables.");
  }

  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/mixed_people/api_search`,
      {
        api_key: APOLLO_API_KEY,
        q_person_titles: params.q_person_titles,
        q_organization_domains: params.q_organization_domains,
        page: params.page || 1,
      }
    );

    return response.data.people as ApolloPerson[];
  } catch (error: any) {
    console.error("Apollo Search Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Helper to map Apollo data to our Lead model.
 */
export function mapApolloToLead(person: ApolloPerson) {
  return {
    name: person.name || `${person.first_name} ${person.last_name}`,
    company: person.organization_name,
    title: person.title,
    email: person.email,
    linkedinUrl: person.linkedin_url,
    status: "New",
    addedAt: new Date().toISOString(),
  };
}
