import React, { useEffect, useState } from 'react';
import {
  Send,
  ChevronRight,
  ChevronLeft,
  X,
  Ticket,
  History,
  Check,
  MessageCircle,
} from 'lucide-react';
import './HomeScreen.scss';
import { Loader } from '@/components/common';
import RaiseTicket from '@/screens/TicketScreen/RaiseTicket';
import TicketRating from './TicketRating/TicketRating';
import { motion } from 'motion/react';

// New imports from restructured modules
import type { TicketField, ChatbotConfig, HomeScreenProps } from '@/types';
import { getConversationByUserId } from '@/services/chat';
import { getTicketsStatus, updateTicketRating } from '@/services/ticket';

// Assets
import svgIcons from '@assets/svgIcons';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';
import { AVATARS, BACKGROUNDS } from '@/constants/urls';

interface IConversationIds {
  conversation_id: string;
  title: string;
  last_chat_time: string;
  avatar?: string;
  name?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  type?: 'bot' | 'support';
}

interface ticket {
  ticket_id: string;
  status: string;
  assigned_user_id: number;
  rating: number;
  updated_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  isAdmin,
  isFreePlan,
  chatbot_config,
  userId,
  appId,
  setIsTicketRaised,
  setSelectedChatId,
  ticketForm,
  userEmail,
  onChatSelect,
  mainLoading,
  showNotification,
}) => {
  const [conversationIds, setConversationIds] = useState<IConversationIds>();
  const [loading, setLoading] = useState<boolean>(true);
  const [supportTicket, setSupportTicket] = useState<boolean>(false);
  const [ticket, setTicket] = useState<ticket>(null);
  const [openTicket, setOpenTicket] = useState<boolean>(false);
  const [tickets, setTickets] = useState<ticket[]>([]);
  const [resolvedBgImage, setResolvedBgImage] = useState<string>(() => getInitialSrc(chatbot_config.backgroundImage));
  const [resolvedLogo, setResolvedLogo] = useState<string>(() => getInitialSrc(chatbot_config.primaryLogo));

  const fetchConversation = async () => {
    try {
      const response = await getConversationByUserId(userId, appId);
      const sortedConversations = response.conversation.sort(
        (a: IConversationIds, b: IConversationIds) =>
          new Date(b.last_chat_time).getTime() -
          new Date(a.last_chat_time).getTime(),
      );
      setConversationIds(sortedConversations[0]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    // Admin preview: sample tickets so the list can be seen.
    if (isAdmin) {
      const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
      setTickets([
        { ticket_id: 'TKT-1042', status: 'Open', assigned_user_id: 1, rating: null, updated_at: ago(2), subject: 'Invoice copy for September' },
        { ticket_id: 'TKT-1038', status: 'Resolved', assigned_user_id: 1, rating: 5, updated_at: ago(30), subject: 'Change billing email' },
        { ticket_id: 'TKT-1031', status: 'Open', assigned_user_id: null, rating: null, updated_at: ago(70), subject: 'API access for our team' },
      ] as any);
      setLoading(false);
      return;
    }
    try {
      const response = await getTicketsStatus(appId, userEmail);

      const sortedTickets = [...response].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );

      setTickets(sortedTickets);
    } catch (error) {
      console.error('Error fetching tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      fetchConversation();
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [userId, appId, showNotification]);

  // Resolve S3 keys for images
  useEffect(() => {
    const resolveImages = async () => {
      if (chatbot_config.backgroundImage) {
        const resolved = await resolveS3Key(chatbot_config.backgroundImage, null);
        setResolvedBgImage(resolved);
      }
      if (chatbot_config.primaryLogo) {
        const resolved = await resolveS3Key(chatbot_config.primaryLogo, null);
        setResolvedLogo(resolved);
      }
      if (conversationIds?.avatar) {
        const resolved = await resolveS3Key(conversationIds.avatar, null);
        // We need a state for resolved avatar, adding it now
        setConversationIds(prev => prev ? { ...prev, avatar: resolved } : prev);
      }
    };
    resolveImages();
  }, [chatbot_config.backgroundImage, chatbot_config.primaryLogo, conversationIds?.avatar]);

  const handleSendMessage = (conversationId?: string) => {
    onNavigate('chats');

    if (isFreePlan || isAdmin) {
      onChatSelect('NEW_CHAT');
    } else {
      conversationId ? onChatSelect(conversationId) : null;
    }
  };


  const handleSubmitRating = async (value: number) => {
    // Admin preview: sample tickets only, nothing to save.
    if (isAdmin) {
      setTicket((prev: any) => (prev ? { ...prev, rating: value } : prev));
      return;
    }
    try {
      const res = await updateTicketRating(ticket.ticket_id, value);

      // Update local state so UI reflects new rating
      setTicket((prev: any) => (prev ? { ...prev, rating: value } : prev));

      await fetchTickets();
      console.log('Updated rating:', value);
      console.log('Server response:', res);
    } catch (error) {
      console.error('Failed to update rating', error);
    }
  };

  if (loading || mainLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <motion.div
      className={`home-container ${supportTicket || ticket || openTicket ? 'rh-sheet-open' : ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* All Support ticket pop up */}

      {/* Your tickets — list */}
      {supportTicket && !ticket && (
        <div className='overlay rh-sheet-overlay' onClick={() => setSupportTicket(false)}>
          <div className='rh-sheet' onClick={(e) => e.stopPropagation()} style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}>
            <div className='rh-sheet-header'>
              <div>
                <p className='rh-sheet-title'>Your tickets</p>
                <p className='rh-sheet-sub'>Requests we&apos;re following up by email</p>
              </div>
              <button type='button' className='rh-icon-btn' aria-label='Close' onClick={() => setSupportTicket(false)}>
                <X size={18} />
              </button>
            </div>
            <div className='rh-sheet-body'>
              {tickets.length === 0 ? (
                <div className='rh-empty'>
                  <p className='rh-empty-title'>No tickets yet</p>
                  <p className='rh-empty-sub'>Raise one from Home and we&apos;ll reply by email.</p>
                </div>
              ) : (
                tickets.map((item, index) => (
                  <button type='button' key={index} className='rh-ticket-row' onClick={() => setTicket(item)}>
                    <span className='rh-row-icon'><Ticket size={16} /></span>
                    <span className='rh-row-text'>
                      <span className='rh-row-title'>{(item as any).subject || `Ticket ${item.ticket_id}`}</span>
                      <span className='rh-row-sub'>#{item.ticket_id} · updated {ticketAge(item.updated_at)}</span>
                    </span>
                    <span className={`rh-status ${item.status.toLowerCase() === 'resolved' ? 'done' : 'open'}`}>
                      {item.status.toLowerCase() === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Your tickets — one ticket */}
      {ticket && (
        <div className='overlay rh-sheet-overlay' onClick={() => setTicket(null)}>
          <div className='rh-sheet' onClick={(e) => e.stopPropagation()} style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}>
            <div className='rh-sheet-header'>
              <button type='button' className='rh-icon-btn' aria-label='Back' onClick={() => setTicket(null)}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className='rh-sheet-title'>{(ticket as any).subject || 'Ticket'}</p>
                <p className='rh-sheet-sub'>#{ticket.ticket_id}</p>
              </div>
              <span className={`rh-status ${ticket.status.toLowerCase() === 'resolved' ? 'done' : 'open'}`}>
                {ticket.status.toLowerCase() === 'resolved' ? 'Resolved' : 'Open'}
              </span>
            </div>
            <div className='rh-sheet-body'>
              {(() => {
                const resolved = ticket.status.toLowerCase() === 'resolved';
                const assigned = ticket.assigned_user_id !== null || resolved;
                const steps = [
                  { label: 'Ticket created', done: true },
                  { label: 'With the team', done: assigned },
                  { label: 'Resolved', done: resolved },
                ];
                return (
                  <ol className='rh-timeline'>
                    {steps.map((step, i) => (
                      <li key={step.label} className={step.done ? 'done' : ''}>
                        <span className='rh-timeline-dot'>{step.done ? <Check size={11} /> : null}</span>
                        <span className='rh-timeline-label'>{step.label}</span>
                        {i === steps.filter((x) => x.done).length - 1 && (
                          <span className='rh-timeline-time'>{ticketAge(ticket.updated_at)}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                );
              })()}

              {ticket.status.toLowerCase() === 'resolved' && (
                <div className='rh-rating'>
                  <p className='rh-rating-label'>How did we do?</p>
                  <TicketRating value={ticket.rating} name='rating' required={true} handleSubmitRating={handleSubmitRating} />
                </div>
              )}

              <div className='rh-help-card'>
                <div>
                  <p className='rh-help-title'>Need more help?</p>
                  <p className='rh-help-sub'>Chat with us for a quicker answer.</p>
                </div>
                <button
                  type='button'
                  className='rh-help-btn'
                  onClick={() => {
                    setTicket(null);
                    setSupportTicket(false);
                    handleSendMessage();
                  }}
                >
                  <MessageCircle size={15} /> Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* raise a ticket button click event */}
      {openTicket && (
        <div className='overlay' onClick={() => setOpenTicket(false)}>
          <RaiseTicket
            setOpenTicket={setOpenTicket}
            // userId={email}
            appId={appId}
            setIsTicketRaised={setIsTicketRaised}
            chatbot_config={chatbot_config}
            ticketForm={ticketForm}
            previewOnly={isAdmin}
          />
        </div>
      )}

      {/* Header band — brand colour (or their background image), logo, greeting */}
      <motion.div className={`rh-home-hero ${chatbot_config.isBgFade ? 'rh-fade' : ''}`} variants={itemVariants}
        style={{
          ['--primary-color' as any]: chatbot_config.primaryColor,
          // Background image on but none uploaded: the built-in default image.
          ...(chatbot_config.isBackgroundImage
            ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55)), url(${resolvedBgImage || chatbot_config.backgroundImage || BACKGROUNDS.default})` }
            : {}),
        }}
      >
        <div className='rh-home-hero-top'>
          <img className='rh-home-logo' src={resolvedLogo || chatbot_config.primaryLogo} alt='' />
          <div className='rh-home-team' aria-hidden>
            <img src={AVATARS.BOT} alt='' />
            <img src={AVATARS.SUPPORT} alt='' />
          </div>
        </div>
        <h1 className='rh-home-greeting'>{chatbot_config.greetings[0]}</h1>
        <p className='rh-home-subgreeting'>{chatbot_config.greetings[1]}</p>

          {/* Start or continue a conversation */}
          <button type='button' className='rh-card rh-card-cta' onClick={() => handleSendMessage()}
            style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}>
            <div className='rh-card-cta-text'>
              <span className='rh-card-title'>Send us a message</span>
              <span className='rh-card-sub'>
                <span className='rh-online-dot' /> We usually reply in a few minutes
              </span>
            </div>
            <span className='rh-card-cta-icon'><Send size={18} /></span>
          </button>
      </motion.div>

      <div className='rh-home-cards'>

        {conversationIds?.conversation_id && (
          <motion.div variants={itemVariants}>
            <p className='rh-section-label'>Recent conversation</p>
            <button type='button' className='rh-card rh-row' onClick={() => handleSendMessage(conversationIds?.conversation_id)}>
              <span className='rh-row-avatar'>
                <img
                  src={conversationIds?.avatar || (conversationIds?.type === 'support' ? AVATARS.SUPPORT : AVATARS.BOT)}
                  alt=''
                />
                {showNotification && <span className='rh-unread-dot' />}
              </span>
              <span className='rh-row-text'>
                <span className='rh-row-title'>{conversationIds?.title || chatbot_config.chatbotName}</span>
                <span className='rh-row-sub'>
                  {conversationIds?.lastMessage?.includes('<a href') || conversationIds?.lastMessage?.includes('platform-uploads')
                    ? '📎 Attachment'
                    : conversationIds?.lastMessage || 'Continue where you left off'}
                </span>
              </span>
              <ChevronRight size={18} className='rh-row-chevron' />
            </button>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <p className='rh-section-label'>Get help</p>
          <div className='rh-card rh-list'>
            <button type='button' className='rh-row' onClick={() => setOpenTicket(true)}>
              <span className='rh-row-icon'><Ticket size={18} /></span>
              <span className='rh-row-text'>
                <span className='rh-row-title'>Raise a ticket</span>
                <span className='rh-row-sub'>We&apos;ll follow up by email</span>
              </span>
              <ChevronRight size={18} className='rh-row-chevron' />
            </button>
            <button
              type='button'
              className='rh-row'
              onClick={() => {
                setSupportTicket(true);
                fetchTickets();
              }}
            >
              <span className='rh-row-icon'><History size={18} /></span>
              <span className='rh-row-text'>
                <span className='rh-row-title'>Your tickets</span>
                <span className='rh-row-sub'>Check the status of a request</span>
              </span>
              <ChevronRight size={18} className='rh-row-chevron' />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>


  );
};

/** "just now", "5 min ago", "3 h ago", "12 Oct". */
function ticketAge(iso: string): string {
  const then = new Date(iso);
  const min = Math.round((Date.now() - then.getTime()) / 60000);
  if (Number.isNaN(min)) return '';
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default HomeScreen;
