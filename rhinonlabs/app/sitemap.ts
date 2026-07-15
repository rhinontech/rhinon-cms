import { MetadataRoute } from 'next';
import { getBlogs, getCaseStudies } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rhinonlabs.com';

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/contact-us`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        // {
        //     url: `${baseUrl}/about`,
        //     lastModified: new Date(),
        //     changeFrequency: 'monthly',
        //     priority: 0.8,
        // },
        {
            url: `${baseUrl}/case-studies`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blogs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    try {
        const [blogs, caseStudies] = await Promise.all([
            getBlogs(),
            getCaseStudies()
        ]);

        const blogRoutes = blogs.map((blog) => {
            let lastMod = new Date();
            if (blog.publishedAt) {
                const parsed = new Date(blog.publishedAt);
                if (!isNaN(parsed.getTime())) {
                    lastMod = parsed;
                }
            }
            return {
                url: `${baseUrl}/blogs/${blog.slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            };
        });

        const caseStudyRoutes = caseStudies.map((cs) => {
            let lastMod = new Date();
            if (cs.date) {
                const parsed = new Date(cs.date);
                if (!isNaN(parsed.getTime())) {
                    lastMod = parsed;
                }
            }
            return {
                url: `${baseUrl}/case-studies/${cs.slug}`,
                lastModified: lastMod,
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            };
        });

        return [...staticRoutes, ...blogRoutes, ...caseStudyRoutes];
    } catch (error) {
        console.error('Error generating dynamic sitemap:', error);
        return staticRoutes;
    }
}

