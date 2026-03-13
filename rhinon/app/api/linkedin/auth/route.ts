import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "LinkedIn credentials not configured" }, { status: 500 });
  }

  // Define scopes
  const scope = encodeURIComponent('openid profile email w_member_social');
  
  // Use a simple state for now (in production, use a secure random string and verify it)
  const state = Buffer.from(JSON.stringify({ timestamp: Date.now() })).toString('base64');

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

  return NextResponse.json({ authUrl });
}
