// Help and articles service
import { serverApi, isTestingMode } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { Folder, Article } from '@/types';

/**
 * Fetch folders with articles for help center
 */
export const fetchFoldersWithArticles = async (chatbotId: string): Promise<Folder[]> => {
  try {
    const response = await serverApi.get(ENDPOINTS.FOLDERS_STRUCTURE, {
      params: { chatbot_id: chatbotId },
    });
    // Ensure we return an array
    return Array.isArray(response.data.folders) ? response.data.folders : [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};

/**
 * Get a single article by ID
 */
export const getArticle = async (articleId: string): Promise<Article> => {
  // The admin's preview reads articles without counting views.
  const response = await serverApi.get(`${ENDPOINTS.ARTICLES}/${articleId}`, {
    params: isTestingMode() ? { preview: 1 } : undefined,
  });
  return response.data;
};

/** "Was this helpful?" — one vote per article per browser; ignored in the admin preview. */
export const sendArticleFeedback = async (articleId: string, helpful: boolean): Promise<void> => {
  if (isTestingMode()) return;
  try {
    await serverApi.post(`${ENDPOINTS.ARTICLES}/${articleId}/feedback`, { helpful });
  } catch {
    // A lost vote isn't worth bothering the visitor about.
  }
};
