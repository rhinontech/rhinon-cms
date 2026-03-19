import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const InboundEmailSchema = new mongoose.Schema({
  messageId: String,
  from: String,
  fromEmail: String,
  to: String,
  subject: String,
  snippet: String,
  receivedAt: Date,
  isRead: { type: Boolean, default: false }
});

const InboundEmail = mongoose.models.InboundEmail || mongoose.model("InboundEmail", InboundEmailSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected to DB");

  await InboundEmail.create([
    {
      messageId: `mock-1-${Date.now()}`,
      from: "Jane Smith",
      fromEmail: "jane.smith@example.com",
      to: "admin@rhinonlabs.com",
      subject: "Re: Partnership Inquiry",
      snippet: "Hi Admin, I received your email and would love to schedule a meeting next week to discuss this further.",
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: false
    },
    {
      messageId: `mock-2-${Date.now()}`,
      from: "Acme Corp Support",
      fromEmail: "support@acmecorp.com",
      to: "admin@rhinonlabs.com",
      subject: "Your Ticket #10023",
      snippet: "Hello, we have updated your support ticket regarding the API rate limits. Please log in to view the response.",
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true
    }
  ]);
  console.log("Inserted mock emails");
  process.exit(0);
}
run();
