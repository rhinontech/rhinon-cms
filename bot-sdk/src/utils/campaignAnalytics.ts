// Campaign analytics tracking utilities

import { getServerApiUrl } from '@/services/api';

const ANALYTICS_ENDPOINT = getServerApiUrl();

type AnalyticsEvent = 'campaign_impression' | 'campaign_click' | 'campaign_close';

interface AnalyticsData {
    campaignId: number;
    appId: string;
    timestamp: number;
    buttonId?: string;
    url?: string;
    actionType?: string;
}

/**
 * Send analytics event to backend
 */
const sendAnalytics = async (event: AnalyticsEvent, data: AnalyticsData): Promise<void> => {
    try {
        // For now, just log to console
        // In production, this would send to your analytics endpoint
        console.log(`[Campaign Analytics] ${event}:`, data);

        // Uncomment when backend endpoint is ready
        /*
        await fetch(`${ANALYTICS_ENDPOINT}/analytics/campaign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event,
                ...data
            })
        });
        */
    } catch (error) {
        console.error('Error sending campaign analytics:', error);
    }
};

/**
 * Track when a campaign is shown to a visitor
 */
export const trackCampaignImpression = (campaignId: number, appId: string): void => {
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
    campaignId: number,
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
export const trackCampaignClose = (campaignId: number, appId: string): void => {
    sendAnalytics('campaign_close', {
        campaignId,
        appId,
        timestamp: Date.now()
    });
};
