import axios from "axios";
import dbConnect from "@/lib/mongodb";
import LinkedInToken from "@/lib/models/LinkedInToken";

/**
 * Get valid LinkedIn access token (auto-refresh if expired)
 */
export async function getValidLinkedInToken() {
  await dbConnect();
  
  const tokenRecord = await LinkedInToken.findOne({ is_active: true }).sort({ createdAt: -1 });

  if (!tokenRecord) {
    throw new Error('LinkedIn not connected. Please connect your LinkedIn account first.');
  }

  const isExpired = new Date() >= new Date(tokenRecord.expires_at);

  if (isExpired) {
    if (!tokenRecord.refresh_token) {
      throw new Error('LinkedIn token expired and no refresh token available. Please reconnect.');
    }

    // Auto-refresh token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      null,
      {
        params: {
          grant_type: 'refresh_token',
          refresh_token: tokenRecord.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    tokenRecord.access_token = access_token;
    tokenRecord.refresh_token = refresh_token || tokenRecord.refresh_token;
    tokenRecord.expires_at = expiresAt;
    await tokenRecord.save();

    return access_token;
  }

  return tokenRecord.access_token;
}

/**
 * Register and Upload an Image Asset to LinkedIn
 */
export async function uploadLinkedInImageAsset(imageUrl: string) {
  const accessToken = await getValidLinkedInToken();
  const tokenRecord = await LinkedInToken.findOne({ is_active: true }).sort({ createdAt: -1 });
  const linkedinUserId = tokenRecord.linkedin_user_id;

  // 1. Register Image
  const registerResponse = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${linkedinUserId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent"
          }
        ]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );

  const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const assetUrn = registerResponse.data.value.asset;

  // 2. Download from imageUrl and upload to LinkedIn
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  await axios.put(uploadUrl, imageResponse.data, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': imageResponse.headers['content-type']
    }
  });

  return assetUrn;
}

/**
 * Post to LinkedIn Feed with support for Media
 */
export async function postToLinkedIn(content: string, mediaUrls: string[] = []) {
  try {
    const accessToken = await getValidLinkedInToken();
    const tokenRecord = await LinkedInToken.findOne({ is_active: true }).sort({ createdAt: -1 });
    const linkedinUserId = tokenRecord.linkedin_user_id;

    const postPayload: any = {
      author: `urn:li:person:${linkedinUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    if (mediaUrls.length > 0) {
      // For now, handle the first image if multiple are provided
      const assetUrn = await uploadLinkedInImageAsset(mediaUrls[0]);
      postPayload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      postPayload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          media: assetUrn,
          title: { text: "Rich Media Post" }
        }
      ];
    }

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      data: response.data
    };
  } catch (error: any) {
    console.error('LinkedIn Post Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to post to LinkedIn');
  }
}

/**
 * Get LinkedIn connection status for the system
 */
export async function getLinkedInConnectionStatus() {
  await dbConnect();
  const token = await LinkedInToken.findOne({ is_active: true }).sort({ createdAt: -1 });
  
  if (!token) return { connected: false };
  
  const isExpired = new Date() >= new Date(token.expires_at);
  
  return {
    connected: true,
    isExpired,
    profile: token.linkedin_profile_data,
    expiresAt: token.expires_at
  };
}
