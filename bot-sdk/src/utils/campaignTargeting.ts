// Campaign targeting evaluation utilities

interface CampaignCondition {
    field: string;
    operator: string;
    value: string;
}

interface CampaignRules {
    matchType: 'match-all' | 'match-any';
    conditions: CampaignCondition[];
}

interface CampaignTrigger {
    type: 'time-on-page';
    value: number;
    unit: 'seconds' | 'minutes';
}

interface CampaignTargeting {
    visitorType: 'all' | 'first-time' | 'returning';
    trigger: CampaignTrigger;
    rules: CampaignRules;
}

interface Campaign {
    id: number;
    status: string;
    targeting: CampaignTargeting;
}

interface VisitorData {
    isReturning: boolean;
    timeOnPage: number; // in seconds
    currentUrl: string;
    referrerUrl: string;
}

/**
 * Check if visitor type matches campaign targeting
 */
const checkVisitorType = (targetType: string, isReturning: boolean): boolean => {
    if (targetType === 'all') return true;
    if (targetType === 'first-time') return !isReturning;
    if (targetType === 'returning') return isReturning;
    return false;
};

/**
 * Check if time on page meets trigger requirement
 */
const checkTimeOnPage = (trigger: CampaignTrigger, timeOnPage: number): boolean => {
    const requiredTime = trigger.unit === 'minutes'
        ? trigger.value * 60
        : trigger.value;

    return timeOnPage >= requiredTime;
};

/**
 * Check if a single URL condition matches
 */
const checkUrlCondition = (
    condition: CampaignCondition,
    currentUrl: string,
    referrerUrl: string
): boolean => {
    let urlToCheck = '';

    // Determine which URL to check
    if (condition.field === 'current-page-url') {
        urlToCheck = currentUrl.toLowerCase();
    } else if (condition.field === 'referrer-url') {
        urlToCheck = referrerUrl.toLowerCase();
    } else {
        // For other fields like device-type, customer-activity, return true for now
        return true;
    }

    const value = condition.value.toLowerCase();

    // Apply operator
    switch (condition.operator) {
        case 'contains':
            return urlToCheck.includes(value);
        case 'equals':
            return urlToCheck === value;
        case 'starts-with':
            return urlToCheck.startsWith(value);
        case 'ends-with':
            return urlToCheck.endsWith(value);
        case 'is':
            return urlToCheck === value;
        default:
            return false;
    }
};

/**
 * Check if URL conditions match based on match type
 */
const checkUrlConditions = (
    rules: CampaignRules,
    currentUrl: string,
    referrerUrl: string
): boolean => {
    if (!rules.conditions || rules.conditions.length === 0) {
        return true; // No conditions means always match
    }

    const results = rules.conditions.map(condition =>
        checkUrlCondition(condition, currentUrl, referrerUrl)
    );

    if (rules.matchType === 'match-all') {
        return results.every(result => result);
    } else {
        return results.some(result => result);
    }
};

/**
 * Main function to evaluate if a campaign should be shown
 */
export const evaluateTargeting = (
    campaign: Campaign,
    visitorData: VisitorData
): boolean => {
    const { targeting } = campaign;

    // Check if campaign is active (allow all in development for testing)
    if (campaign.status !== 'active' && process.env.NODE_ENV !== 'development') {
        return false;
    }

    // Check visitor type
    if (!checkVisitorType(targeting.visitorType, visitorData.isReturning)) {
        return false;
    }

    // Check time on page
    if (!checkTimeOnPage(targeting.trigger, visitorData.timeOnPage)) {
        return false;
    }

    // Check URL conditions
    if (!checkUrlConditions(targeting.rules, visitorData.currentUrl, visitorData.referrerUrl)) {
        return false;
    }

    return true;
};

/**
 * Find the first matching campaign from a list
 */
export const findMatchingCampaign = (
    campaigns: Campaign[],
    visitorData: VisitorData
): Campaign | null => {
    for (const campaign of campaigns) {
        if (evaluateTargeting(campaign, visitorData)) {
            return campaign;
        }
    }
    return null;
};
