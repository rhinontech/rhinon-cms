import React, { useState, useEffect, memo } from 'react';
import { getSecureViewUrl } from '../../services/chat/fileService';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | null | undefined;
}

export const SecureImage: React.FC<SecureImageProps> = memo(({ src, className, alt, ...props }) => {
    const [imgSrc, setImgSrc] = useState<string>("");

    useEffect(() => {
        let active = true;
        const resolveSrc = async () => {
            console.log('[SecureImage] Resolving src:', src);

            if (!src) {
                setImgSrc("");
                return;
            }

            // If src starts with 'platform-uploads/', treat it as an S3 key directly
            if (src.startsWith('platform-uploads/')) {
                console.log('[SecureImage] Detected platform-uploads key:', src);
                try {
                    const url = await getSecureViewUrl(src);
                    console.log('[SecureImage] Got presigned URL:', url);
                    if (active && url) {
                        setImgSrc(url);
                        return;
                    }
                } catch (err) {
                    console.error("[SecureImage] Failed to resolve S3 key", err);
                }
            }

            // Handle full URLs that contain platform-uploads (e.g., http://localhost:8081/platform-uploads/...)
            if (src.includes('://') && src.includes('/platform-uploads/')) {
                const parts = src.split('/platform-uploads/');
                if (parts.length > 1) {
                    const potentialKey = 'platform-uploads/' + parts[1];
                    try {
                        const url = await getSecureViewUrl(potentialKey);
                        if (active && url) {
                            setImgSrc(url);
                            return;
                        }
                    } catch (err) {
                        console.warn("Failed to resolve key from legacy URL", err);
                    }
                }
            }

            if (src.startsWith('http') || src.startsWith('data:')) {
                setImgSrc(src);
                return;
            }

            try {
                const url = await getSecureViewUrl(src);
                if (active && url) setImgSrc(url);
            } catch (err) {
                console.error("Failed to resolve secure image", err);
            }
        };
        resolveSrc();
        return () => { active = false; };
    }, [src]);

    if (!imgSrc) return null;

    return <img src={imgSrc} alt={alt} className={className} {...props} />;
});

SecureImage.displayName = 'SecureImage';
