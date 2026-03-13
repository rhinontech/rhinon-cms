import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/mongodb";
import LinkedInToken from "@/lib/models/LinkedInToken";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=${error}&message=${errorDescription}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_code`);
  }

  try {
    await dbConnect();

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    // Get LinkedIn user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const linkedinProfile = profileResponse.data;

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Deactivate old tokens (simplified for single organization/user for now)
    await LinkedInToken.updateMany({}, { is_active: false });

    // Store new token
    await LinkedInToken.create({
      access_token,
      refresh_token: refresh_token || null,
      expires_at: expiresAt,
      linkedin_user_id: linkedinProfile.sub,
      linkedin_profile_data: linkedinProfile,
      is_active: true
    });

    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/dashboard?linkedin=connected`);
  } catch (err: any) {
    console.error('LinkedIn Callback Error:', err.response?.data || err);
    return NextResponse.redirect(`${baseUrl}/dashboard?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
}
