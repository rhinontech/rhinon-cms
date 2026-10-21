// Ticket type definitions

export interface TicketConversation {
  role: string;
  text: string;
}

export interface TicketCreatePayload {
  chatbot_id: string;
  customer_email: string;
  subject: string;
  conversations: TicketConversation[];
  custom_data?: Record<string, string>;
}

export interface Ticket {
  ticket_id: string;
  status: string;
  assigned_user_id: number;
  rating: number;
  updated_at: string;
}

export interface TicketField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}
