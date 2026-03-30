import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { matchApolloLead } from "@/lib/connectors/apollo";
import { enrichAndEvaluateLeadFromWebsite } from "@/lib/gemini";
import validate from "deep-email-validator";

export async function POST(req: Request) {
  try {
    const { page = 1 } = await req.json();
    const limit = 10;
    const skip = (page - 1) * limit;

    const csvFilePath = path.join(process.cwd(), "public", "Logistic 1.csv");
    if (!fs.existsSync(csvFilePath)) {
      return NextResponse.json({ error: "CSV file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(csvFilePath, "utf8");
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const allRows = parsed.data as any[];
    const validLeads: any[] = [];
    let currentIndex = skip;

    while (validLeads.length < limit && currentIndex < allRows.length) {
      const batchSize = 5;
      const rowsToProcess = allRows.slice(currentIndex, currentIndex + batchSize);

      const enrichedBatch = await Promise.all(
        rowsToProcess.map(async (row: any) => {
          let email = row["Corporate Email"] || row["Generic Email"] || "";
          const personName = row["Contact Person"] || "";
          const businessName = row["Business Name"] || "";
          const website = row["Website"] || "";
          
          let firstName = "";
          let lastName = "";
          if (personName) {
              const cleanName = personName.replace(/(Mr\.|Mrs\.|Ms\.)\s+/ig, '').replace(/\(.*?\)/g, '').split(",")[0].trim();
              const parts = cleanName.split(" ");
              firstName = parts[0] || "";
              lastName = parts.slice(1).join(" ") || "";
          }

          let enrichedSource = "CSV";

          if (!email && firstName && lastName && businessName) {
              try {
                  const apolloData = await matchApolloLead({
                      first_name: firstName,
                      last_name: lastName,
                      organization_name: businessName,
                      reveal_personal_emails: true
                  });
                  if (apolloData && apolloData.email) {
                      email = apolloData.email;
                      enrichedSource = "Apollo Sync";
                  }
              } catch(e) {
                  // Apollo match failed silently
              }
          }

          let matchScore = "Medium";
          let matchReason = "No website available to score.";

          if (!email && firstName && businessName) {
               try {
                   const aiPrediction = await enrichAndEvaluateLeadFromWebsite(personName || businessName, businessName, website);
                   if (aiPrediction && aiPrediction.email) {
                       email = aiPrediction.email;
                       enrichedSource = `Gemini AI: ${aiPrediction.method}`;
                   }
                   if (aiPrediction.matchScore) matchScore = aiPrediction.matchScore;
                   if (aiPrediction.matchReason) matchReason = aiPrediction.matchReason;
               } catch(e) {
                   // Gemini prediction failed silently
               }
          }

          if (!email) return null;

          // SMTP Verification using deep-email-validator
          try {
            const verification = await validate({
              email: email,
              sender: "hello@rhinon.tech",
              validateRegex: true,
              validateMx: true,
              validateTypo: true,
              validateDisposable: true,
              validateSMTP: false // Many local networks block Port 25; disable SMTP ping to prevent false negatives in dev, but MX/Typo will catch 80% of bad ones
            });

            if (!verification.valid) {
              console.log(`[Validation] Bounced email prevented: ${email}`);
              return null;
            }
          } catch (e) {
            console.error("Validator Error:", e);
            // If validator fails network wise, we just allow it so it doesn't block progress
          }

          return {
            id: row["Id"] || `${Date.now()}-${Math.random()}`,
            first_name: firstName || businessName,
            last_name: lastName,
            name: personName || businessName,
            email: email,
            organization_name: businessName,
            title: personName || "Contact",
            organization_website: website,
            source: enrichedSource,
            matchScore,
            matchReason,
            originalRow: row
          };
        })
      );

      for (const lead of enrichedBatch) {
        if (lead && validLeads.length < limit) {
          validLeads.push(lead);
        }
      }

      currentIndex += batchSize;
    }

    return NextResponse.json({ leads: validLeads });
  } catch (error: any) {
    console.error("CSV Discovery Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
