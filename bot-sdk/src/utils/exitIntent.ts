// Exit intent detection utilities

type ExitIntentCallback = () => void;

let mouseLeaveListener: ((e: MouseEvent) => void) | null = null;
let scrollListener: (() => void) | null = null;
let hasTriggered = false;

/**
 * Detect when user's mouse leaves the top of the viewport (exit intent)
 */
const detectMouseLeave = (callback: ExitIntentCallback): void => {
    mouseLeaveListener = (e: MouseEvent) => {
        // Only trigger if mouse leaves from the top
        if (e.clientY <= 0 && !hasTriggered) {
            hasTriggered = true;
            callback();
        }
    };

    document.addEventListener('mouseout', mouseLeaveListener);
};

/**
 * Detect when user scrolls past a certain depth
 */
const detectScrollDepth = (threshold: number, callback: ExitIntentCallback): void => {
    scrollListener = () => {
        if (hasTriggered) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;

        if (scrollPercentage >= threshold) {
            hasTriggered = true;
            callback();
        }
    };

    window.addEventListener('scroll', scrollListener);
};

/**
 * Initialize exit intent detection
 * @param callback Function to call when exit intent is detected
 * @param options Configuration options
 */
export const initExitIntent = (
    callback: ExitIntentCallback,
    options: {
        enableMouseLeave?: boolean;
        enableScrollDepth?: boolean;
        scrollThreshold?: number;
    } = {}
): void => {
    const {
        enableMouseLeave = true,
        enableScrollDepth = false,
        scrollThreshold = 80
    } = options;

    // Reset trigger flag
    hasTriggered = false;

    // Enable mouse leave detection
    if (enableMouseLeave) {
        detectMouseLeave(callback);
    }

    // Enable scroll depth detection
    if (enableScrollDepth) {
        detectScrollDepth(scrollThreshold, callback);
    }
};

/**
 * Clean up exit intent event listeners
 */
export const cleanupExitIntent = (): void => {
    if (mouseLeaveListener) {
        document.removeEventListener('mouseout', mouseLeaveListener);
        mouseLeaveListener = null;
    }

    if (scrollListener) {
        window.removeEventListener('scroll', scrollListener);
        scrollListener = null;
    }

    hasTriggered = false;
};

/**
 * Check if exit intent has already been triggered in this session
 */
export const hasExitIntentTriggered = (): boolean => {
    return hasTriggered;
};

/**
 * Reset exit intent trigger (useful for testing)
 */
export const resetExitIntent = (): void => {
    hasTriggered = false;
};
