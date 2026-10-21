// Visitor tracking utilities for campaign targeting

/**
 * Check if the current visitor is returning or first-time
 */
export const isReturningVisitor = (): boolean => {
    const hasVisited = localStorage.getItem('saleszium_visitor_returning');
    return hasVisited === 'true';
};

/**
 * Mark visitor as returning for future visits
 */
export const markVisitorAsReturning = (): void => {
    localStorage.setItem('saleszium_visitor_returning', 'true');
};

/**
 * Get time elapsed since page load in seconds
 */
export const getPageLoadTime = (): number => {
    if (typeof window === 'undefined' || !window.performance) {
        return 0;
    }
    return Math.floor((Date.now() - window.performance.timing.navigationStart) / 1000);
};

/**
 * Get current page URL
 */
export const getCurrentUrl = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }
    return window.location.href;
};

/**
 * Get referrer URL
 */
export const getReferrerUrl = (): string => {
    if (typeof document === 'undefined') {
        return '';
    }
    return document.referrer || '';
};

/**
 * Initialize visitor tracking
 * Call this once when the chatbot loads
 */
export const initVisitorTracking = (): void => {
    // Mark as returning visitor after first visit
    if (!isReturningVisitor()) {
        // Set a flag to mark as returning on next visit
        setTimeout(() => {
            markVisitorAsReturning();
        }, 5000); // Mark as returning after 5 seconds on site
    }
};
