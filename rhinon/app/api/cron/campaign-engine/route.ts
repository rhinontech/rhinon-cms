import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import Lead from "@/lib/models/Lead";
import AiActivity from "@/lib/models/AiActivity";
import OutreachEmail from "@/lib/models/OutreachEmail";
import { generateAIEmailDraft } from "@/lib/gemini";
import { sendEmail } from "@/lib/mail";
import { saveEmailToS3 } from "@/lib/s3";
import { generateEmailHtml } from "@/lib/email-templates";

// Configure how many maximum leads to draft and exactly how many maximum to send per execution run to avoid server timeouts.
const BATCH_SIZE = 50; 

export async function GET(req: Request) {
  // 1. Basic security wrapper for Cron Job (Vercel Cron naturally sends an auth header)
  const authHeader = req.headers.get("Authorization");
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (!isDevelopment && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  try {
    await dbConnect();

    // 2. Fetch any Active campaigns whose startDate has arrived
    const activeCampaigns = await Campaign.find({ 
      stage: "Active",
      startDate: { $lte: new Date() } 
    }).populate("templateId");

    const logs: string[] = [];
    logs.push(`Found ${activeCampaigns.length} active campaigns ready to process.`);

    for (const campaign of activeCampaigns) {
      logs.push(`\n--- Processing Campaign: ${campaign.name} ---`);
      
      // PHASE A: AI Draft Generation
      // Find `Enrolled` leads without drafts and process them (batches of 10)
      const enrolledLeads = await Lead.find({
        campaignId: campaign._id,
        status: { $in: ["New", "Enrolled", "Enriched"] },
        $or: [{ aiDraft: null }, { aiDraft: "" }]
      }).limit(BATCH_SIZE);

      let newlyDraftedCount = 0;
      for (const lead of enrolledLeads) {
        try {
          const draft = await generateAIEmailDraft(lead, campaign.templateId);
          lead.aiDraft = draft.body;
          lead.status = "Interested";
          await lead.save();

          await AiActivity.create({
            leadId: lead._id,
            campaignId: campaign._id,
            type: "Outreach",
            content: "AI personalized outreach draft generated automatically.",
            generatedContent: draft.body,
            timestamp: new Date(),
          });
          newlyDraftedCount++;
          logs.push(`   [AI Draft] Generated for ${lead.email}`);
        } catch (aiError) {
          console.error(`AI Generation failure for campaign ${campaign._id}, lead ${lead._id}:`, aiError);
          logs.push(`   [AI Draft Error] Failed for ${lead.email}: ${(aiError as any).message}`);
        }
      }
      logs.push(`AI drafted ${newlyDraftedCount} new leads.`);

      // PHASE B: Email Dispatch & Daily Limits check
      if (campaign.channel === "Email") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const sentTodayCount = await AiActivity.countDocuments({
          campaignId: campaign._id,
          type: "OutreachSent",
          timestamp: { $gte: startOfDay }
        });

        const remainingDailyQuota = Math.max(0, campaign.dailyLimit - sentTodayCount);
        logs.push(`Daily Limit Check: ${sentTodayCount} sent today out of ${campaign.dailyLimit}. Remaining quota: ${remainingDailyQuota}.`);

        if (remainingDailyQuota > 0) {
          // Identify global sender since this is automated
          const senderIdentity = await OutreachEmail.findOne({ status: "Active" }).lean();
          
          if (!senderIdentity) {
             logs.push("ERROR: No active sender identity found. Cannot dispatch emails.");
          } else {
             const leadsReadyToSend = await Lead.find({
               campaignId: campaign._id,
               status: "Interested",
               aiDraft: { $exists: true, $ne: "" }
             }).limit(Math.min(BATCH_SIZE, remainingDailyQuota));

             let sentThisRun = 0;
             for (const lead of leadsReadyToSend) {
               try {
                 const draftBody = lead.aiDraft?.trim();
                 if (!draftBody) continue;

                 const finalHtml = generateEmailHtml(draftBody);
                 const emailSubject = `Optimizing ${lead.company}'s potential`;
                 
                 const info = await sendEmail({
                   to: lead.email,
                   subject: emailSubject,
                   text: draftBody,
                   html: finalHtml,
                   fromEmail: senderIdentity.email,
                 });

                 const messageId = info.messageId || `engine-${campaign._id}-${lead._id}`;
                 const rawEml = [
                   `From: "${senderIdentity.name || 'Outreach'}" <${senderIdentity.email}>`,
                   `To: ${lead.email}`,
                   `Subject: ${emailSubject}`,
                   `Date: ${new Date().toUTCString()}`,
                   `Message-ID: <${messageId}>`,
                   `MIME-Version: 1.0`,
                   `Content-Type: text/html; charset=utf-8`,
                   ``,
                   finalHtml
                 ].join("\r\n");

                 try {
                   await saveEmailToS3(senderIdentity.email, "outbound", messageId, rawEml);
                 } catch (s3Err) {}

                 lead.status = "Emailed";
                 await lead.save();

                 await AiActivity.create({
                   leadId: lead._id,
                   campaignId: campaign._id,
                   type: "OutreachSent",
                   content: `Automated campaign outreach email delivered via Rhinon Cron Engine.`,
                   timestamp: new Date(),
                 });

                 sentThisRun++;
                 logs.push(`   [Email Sent] Delivered to ${lead.email}`);
               } catch (sendError) {
                 console.error(`Send failure for lead ${lead._id}:`, sendError);
                 logs.push(`   [Email Error] Failed to send to ${lead.email}: ${(sendError as any).message}`);
               }
             }
             logs.push(`Successfully dispatched ${sentThisRun} emails this run.`);

             // Update total processed metric!
             campaign.leadsProcessed += sentThisRun;
             await campaign.save();
          }
        }

        // PHASE C: Auto-Completion Check
        // If all leads in the campaign have transitioned past Enrolled/Interested, the campaign is fully processed.
        const pendingLeads = await Lead.countDocuments({
          campaignId: campaign._id,
          status: { $in: ["New", "Enrolled", "Enriched", "Interested"] }
        });

        if (pendingLeads === 0 && campaign.leadsTotal > 0) {
           campaign.stage = "Completed";
           await campaign.save();
           logs.push(`Campaign finished! All leads processed. Marked as Completed.`);
        }
      }
    }

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    console.error("Cron engine failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
