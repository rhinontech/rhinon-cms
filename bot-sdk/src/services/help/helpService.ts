// Help and articles service
import { serverApi } from '../api';
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
  const response = await serverApi.get(`${ENDPOINTS.ARTICLES}/${articleId}`);
  return response.data;
};
