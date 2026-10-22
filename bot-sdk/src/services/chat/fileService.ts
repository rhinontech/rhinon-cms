// File upload service
import axios from 'axios';
import { getServerApiUrl, getCurrentAppId } from '../api';
import { ENDPOINTS } from '../api/endpoints';

export interface UploadResult {
  url: string;
  fileName: string;
  key?: string;
}

/**
 * Upload a file for conversation attachments
 */
export const uploadConversationFile = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  // Before the file: the server resolves the bot as soon as multer reaches it.
  formData.append('chatbot_id', getCurrentAppId());
  formData.append('file', file);

  const response = await axios.post(
    `${getServerApiUrl()}${ENDPOINTS.FILE_UPLOAD_CONVERSATION}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

export const getSecureViewUrl = async (key: string): Promise<string> => {
  try {
    const response = await axios.get(`${getServerApiUrl()}${ENDPOINTS.PRESIGNED_URL}`, {
      params: { key, chatbot_id: getCurrentAppId() },
    });
    return response.data.downloadUrl;
  } catch (error) {
    console.error("Error fetching secure view URL:", error);
    return "";
  }
};
