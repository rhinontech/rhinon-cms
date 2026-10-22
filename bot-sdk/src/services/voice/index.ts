/**
 * Voice conversation services
 */

import { getAiApiUrl } from '../api';

export interface VoiceClientSecret {
  value: string;
  expires_at?: number;
}

export interface VoiceSessionResponse {
  client_secret: VoiceClientSecret;
  session_id?: string;
  api_key?: string;
  websocket_url?: string;
  config?: any;
}

/**
 * Get a voice session token for real-time voice communication
 */
// Request types
export interface RealtimeLeadRequest {
  chatbot_id: string;
  email?: string;
  name?: string;
  phone?: string;
}

export interface RealtimeSearchRequest {
  chatbot_id: string;
  query: string;
}

export interface RealtimeHandoffRequest {
  chatbot_id: string;
  email: string;
  name?: string;
  phone?: string;
  urgency?: string;
  user_id?: string | null;
}

/**
 * Get a voice session token for real-time voice communication
 */
export const getVoiceSessionToken = async (chatbot_id: string, user_email?: string): Promise<VoiceSessionResponse> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/gcs/realtime/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatbot_id,
        user_email: user_email || undefined
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to start voice session', error);
    throw error;
  }
};

/**
 * Search Knowledge Base for Realtime Voice
 */
export const searchVoiceKnowledge = async (data: RealtimeSearchRequest): Promise<any> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/gcs/realtime/search_knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to search knowledge base', error);
    // Return empty result on error so conversation continues
    return { result: "Error searching knowledge base." };
  }
};

/**
 * Submit lead details collected via Voice
 */
export const submitVoiceLead = async (data: RealtimeLeadRequest): Promise<any> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/gcs/realtime/submit_lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to submit voice lead', error);
    // Don't throw, just log. The voice session shouldn't crash if save fails.
    return { status: 'error', message: 'Failed to save' };
  }
};

/**
 * Handoff customer to support pipeline
 */
export const handoffSupport = async (data: RealtimeHandoffRequest): Promise<any> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/gcs/realtime/handoff_support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to handoff support', error);
    return { result: "Failed to handoff." };
  }
};
