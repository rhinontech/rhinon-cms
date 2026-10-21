import { serverApi } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';

/**
 * Check if a URL is an S3 key that needs to be resolved
 */
export function isS3Key(url: string | undefined): boolean {
    if (!url) return false;
    return (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("data:") &&
        !url.startsWith("blob:")
    );
}

/**
 * Transparent 1x1 pixel placeholder to prevent browser from loading S3 keys
 */
export const PLACEHOLDER_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Get a safe initial src for an image - returns placeholder if S3 key, otherwise returns the URL
 */
export function getInitialSrc(url: string | undefined): string {
    if (!url) return PLACEHOLDER_IMAGE;
    if (isS3Key(url)) return PLACEHOLDER_IMAGE;
    return url;
}

/**
 * Resolve S3 key to presigned URL
 * @param key - The S3 key
 * @param chatbotBaseUrl - Base URL for the API (unused, kept for compatibility)
 * @returns Promise<string> - Presigned URL or placeholder on failure
 */
export async function resolveS3Key(
    key: string,
    chatbotBaseUrl: string | null
): Promise<string> {
    if (!key) return PLACEHOLDER_IMAGE;

    // If it's already a full URL, return it as-is
    if (!isS3Key(key)) {
        return key;
    }

    try {
        console.log('[s3KeyResolver] Resolving S3 key:', key);
        const response = await serverApi.post(ENDPOINTS.PRESIGNED_URL, { key });

        if (response.data && response.data.downloadUrl) {
            console.log('[s3KeyResolver] Successfully resolved S3 key');
            return response.data.downloadUrl;
        } else {
            console.error('[s3KeyResolver] No downloadUrl in response:', response.data);
            return PLACEHOLDER_IMAGE;
        }
    } catch (error) {
        console.error("[s3KeyResolver] Error resolving S3 key:", error);
        return PLACEHOLDER_IMAGE; // Return placeholder on error instead of the S3 key
    }
}
