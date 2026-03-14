import { NextResponse } from "next/server";
import { searchApolloLeads } from "@/lib/connectors/apollo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, industry, email, first_name, last_name, organization_name, type, page } = body;

    // Type 'match' for precision matching
    if (type === "match") {
      if (!first_name || !last_name) {
        return NextResponse.json({ error: "First and last name are required for matching." }, { status: 400 });
      }
      const { matchApolloLead } = await import("@/lib/connectors/apollo");
      const person = await matchApolloLead({ email, first_name, last_name, organization_name });
      return NextResponse.json(person ? [person] : []);
    }

    // Type 'search' - Defaulting to match-like behavior if search is restricted, 
    // but we'll try to pass specialized params.
    const { searchApolloLeads } = await import("@/lib/connectors/apollo");
    
    // Intelligent parameter mapping
    const isDomain = industry?.includes(".");
    
    const people = await searchApolloLeads({
      q_person_titles: title ? [title] : [],
      q_organization_domains: isDomain ? [industry] : undefined,
      q_organization_keyword_tags: !isDomain && industry ? [industry] : undefined,
      page: page || 1,
    });

    // Transform results slightly for better UI if we want to ensure first/last name are there
    return NextResponse.json(people || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
