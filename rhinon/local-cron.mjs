

const CRON_URL = "http://localhost:3000/api/cron/campaign-engine";
const INTERVAL_SECONDS = 30; // Check every 30 seconds

console.log(`🤖 Starting Local Cron Simulator...`);
console.log(`Pinging ${CRON_URL} every ${INTERVAL_SECONDS} seconds.\n`);

const processLogs = (data) => {
  if (data.logs && data.logs.length > 0) {
    if (!data.logs[0].includes("Found 0 active campaigns")) {
       console.log("\n-----------------------------------------");
       data.logs.forEach(log => {
          if (log.includes("[AI Draft]")) console.log(`   ✍️  ${log.trim()}`);
          else if (log.includes("[Email Sent]")) console.log(`   📨  ${log.trim()}`);
          else if (log.includes("--- Processing")) console.log(`\n📂 ${log.trim()}`);
          else console.log(`   ℹ️  ${log.trim()}`);
       });
       console.log("-----------------------------------------\n");
    } else {
       console.log(`[${new Date().toLocaleTimeString()}] 💤 Engine idle. 0 campaigns to process.`);
    }
  }
};

setInterval(async () => {
  try {
    const timestamp = new Date().toLocaleTimeString();
    
    const response = await fetch(CRON_URL);
    const data = await response.json();

    if (data.success) {
      processLogs(data);
    } else {
      console.error(`❌ Engine Error:`, data.error);
    }
  } catch (err) {
    console.error(`⚠️  Server might be down. Is 'npm run dev' running?`);
  }
}, INTERVAL_SECONDS * 1000);

// Run once immediately on start:
console.log(`[Init] 🚀 Initial Engine Trigger...`);
fetch(CRON_URL).then(res => res.json()).then(data => {
   processLogs(data);
}).catch(() => console.log("Init fetch failed."));
