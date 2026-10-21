/**
 * Utilities Barrel Export
 * Exports all utility functions and helpers
 */

// Theme utilities
export { themeVars } from './theme';

// Tracking utilities
export { default as useTracking } from './useTracking';

// Campaign utilities
export { evaluateTargeting } from './campaignTargeting';
export { canShowCampaign, recordCampaignView, getCampaignViewCount, getLastViewTime, resetCampaignViews, clearAllCampaignViews } from './campaignFrequency';
export { trackCampaignImpression, trackCampaignClick, trackCampaignClose } from './campaignAnalytics';

// Visitor tracking
export {
  isReturningVisitor,
  getCurrentUrl,
  getReferrerUrl,
  getPageLoadTime,
  initVisitorTracking,
} from './visitorTracking';

// Exit intent
export { initExitIntent, cleanupExitIntent, hasExitIntentTriggered, resetExitIntent } from './exitIntent';

// Time utilities
export { timeConvertion } from './timeConvertion';

// Config store
export { useConfigStore } from './chatbotConfigStore';

// Debounce and throttle utilities
export {
  debounce,
  throttle,
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
} from './debounce';

