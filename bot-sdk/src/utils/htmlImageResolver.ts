import { resolveS3Key, PLACEHOLDER_IMAGE } from './s3KeyResolver';

/**
 * Parses HTML content and resolves S3 keys in <img> tags to presigned URLs.
 * Uses a placeholder to prevent 404 errors during loading.
 * 
 * @param html - The HTML content to process
 * @returns Promise<string> - The processed HTML with resolved image URLs
 */
export async function resolveImagesInHTML(html: string): Promise<string> {
    if (!html) return "";

    // Create a temporary div to parse the HTML
    const div = document.createElement("div");
    div.innerHTML = html;

    // Find all img tags
    const images = div.querySelectorAll("img");

    // Process each image
    const promises = Array.from(images).map(async (img) => {
        const src = img.getAttribute("src");
        if (!src) return;

        // Check if src is an S3 key (not a full URL)
        const isS3KeyValue =
            !src.startsWith("http://") &&
            !src.startsWith("https://") &&
            !src.startsWith("data:") &&
            !src.startsWith("blob:");

        if (isS3KeyValue) {
            // Store original S3 key in data attribute
            img.setAttribute("data-s3-key", src);
            // Set placeholder immediately to prevent browser from loading S3 key as relative URL
            img.setAttribute("src", PLACEHOLDER_IMAGE);

            try {
                // Get presigned URL for the S3 key
                // We pass null for chatbotBaseUrl as resolveS3Key handles the base URL internally
                const presignedUrl = await resolveS3Key(src, null);

                if (presignedUrl && presignedUrl !== src) {
                    img.setAttribute("src", presignedUrl);
                } else {
                    console.error(`Failed to resolve S3 key: ${src}`);
                }
                // Clean up data attribute
                img.removeAttribute("data-s3-key");
            } catch (error) {
                console.error(`Failed to resolve S3 key: ${src}`, error);
                // Keep placeholder on error or cleanup
                img.removeAttribute("data-s3-key");
            }
        }
    });

    // Wait for all images to be processed
    await Promise.all(promises);

    // Return the processed HTML
    return div.innerHTML;
}
