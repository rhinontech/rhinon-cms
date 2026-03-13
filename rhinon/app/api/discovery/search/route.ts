import { NextResponse } from "next/server";
import { searchApolloLeads } from "@/lib/connectors/apollo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, industry, page } = body;

    if (!title) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 });
    }

    // Map industry to organization_domains or similar if needed, 
    // for now we'll just search by job title.
    const people = await searchApolloLeads({
      q_person_titles: [title],
      page: page || 1,
    });

    return NextResponse.json(people);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
