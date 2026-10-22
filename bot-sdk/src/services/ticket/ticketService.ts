// Ticket service
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { TicketCreatePayload, Ticket } from '@/types';

/**
 * Create a new ticket
 */
export const submitTicket = async (values: TicketCreatePayload) => {
  const response = await serverApi.post(ENDPOINTS.CREATE_TICKET, values);
  return response.data;
};

/**
 * Get tickets status for a user
 */
export const getTicketsStatus = async (
  chatbotId: string,
  userEmail: string
): Promise<Ticket[]> => {
  try {
    const response = await serverApi.post(ENDPOINTS.GET_TICKETS, {
      chatbot_id: chatbotId,
      user_email: userEmail,
    });
    // Ensure we return an array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
};

/**
 * Update ticket rating
 */
export const updateTicketRating = async (ticketId: string, rating: number) => {
  const response = await serverApi.post(ENDPOINTS.TICKET_RATING, {
    ticket_id: ticketId,
    rating,
  });
  return response.data;
};
