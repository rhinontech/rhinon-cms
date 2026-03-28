import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";

export async function POST(req: Request) {
  try {
    const { person, domain } = await req.json();

    if (!person || !person.name) {
      return NextResponse.json({ error: "Person data is required" }, { status: 400 });
    }

    await dbConnect();

    // Extract names
    const parts = person.name.split(" ");
    const firstName = parts[0] ? parts[0].toLowerCase().replace(/[^a-z]/g, "") : "";
    const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, "") : "";

    // Guess domain if not provided
    const targetDomain = domain || person.organization_website || (person.organization_name ? person.organization_name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com" : "");

    if (!firstName || !targetDomain) {
      return NextResponse.json({ error: "Could not parse name or domain for permutations" }, { status: 400 });
    }

    // Generate permutations
    const permutations = [
      `${firstName}@${targetDomain}`,
      `${firstName}.${lastName}@${targetDomain}`,
      `${firstName[0]}${lastName}@${targetDomain}`,
      `${firstName}${lastName}@${targetDomain}`,
      `${lastName}@${targetDomain}`
    ];

    let foundEmail = "";

    // Test permutations against Abstract API
    for (const testEmail of permutations) {
      try {
        const apiKey = process.env.ABSTRACT_API_KEY;
        if (!apiKey) {
            console.warn("ABSTRACT_API_KEY is missing. Add it to .env.");
            break;
        }

        const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(testEmail)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        console.log(`[AbstractAPI] Testing ${testEmail} -> Deliverability:`, data.deliverability || data.error?.message || data);

        if (data.deliverability === "DELIVERABLE") {
            foundEmail = testEmail;
            break; 
        }

        // Delay for 1 second to respect Abstract API's Free Tier rate limit (1 req/sec)
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error("Error pinging Abstract API", err);
      }
    }

    // Only sync to RhinonDB if a valid email is found
    if (foundEmail) {
      const newLead = await Lead.create({
          name: person.name,
          email: foundEmail,
          company: person.organization_name,
          title: person.title,
          source: person.source,
          status: "Enriched"
      });

      return NextResponse.json({ message: "Sync complete", lead: newLead });
    } else {
      return NextResponse.json({ error: "No valid email found for this lead", notFound: true }, { status: 404 });
    }
    
  } catch (error: any) {
    console.error("Email Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

