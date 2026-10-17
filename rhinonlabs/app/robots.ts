import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Paths no crawler needs: internal routes and one-off email links
const PRIVATE = ['/admin', '/api', '/unsubscribe'];

// AI search & assistant crawlers, explicitly welcomed. Being readable by these
// is what gets Rhinon Labs cited in ChatGPT, Claude, Perplexity, Gemini and
// Apple answers (generative engine optimisation). /llms.txt is their index.
const AI_CRAWLERS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',              // OpenAI
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User',         // Anthropic
    'PerplexityBot', 'Perplexity-User',                     // Perplexity
    'Google-Extended',                                      // Gemini / Vertex AI
    'Applebot', 'Applebot-Extended',                        // Apple Intelligence
    'Bingbot',                                              // Bing, Copilot & ChatGPT search
    'DuckAssistBot', 'MistralAI-User', 'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/', disallow: PRIVATE },
            { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
