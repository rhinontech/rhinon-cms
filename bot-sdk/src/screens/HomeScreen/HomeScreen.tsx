import React, { useEffect, useState } from 'react';
import {
  Send,
  ChevronRight,
  X,
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
import { AVATARS } from '@/constants/urls';

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
      className='home-container'
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* All Support ticket pop up */}

      {(supportTicket && !isAdmin) && (
        <div className='overlay' onClick={() => setSupportTicket(false)}>
          <div className='popup-all' onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
              className='popup-ticket-header'
              style={{
                background: "var(--bg-primary)",
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
              }}
            >
              <div
                onClick={() => setSupportTicket(false)}
                style={{
                  cursor: 'pointer',
                  height: 36,
                  width: 36,
                  border: '1px solid #BEBEBE',
                  borderRadius: 8,
                  display: 'flex',
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              >
                <X size={20} />
              </div>
              <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>
                Support Ticket
              </h3>
            </div>

            {tickets.length !== 0 ? (
              <div
                className='popup-card-container'
                style={{ marginTop: '10px' }}
              >
                {tickets.map((item, index) => (
                  <div
                    key={index}
                    className=''
                    onClick={() => setTicket(item)}
                    style={{
                      display: 'flex',
                      background: 'var(--bg-primary)',
                      borderRadius: '16px',
                      padding: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    <div className='ticket-card-details' style={{ flex: 1 }}>
                      <p>Ticket ID</p>
                      <p
                        style={{
                          color: '#3E68FC',
                          fontWeight: '600',
                          letterSpacing: '2px',
                        }}
                      >
                        {item.ticket_id}
                      </p>
                      <p style={{ marginTop: '10px' }}>Current Status</p>
                      <p
                        style={{
                          fontWeight: '550',
                          color: '#00B548',
                          letterSpacing: '2px',
                          borderLeft: '2px solid #00B548',
                          padding: '10px',
                        }}
                      >
                        {item.status.toLocaleUpperCase()}
                      </p>
                    </div>
                    <div style={{ margin: 'auto' }}>
                      <ChevronRight />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className='popup-card-container'
                style={{ marginTop: '10px' }}
              >
                <p style={{ margin: 'auto' }}>No tickets found</p>
              </div>
            )}
          </div>
        </div>
      )}
      {ticket && (
        <div className='overlay' onClick={() => setTicket(null)}>
          <div className='popup-all' onClick={(e) => e.stopPropagation()}>
            <div
              className=''
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '15px',
                position: 'relative',
              }}
            >
              <div
                onClick={() => {
                  setTicket(null);
                }}
                style={{
                  cursor: 'pointer',
                  height: 36,
                  width: 36,
                  border: '1px solid #BEBEBE',
                  borderRadius: 8,
                  display: 'flex',
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                  right: '10px',
                  top: '10px',
                  zIndex: 10,
                }}
              >
                <X size={20} />
              </div>
              <div
                className='ticket-card-details'
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div>
                  <p>Ticket ID</p>
                  <p
                    style={{
                      color: '#3E68FC',
                      fontWeight: '600',
                      letterSpacing: '2px',
                    }}
                  >
                    {ticket.ticket_id}
                  </p>
                </div>
                <div>
                  <p>Current Status</p>
                  <p
                    style={{
                      fontWeight: '550',
                      color: '#00B548',
                      letterSpacing: '2px',
                      borderLeft: '2px solid #00B548',
                      padding: '10px',
                    }}
                  >
                    {ticket.status.toLocaleUpperCase()}
                  </p>
                </div>
                {ticket.status.toLowerCase() === 'resolved' && (
                  <form>
                    <div>
                      <p>Rate your experience</p>
                      <TicketRating
                        value={ticket.rating}
                        name='rating'
                        required={true}
                        handleSubmitRating={handleSubmitRating}
                      />
                    </div>
                  </form>
                )}

                <div>
                  <p>Last Update</p>
                  <p
                    style={{
                      fontWeight: '550',
                      color: '#9F9F9F',
                      letterSpacing: '2px',
                    }}
                  >
                    {ticket.assigned_user_id === null
                      ? 'Ticket created'
                      : ticket.status.toLowerCase() === 'resolved'
                        ? 'Ticket resolved'
                        : 'Assigned to technical team'}
                  </p>
                </div>
                <div>
                  <p>Updated on</p>
                  <p
                    style={{
                      fontWeight: '550',
                      color: '#9F9F9F',
                      letterSpacing: '2px',
                    }}
                  >
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div
                style={{
                  background: chatbot_config.primaryColor,
                  color: 'white',
                  borderRadius: '16px',
                  padding: '10px',
                  marginTop: '10px',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '14px' }}>
                  Need more help?
                </p>
                <p style={{ fontSize: '12px', fontWeight: 400 }}>
                  Continue the conversation with our support bot for real-time
                  assistance or updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* raise a ticket button click event */}
      {(openTicket && !isAdmin) && (
        <div className='overlay' onClick={() => setOpenTicket(false)}>
          <RaiseTicket
            setOpenTicket={setOpenTicket}
            // userId={email}
            appId={appId}
            setIsTicketRaised={setIsTicketRaised}
            chatbot_config={chatbot_config}
            ticketForm={ticketForm}
          />
        </div>
      )}

      {/* Welcome Box */}
      <motion.div className='welcome-box' variants={itemVariants}>
        <div
          className={`welcome-background ${chatbot_config.isBackgroundImage === true
            ? 'with-image'
            : 'gradient'
            } ${chatbot_config.isBgFade ? 'fade' : ''}`}
          style={{
            ['--primary-color' as any]: `${chatbot_config.primaryColor}`,
            ['--background-image' as any]: `url(${resolvedBgImage || chatbot_config.backgroundImage})`,
          }}
        >
          {/* Logo */}
          <div
            className='logo-section'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <img
              src={resolvedLogo || chatbot_config.primaryLogo}
              alt='Chatbot Logo'
              style={{
                maxHeight: '60px', // controls vertical size
                maxWidth: '200px', // prevents overly wide logos
                width: 'auto', // keeps aspect ratio
                objectFit: 'contain', // ensures no stretching
              }}
            />
          </div>

          {/* Greeting */}
          <div className='greeting-section'>
            <h1 className='greeting-title'>{chatbot_config.greetings[0]}</h1>
            <p className='greeting-subtitle'>{chatbot_config.greetings[1]}</p>
            {/* <h1 className='greeting-title'>Hello, Mary Jones</h1> */}
            {/* <p className='greeting-subtitle'>Need help? We've got your back!</p> */}
          </div>

          {/* Message Input */}
          <div className='message-input-section'>
            <div className='input-container'>
              <div className='input-content'>
                <div className='input-text'>
                  <h3>Got a question?</h3>
                  <p>Send us a message we reply in minutes!</p>
                </div>
                <button
                  className='send-button'
                  style={{
                    ['--primary-color' as any]: `${chatbot_config.primaryColor}`,
                  }}
                  onClick={() => handleSendMessage()}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className='content-section'>
        {/* Essential help article */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

          <motion.div variants={itemVariants}>
            <div
              style={{
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0 }}>Recent Conversation</h3>
            </div>
            <motion.div
              className='help-card'
              onClick={() =>
                handleSendMessage(conversationIds?.conversation_id)
              }
              key={conversationIds?.conversation_id}
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.98 }}
            >
              {showNotification && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'red',
                    zIndex: 10,
                  }}
                />
              )}
              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
              >
                {conversationIds?.avatar ? (
                  <img
                    src={conversationIds.avatar}
                    width={50}
                    height={50}
                    style={{ borderRadius: '8px', objectFit: 'cover' }}
                    alt='agent profile'
                  />
                ) : conversationIds?.title === 'Support Chat' || conversationIds?.type === 'support' ? (
                  <img
                    src={AVATARS.SUPPORT}
                    width={50}
                    style={{ borderRadius: '8px' }}
                    alt='support profile'
                  />
                ) : (
                  <img
                    src={AVATARS.BOT}
                    width={50}
                    style={{ borderRadius: '8px' }}
                    alt="bot"
                  />
                )}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
                >
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                    {conversationIds?.title || "Start the Conversation"}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 400,
                      color: '#8A8A8A',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}
                  >
                    {conversationIds?.lastMessage?.includes('<a href') || conversationIds?.lastMessage?.includes('platform-uploads')
                      ? '📷 Photo'
                      : conversationIds?.lastMessage || "Send us a message we usually reply in minutes!"}
                  </p>
                </div>
              </div>
              {/* <svgIcons.ArticleSaveIcon isActive={item.isbookMarked} /> */}
            </motion.div>
          </motion.div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* buttons section */}


          <motion.div variants={itemVariants}>
            <div
              style={{
                marginBottom: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <h3>History/Ticket Searches</h3>
            </div>
            <div
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingBottom: '10px'
              }}
            >
              <motion.div
                onClick={() => setOpenTicket(true)}
                className='ticket-card'
                style={{ width: '100%' }}
                whileHover={{ y: -3, boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svgIcons.ticketsColorIcon />
                <p
                  style={{ fontSize: 12, fontWeight: 500, color: '#8A8A8A' }}
                >
                  Raise a ticket
                </p>
              </motion.div>
              <motion.div
                onClick={() => {
                  setSupportTicket(true);
                  fetchTickets();
                }}
                className='ticket-card'
                style={{ width: '100%' }}
                whileHover={{ y: -3, boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svgIcons.supportHistoryIcon />
                <p
                  style={{ fontSize: 12, fontWeight: 500, color: '#8A8A8A' }}
                >
                  Support history
                </p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>


  );
};

export default HomeScreen;
