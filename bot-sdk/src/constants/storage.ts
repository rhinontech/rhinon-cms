// Storage keys for localStorage and sessionStorage

export const STORAGE_KEYS = {
  // User identification
  USER_ID: 'userId',
  SESSION_ID: 'sessionId',
  USER_EMAIL: 'userEmail',

  // Visitor tracking
  VISITOR_RETURNING: 'saleszium_visitor_returning',
  PREV_URL: 'prevUrl',

  // Campaign
  CAMPAIGN_VIEWS: 'saleszium_campaign_views',

  // Config
  CHATBOT_CONFIG: 'chatbot-config',
} as const;

// Cookie names
export const COOKIE_KEYS = {
  USER_EMAIL: 'userEmail',
} as const;
