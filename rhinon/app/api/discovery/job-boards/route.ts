import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { matchApolloLead } from "@/lib/connectors/apollo";
import { model, enrichAndEvaluateLeadFromWebsite } from "@/lib/gemini";
import validate from "deep-email-validator";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";

async function fetchBuiltIn() {
  try {
    const url = "https://builtin.com/jobs/dev-engineering";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: any[] = [];
    // BuiltIn HTML parsing best effort
    $("[data-id='job-card']").each((i, el) => {
      const companyLink = $(el).find('a[href*="/company/"]').first();
      const titleLink = $(el).find('a[href*="/job/"]').first();

      const company = companyLink.text().trim();
      const title = titleLink.text().trim();
      const jobUrl = titleLink.attr('href') ? `https://builtin.com${titleLink.attr('href')}` : url;
      const postedAt = "Recently";
      if (company && title) jobs.push({ company, title, url: jobUrl, postedAt });
    });
    return jobs;
  } catch (e) { console.log(e); return []; }
}

async function fetchWeWorkRemotely() {
  try {
    const url = "https://weworkremotely.com/categories/remote-programming-jobs.rss";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const jobs: any[] = [];

    $("item").each((i, el) => {
      const fullTitle = $(el).find("title").text().trim(); // Format is usually "Company: Job Title"
      const link = $(el).find("link").text().trim();
      const pubDate = $(el).find("pubDate").text().trim();

      const parts = fullTitle.split(":");
      const company = parts[0] ? parts[0].trim() : "Unknown";
      const title = parts[1] ? parts.slice(1).join(":").trim() : fullTitle;

      if (company && title && !company.includes("We Work Remotely")) {
        jobs.push({ company, title, url: link, postedAt: new Date(pubDate).toLocaleDateString() || "Recently" });
      }
    });
    return jobs;
  } catch (e) { return []; }
}

async function fetchRemoteOk() {
  try {
    const url = "https://remoteok.com/api";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: any[] = [];
    for (const job of data) {
      if (job.company && job.position) {
        let postedAt = "Recently";
        if (job.date) {
          const diff = Math.floor((Date.now() - new Date(job.date).getTime()) / 86400000);
          postedAt = diff === 0 ? "Today" : diff === 1 ? "1 day ago" : `${diff} days ago`;
        }
        jobs.push({ company: job.company, title: job.position, url: job.url, postedAt });
      }
    }
    return jobs;
  } catch (e) { return []; }
}

export async function POST(req: Request) {
  try {
    const { page = 1 } = await req.json();

    // 1. Gather all raw jobs from the 3 sources concurrently (Cached for 1 hr)
    const [builtin, wwr] = await Promise.all([
      fetchBuiltIn(),
      fetchWeWorkRemotely(),
      fetchRemoteOk()
    ]);

    // 2. Optimization: Load existing companies from DB to avoid re-enriching known leads
    await dbConnect();
    const existingLeads = await Lead.find({}, "company");
    const existingCompanies = new Set();
    existingLeads.forEach(l => {
      if (l.company) existingCompanies.add(l.company.toLowerCase().trim());
    });

    // 3. Consolidate, De-duplicate, and strictly filter for IT/Developer roles
    const seen = new Set();
    const itKeywords = /developer|engineer|programmer|stack|frontend|backend|software|tech|data|devops|react|node|python|cto|web|ios|android|ai|machine learning|cloud|architect|systems|coder/i;

    const combinedRawJobs = [...builtin, ...wwr].filter(job => {
      if (!job.company || !job.title) return false;

      // Ensure the job title is IT/Developer related
      if (!itKeywords.test(job.title)) return false;

      const compLower = job.company.toLowerCase().trim();
      if (existingCompanies.has(compLower)) return false; // Optimization: Skip existing CRM companies

      const key = `${compLower}-${job.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // To guarantee ~10 valid leads, we load a larger chunk but process carefully
    const chunkToProcess = combinedRawJobs.slice((page - 1) * 30, page * 30);

    if (chunkToProcess.length === 0) {
      return NextResponse.json({ leads: [], message: "No more jobs found across all 3 portals or all existing leads are already in CRM." });
    }

    const validLeads: any[] = [];
    const limit = 10;
    const batchSize = 5; // Optimization: Process 5 at a time to NOT blast Gemini/Apollo APIs

    // 4. Extract Names and Summaries in Mini-Batches with Early Stop
    for (let i = 0; i < chunkToProcess.length; i += batchSize) {
      if (validLeads.length >= limit) break; // Early Return

      const currentBatch = chunkToProcess.slice(i, i + batchSize);

      const enrichedBatch = await Promise.all(
        currentBatch.map(async (job) => {
          let firstName = "Founder";
          let lastName = "";
          let personName = "Founder";
          let domain = "";
          let matchScore = "High";
          let matchReason = `Scraped from Job Portal hiring for: ${job.title}`;
          let enrichedSource = "Job Board Extractor";

          // Step 1: Use Gemini to identify the CEO/Founder and Domain ONLY
          try {
            const prompt = `You are a data enrichment AI. The company "${job.company}" is hiring a "${job.title}".
                  Find the likely CEO, Founder, or Hiring Manager. Also guess their website domain.
                  Return ONLY a JSON object with: { "firstName": "John", "lastName": "Doe", "domain": "example.com" }`;

            const aiRes = await model.generateContent(prompt);
            const txt = aiRes.response.text();
            const jsonMatch = txt.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.firstName) firstName = parsed.firstName;
              if (parsed.lastName) lastName = parsed.lastName;
              if (parsed.domain) domain = parsed.domain;
              personName = `${firstName} ${lastName}`.trim();
            }
          } catch (e) {
            // Silent fail
          }

          return {
            id: `job-${Date.now()}-${Math.random()}`,
            first_name: firstName,
            last_name: lastName,
            name: personName,
            email: "", // Empty so the frontend knows to trigger the cron/sync job
            organization_name: job.company,
            title: personName === "Founder" ? "Target Prospect" : "Founder/CEO",
            organization_website: domain,
            source: enrichedSource,
            postedAt: job.postedAt,
            matchScore,
            matchReason: `Actively hiring for ${job.title}.`,
            originalRow: job
          };
        })
      );

      // Collect valid leads (fill until we get exactly limit bounds)
      for (const lead of enrichedBatch) {
        if (lead && validLeads.length < limit) {
          validLeads.push(lead);
        }
      }
    }

    return NextResponse.json({ leads: validLeads });
  } catch (error: any) {
    console.error("Job Board Discovery Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
