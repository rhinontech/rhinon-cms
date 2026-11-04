import { MetadataRoute } from 'next';
import { getBlogs, getCaseStudies } from '@/lib/api';
import { services } from '@/lib/services';

// Real last-edited dates for static pages (replaces fake "new Date()" timestamps)
const STATIC_PAGE_LASTMOD: Record<string, string> = {
    '/': '2026-10-25',
    '/build': '2026-10-15',
    '/contact-us': '2026-09-01',
    '/case-studies': '2026-10-20',
    '/blogs': '2026-10-28',
    '/schedule-call': '2026-09-01',
    '/privacy-terms': '2026-08-01',
    '/services': '2026-10-20',
};

// Real completion dates for case studies (replaces placeholder 2025-01-01 / 2026-01-01)
const CASE_STUDY_DATES: Record<string, string> = {
    'furrcircle-the-all-in-one-app-for-pet-parents': '2026-06-15',
    'apexispro': '2026-04-10',
    'srfitout': '2025-11-20',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rhinonlabs.com';

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/']),
        },
        {
            url: `${baseUrl}/build`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/build']),
        },
        {
            url: `${baseUrl}/contact-us`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/contact-us']),
        },
        {
            url: `${baseUrl}/case-studies`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/case-studies']),
        },
        {
            url: `${baseUrl}/blogs`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/blogs']),
        },
        {
            url: `${baseUrl}/schedule-call`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/schedule-call']),
        },
        {
            url: `${baseUrl}/privacy-terms`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/privacy-terms']),
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(STATIC_PAGE_LASTMOD['/services']),
        },
        ...services.map((s) => ({
            url: `${baseUrl}/services/${s.slug}`,
            lastModified: new Date(s.lastModified),
        })),
    ];

    const [blogs, caseStudies] = await Promise.all([
        getBlogs(),
        getCaseStudies()
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => {
        const rawDate = blog.updatedAt || blog.publishedAt;
        const parsed = rawDate ? new Date(rawDate) : new Date('2026-10-01');
        return {
            url: `${baseUrl}/blogs/${blog.slug}`,
            lastModified: isNaN(parsed.getTime()) ? new Date('2026-10-01') : parsed,
        };
    });

    const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies.map((cs) => {
        const rawDate = cs.updatedAt || CASE_STUDY_DATES[cs.slug] || cs.date;
        const parsed = rawDate ? new Date(rawDate) : new Date('2026-04-01');
        return {
            url: `${baseUrl}/case-studies/${cs.slug}`,
            lastModified: isNaN(parsed.getTime()) ? new Date('2026-04-01') : parsed,
        };
    });

    return [...staticRoutes, ...blogRoutes, ...caseStudyRoutes];
}

