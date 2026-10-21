// Campaign frequency capping utilities

const STORAGE_KEY = 'saleszium_campaign_views';
const DEFAULT_MAX_VIEWS = 3;
const DEFAULT_COOLDOWN_HOURS = 24;

interface CampaignView {
    count: number;
    lastView: number;
    views: number[];
}

interface CampaignViews {
    [campaignId: string]: CampaignView;
}

/**
 * Get all campaign views from localStorage
 */
const getCampaignViews = (): CampaignViews => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading campaign views:', error);
        return {};
    }
};

/**
 * Save campaign views to localStorage
 */
const saveCampaignViews = (views: CampaignViews): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    } catch (error) {
        console.error('Error saving campaign views:', error);
    }
};

/**
 * Check if a campaign can be shown based on frequency rules and campaign type
 * @param campaignId - Campaign ID
 * @param campaignType - "recurring" or "one-time"
 * @param maxViews - Maximum views for recurring campaigns (default: 3) - NOT USED ANYMORE
 * @param cooldownHours - Cooldown period for recurring campaigns (default: 24) - NOT USED ANYMORE
 */
export const canShowCampaign = (
    campaignId: number,
    campaignType: 'recurring' | 'one-time' = 'recurring',
    maxViews: number = DEFAULT_MAX_VIEWS,
    cooldownHours: number = DEFAULT_COOLDOWN_HOURS
): boolean => {
    // Recurring campaigns ALWAYS show - no frequency capping
    if (campaignType === 'recurring') {
        return true;
    }

    // One-time campaigns: check if already shown
    const views = getCampaignViews();
    const campaignKey = campaignId.toString();
    const campaignView = views[campaignKey];

    if (!campaignView) {
        // Never shown before, can show
        return true;
    }

    // For one-time campaigns, never show again after first view
    return false;
};

/**
 * Record a campaign view
 * Only records for one-time campaigns - recurring campaigns are not tracked
 */
export const recordCampaignView = (campaignId: number, campaignType: 'recurring' | 'one-time' = 'recurring'): void => {
    // Don't record views for recurring campaigns
    if (campaignType === 'recurring') {
        return;
    }

    // Only record for one-time campaigns
    const views = getCampaignViews();
    const campaignKey = campaignId.toString();
    const now = Date.now();

    if (!views[campaignKey]) {
        views[campaignKey] = {
            count: 1,
            lastView: now,
            views: [now]
        };
    } else {
        views[campaignKey].count += 1;
        views[campaignKey].lastView = now;
        views[campaignKey].views.push(now);
    }

    saveCampaignViews(views);
};

/**
 * Get the number of times a campaign has been viewed
 */
export const getCampaignViewCount = (campaignId: number): number => {
    const views = getCampaignViews();
    const campaignKey = campaignId.toString();
    return views[campaignKey]?.count || 0;
};

/**
 * Get the last time a campaign was viewed
 */
export const getLastViewTime = (campaignId: number): number | null => {
    const views = getCampaignViews();
    const campaignKey = campaignId.toString();
    return views[campaignKey]?.lastView || null;
};

/**
 * Reset views for a specific campaign (useful for testing)
 */
export const resetCampaignViews = (campaignId: number): void => {
    const views = getCampaignViews();
    const campaignKey = campaignId.toString();
    delete views[campaignKey];
    saveCampaignViews(views);
};

/**
 * Clear all campaign view data (useful for testing)
 */
export const clearAllCampaignViews = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};
