// useCampaignLogic - Campaign targeting and tracking logic
import { useEffect, useRef } from 'react';
import type { Campaign } from '@/types';
import { getCampaignsChatbot, trackCampaignImpression } from '@/services/campaign';
import { evaluateTargeting } from '@/utils/campaignTargeting';
import { canShowCampaign, recordCampaignView } from '@/utils/campaignFrequency';
import {
  isReturningVisitor,
  getCurrentUrl,
  getReferrerUrl,
  getPageLoadTime,
  initVisitorTracking,
} from '@/utils/visitorTracking';

interface UseCampaignLogicProps {
  appId: string;
  campaignsRef: React.MutableRefObject<Campaign[]>;
  campaignFoundRef: React.MutableRefObject<boolean>;
  setActiveCampaign: React.Dispatch<React.SetStateAction<Campaign | undefined>>;
}

export function useCampaignLogic({
  appId,
  campaignsRef,
  campaignFoundRef,
  setActiveCampaign,
}: UseCampaignLogicProps) {
  const checkCampaigns = () => {
    if (campaignFoundRef.current) return;

    try {
      const activeCampaigns = campaignsRef.current;

      // Prepare visitor data
      const visitorData = {
        isReturning: isReturningVisitor(),
        timeOnPage: getPageLoadTime(),
        currentUrl: getCurrentUrl(),
        referrerUrl: getReferrerUrl(),
      };

      for (const campaign of activeCampaigns) {
        // Check frequency capping with campaign type
        if (!canShowCampaign(campaign.id, campaign.type)) {
          console.log(`Campaign ${campaign.id} skipped: frequency limit reached`);
          continue;
        }

        // Evaluate targeting
        if (evaluateTargeting(campaign, visitorData)) {
          console.log(`Campaign ${campaign.id} matched targeting rules`);
          setActiveCampaign(campaign);
          recordCampaignView(campaign.id, campaign.type);
          trackCampaignImpression(campaign.id, appId);
          campaignFoundRef.current = true;
          break;
        }
      }
    } catch (error) {
      console.error('Error checking campaigns:', error);
    }
  };

  useEffect(() => {
    // Initialize visitor tracking
    initVisitorTracking();

    const fetchCampaigns = async () => {
      try {
        const response = await getCampaignsChatbot(appId);
        if (response && response.length > 0) {
          // Filter active campaigns (allow all in development for testing)
          campaignsRef.current = response.filter((c: Campaign) =>
            process.env.NODE_ENV === 'development' ? true : c.status === 'active'
          );
          // Initial check immediately after fetch
          checkCampaigns();
        }
      } catch (error) {
        console.error('Failed to get campaigns chatbot', error);
      }
    };

    if (appId) {
      fetchCampaigns();
    }

    // Re-check campaigns every 5 seconds for time-based triggers
    const interval = setInterval(() => {
      if (!campaignFoundRef.current) {
        checkCampaigns();
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [appId]);

  return { checkCampaigns };
}
