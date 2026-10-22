// Campaign analytics tracking utilities

import { getServerApiUrl, getCurrentAppId } from '@/services/api';

type AnalyticsEvent = 'campaign_impression' | 'campaign_click' | 'campaign_close';

interface AnalyticsData {
    campaignId: number | string;
    appId: string;
    timestamp: number;
    buttonId?: string;
    url?: string;
    actionType?: string;
}

/**
 * Counts a campaign view, click or close (the stats on the admin's Campaigns
 * list). Fire-and-forget: keepalive lets a click that navigates away still land.
 */
const sendAnalytics = async (event: AnalyticsEvent, data: AnalyticsData): Promise<void> => {
    try {
        // Read at call time: an npm install sets api_url after this module loads.
        await fetch(`${getServerApiUrl()}/analytics/campaign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The card component doesn't always know the app id; the page's bot is the fallback.
            body: JSON.stringify({ event, ...data, chatbot_id: data.appId || getCurrentAppId() }),
            keepalive: true,
        });
    } catch {
        // Stats are best-effort; never disturb the visitor.
    }
};

/**
 * Track when a campaign is shown to a visitor
 */
export const trackCampaignImpression = (campaignId: number | string, appId: string): void => {
    sendAnalytics('campaign_impression', {
        campaignId,
        appId,
        timestamp: Date.now()
    });
};

/**
 * Track when a campaign button is clicked
 */
export const trackCampaignClick = (
    campaignId: number | string,
    buttonId: string,
    appId: string,
    url?: string,
    actionType?: string
): void => {
    sendAnalytics('campaign_click', {
        campaignId,
        appId,
        buttonId,
        url,
        actionType,
        timestamp: Date.now()
    });
};

/**
 * Track when a campaign is closed by the visitor
 */
export const trackCampaignClose = (campaignId: number | string, appId: string): void => {
    sendAnalytics('campaign_close', {
        campaignId,
        appId,
        timestamp: Date.now()
    });
};
