import axios from "axios";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_BASE_URL = "https://api.apollo.io/v1";

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  last_name_obfuscated?: string;
  name: string;
  email: string;
  title: string;
  organization_name: string;
  organization?: {
    name: string;
    website_url?: string;
  };
  linkedin_url?: string;
  organization_website?: string;
}

/**
 * Search for people/leads using the Apollo.io API.
 * This is designed for the free tier usage patterns.
 */
export async function searchApolloLeads(params: {
  q_person_titles?: string[];
  q_organization_domains?: string[];
  q_organization_keyword_tags?: string[];
  person_locations?: string[];
  page?: number;
}) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is missing from environment variables.");
  }

  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/mixed_people/api_search`,
      {
        q_person_titles: params.q_person_titles,
        q_organization_domains: params.q_organization_domains,
        q_organization_keyword_tags: params.q_organization_keyword_tags,
        person_locations: params.person_locations,
        page: params.page || 1,
      },
      {
        headers: {
          'X-Api-Key': APOLLO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.people as ApolloPerson[];
  } catch (error: any) {
    console.error("Apollo Search Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Match a specific person to get their full profile.
 */
export async function matchApolloLead(params: {
  id?: string;
  email?: string;
  first_name: string;
  last_name: string;
  organization_name?: string;
  reveal_personal_emails?: boolean;
}) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is missing from environment variables.");
  }

  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/people/match`,
      params,
      {
        headers: {
          'X-Api-Key': APOLLO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.person as ApolloPerson;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("Apollo Match Error Details:", JSON.stringify(errorData, null, 2));
    throw new Error(errorData?.message || errorData?.error || error.message);
  }
}

/**
 * Fetch a specific person by ID to reveal full details (email, etc).
 */
export async function showApolloLead(id: string) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is missing from environment variables.");
  }

  try {
    const response = await axios.get(
      `${APOLLO_BASE_URL}/people/${id}`,
      {
        headers: {
          'X-Api-Key': APOLLO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.person as ApolloPerson;
  } catch (error: any) {
    console.error("Apollo Show Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Enrich a lead by ID to reveal their contact details.
 * This consumes credits.
 */
export async function enrichApolloLead(id: string) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is missing from environment variables.");
  }

  try {
    // Try singular match with ID first if supported, or bulk_match
    // Let's try bulk_match again but with minimal params to reveal
    const response = await axios.post(
      `${APOLLO_BASE_URL}/people/bulk_match`,
      {
        person_ids: [id]
      },
      {
        headers: {
          'X-Api-Key': APOLLO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const person = response.data.matches?.[0] as ApolloPerson;
    return person;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("Apollo Enrichment Error Details:", JSON.stringify(errorData, null, 2));
    throw new Error(errorData?.message || errorData?.error || error.message);
  }
}

/**
 * Helper to map Apollo data to our Lead model.
 */
export function mapApolloToLead(person: ApolloPerson) {
  const lastName = person.last_name || person.last_name_obfuscated || "";
  const name = person.name || (person.first_name ? `${person.first_name} ${lastName}`.trim() : "Unnamed Lead");
  const company = person.organization?.name || person.organization_name || "Unknown Company";
  
  return {
    name,
    company,
    title: person.title || "Target Prospect",
    email: person.email,
    linkedinUrl: person.linkedin_url,
    status: "New",
    addedAt: new Date().toISOString(),
  };
}
