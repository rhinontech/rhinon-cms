// Campaign service
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { Campaign } from '@/types';

/**
 * Get campaigns for a chatbot
 */
export const getCampaignsChatbot = async (chatbotId: string): Promise<Campaign[]> => {
  const response = await serverApi.get(ENDPOINTS.CAMPAIGNS_CHATBOT, {
    params: { chatbot_id: chatbotId },
  });

  const campaigns: Campaign[] = response.data;

  // Resolve secure S3 URLs for any campaigns with images
  const resolvedCampaigns = await Promise.all(
    campaigns.map(async (campaign) => {
      if (campaign.content?.hasImage && campaign.content.media?.src) {
        const src = campaign.content.media.src;
        // If it's a relative S3 key, fetch the signed URL
        if (!src.startsWith('http') && !src.startsWith('data:')) {
          try {
            const urlResponse = await serverApi.get(ENDPOINTS.PRESIGNED_URL, {
              params: { key: src }
            });
            if (urlResponse.data?.downloadUrl) {
              campaign.content.media.src = urlResponse.data.downloadUrl;
            }
          } catch (error) {
            console.error('Failed to get signed URL for campaign image', error);
          }
        }
      }
      return campaign;
    })
  );

  return resolvedCampaigns;
};
