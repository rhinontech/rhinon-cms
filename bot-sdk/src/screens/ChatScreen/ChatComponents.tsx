import React, { lazy, Suspense } from 'react';
import {
  ChevronLeft,
  SendHorizontal,
  Smile,
  Paperclip,
  Clock,
  Mic,
  User,
  Bot,
  X,
  Square,
  Minimize2,
  Maximize2,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import StarRating from './StarRating/StarRating';
import { Loader } from '@/components/common';

// Lazy load emoji picker to reduce initial bundle size (~200KB saved)
const EmojiPickerComponent = lazy(() => import('emoji-picker-react'));

// New imports from restructured modules
import type { Message } from '@/types';
import { saveCustomerPhone } from '@/services/config';
import { getSecureViewUrl } from '@/services/chat/fileService';
import { SecureImage } from '@/components/common';
import { AVATARS } from '@/constants/urls';

export type { Message };

// ====== Chat Header Component ======
export const ChatHeader: React.FC<{
  onBack?: () => void;
  isFreePlan?: boolean;
  isAdmin: boolean;
  adminTestingMode: boolean;
  onNavigate: (screen: string) => void;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  setMaxScreen: React.Dispatch<React.SetStateAction<boolean>>;
  supportName: string;
  supportImage: string | null;
  isSpeakingWithRealPerson: boolean;
  isConversationClosed: boolean;
  isConversationActive: boolean;
  maxScreen: boolean;
  closeChatPopup: boolean;
  setCloseChatPopup: React.Dispatch<React.SetStateAction<boolean>>;
  handleCloseChat: () => void;
  chatbot_config: any;
  conversation: any;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
  setSupportName: React.Dispatch<React.SetStateAction<string>>;
}> = ({
  onBack,
  isFreePlan,
  isAdmin,
  onNavigate,
  setWindowWidth,
  setMaxScreen,
  supportName,
  supportImage,
  isSpeakingWithRealPerson,
  isConversationClosed,
  isConversationActive,
  maxScreen,
  closeChatPopup,
  setCloseChatPopup,
  handleCloseChat,
  chatbot_config,
  adminTestingMode,
  conversation,
  setSelectedChatId,
  setSupportName,
}) => {
    const handleMaxScreen = () => {
      setMaxScreen(true);
      setWindowWidth('700px');
    };

    const handleMinScreen = () => {
      setMaxScreen(false);
      setWindowWidth('400px');
    };

    return (
      <div className='chat-header'>
        <div className='contact-info'>
          {onBack && !adminTestingMode && (
            <div
              onClick={() => {
                if (isFreePlan || isAdmin) {
                  if (chatbot_config.isChatHistory) {
                    setSelectedChatId(null);
                    onNavigate('chats');
                  } else {
                    onNavigate('home');
                  }
                } else {
                  setWindowWidth('400px');
                  setMaxScreen(false);
                  setSupportName("Rhinon");
                  onBack();
                }
              }}
              style={{
                cursor: 'pointer',
                height: 36,
                width: 36,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={18} />
            </div>
          )}
          <div className='avatar'>
            {isSpeakingWithRealPerson ? (
              <SecureImage
                src={supportImage || AVATARS.SUPPORT}
                alt={supportName}
              />
            ) : (
              <img
                src={AVATARS.BOT}
                alt='bot'
              />
            )}
          </div>
          <div className='contact-details'>
            <div className='name'>{supportName}</div>
            <div className='status'>
              {isConversationClosed
                ? 'Conversation Closed'
                : !isConversationActive
                  ? 'Conversation Expired'
                  : isSpeakingWithRealPerson
                    ? 'Connected to Support'
                    : 'Connected to chatbot'}
            </div>
          </div>
        </div>
        {!isAdmin && (
          <div className='header-actions'>
            {maxScreen ? (
              <button
                onClick={handleMinScreen}
                className='header-btn-extend'
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                <Minimize2 size={18} />
              </button>
            ) : (
              <button
                onClick={handleMaxScreen}
                className='header-btn-extend'
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                <Maximize2 size={18} />
              </button>
            )}
            {isSpeakingWithRealPerson && conversation !== null && !isConversationClosed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCloseChatPopup((prev) => !prev);
                }}
                style={{ position: 'relative', color: 'var(--text-primary)', }}
                className='header-btn'
              >
                <X size={18} />
                {closeChatPopup && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      width: '200px',
                      right: '0',
                      background: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      zIndex: 100,
                    }}
                  >
                    <p style={{ margin: 0, color: 'black', marginBottom: '8px' }}>
                      Are you sure you want to close the chat?
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={handleCloseChat}
                        className='submit-form-btn'
                        style={{
                          ['--primary-color' as any]: chatbot_config.primaryColor,
                          padding: '10px ',
                          height: 'auto',
                        }}
                      >
                        Close the Chat
                      </button>
                    </div>
                  </div>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

const SecureAttachment: React.FC<{
  fileUrl: string;
  fileName: string;
  isImage: boolean;
}> = ({ fileUrl, fileName, isImage }) => {
  // If it starts with http/data, it's a URL. Otherwise it's a key.
  // We initialize src to fileUrl ONLY if it's already a valid URL, to avoid 404s from trying to load the key as a relative path.
  const isDirectUrl = fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('data:'));
  const [src, setSrc] = React.useState(isDirectUrl ? fileUrl : '');

  React.useEffect(() => {
    if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('data:')) {
      let active = true;
      getSecureViewUrl(fileUrl).then((url) => {
        if (active && url) {
          setSrc(url);
        }
      });
      return () => {
        active = false;
      };
    } else if (fileUrl !== src && (fileUrl.startsWith('http') || fileUrl.startsWith('data:'))) {
      // Update src if prop changes to a direct URL
      setSrc(fileUrl);
    }
  }, [fileUrl]);

  if (isImage) {
    return (
      <a
        href={src}
        target='_blank'
        rel='noopener noreferrer'
        style={{
          display: 'block',
          maxWidth: '200px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #ddd',
          textDecoration: 'none',
        }}
      >
        <img
          src={src}
          alt={fileName}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
        <p
          style={{
            fontSize: '12px',
            textAlign: 'center',
            padding: '4px',
            background: '#f9fafb',
            color: '#374151',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName}
        </p>
      </a>
    );
  } else {
    return (
      <a
        href={src}
        target='_blank'
        rel='noopener noreferrer'
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: 'white',
          textDecoration: 'none',
          color: '#111827',
          fontSize: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        📎
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {fileName}
        </div>
      </a>
    );
  }
};

// ====== Message Item Component ======
export const MessageItem: React.FC<{
  msg: Message;
  index: number;
  supportImage: string | null;
  chatbot_config: any;
  onPhoneSubmitted?: () => void;
  onEmailSubmitted?: (values: Record<string, string>) => Promise<void>;
}> = ({ msg, index, supportImage, chatbot_config, onPhoneSubmitted, onEmailSubmitted }) => {
  // Hide trigger and whatsapp_trigger messages
  if (msg.role === 'trigger' || msg.role === 'whatsapp_trigger') {
    return null;
  }

  if (msg.role === 'timeout') {
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '20px 0',
        }}
      >
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '80%',
            border: '1px solid #fecaca',
          }}
        >
          <Clock
            size={16}
            style={{ marginRight: '8px', verticalAlign: 'middle' }}
          />
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.role === 'email_request') {
    const [email, setEmail] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || submitting || !onEmailSubmitted) return;

      setSubmitting(true);
      try {
        // Construct values object expected by handleSaveEmail
        // Assuming the preChatForm logic expects an ID for the email field.
        // We'll pass a generic object, but we need to ensure handleSaveEmail handles it.
        // Based on analysis, handleSaveEmail looks for a field with type 'email'.
        // We will pass { email: email } and ensure handleSaveEmail can use it.
        // Alternatively, we can just pass a mock object that satisfies the expected structure if needed,
        // but looking at useChatLogic:578 it finds field by type 'email'.
        // If we can't easily adhere to the dynamic form structure here without more props,
        // we might need to adjust useChatLogic to handle a direct email string or specific key.
        // Let's pass a standard key 'email' and ensure we update useChatLogic to look for it.

        await onEmailSubmitted({ email: email.trim() });
        setSubmitted(true);
        setSubmitting(false);
      } catch (error) {
        console.error('Error saving email:', error);
        setSubmitting(false);
      }
    };

    if (submitted) {
      return null; // Hide form after submission, or switch to a "Thanks" view if prefered handled by chatMessages update
    }

    return (
      <div key={index} className='message bot'>
        <div className='message-avatar'>
          <SecureImage
            src={supportImage || AVATARS.BOT}
            alt='Support'
          />
        </div>
        <div className='message-content'>
          <div className='message-bubble'>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              Could you please provide your email address to proceed?
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '8px' }}>
                <div
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='name@example.com'
                    disabled={submitting}
                    autoFocus
                    required
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        chatbot_config.primaryColor || '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                  <button
                    type='submit'
                    disabled={!email.trim() || submitting}
                    style={{
                      background: chatbot_config.primaryColor || '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor:
                        email.trim() && !submitting
                          ? 'pointer'
                          : 'not-allowed',
                      opacity: email.trim() && !submitting ? 1 : 0.5,
                      fontSize: '16px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      minWidth: '44px',
                    }}
                  >
                    {submitting ? '...' : '→'}
                  </button>
                </div>
              </div>
            </form>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
              Bot · Just now
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.role === 'phone_request') {
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber.trim() || submitting) return;

      setSubmitting(true);
      try {
        const email = msg.user_email;

        if (email) {
          await saveCustomerPhone(email, phoneNumber.trim());
        }

        setSubmitting(false);
        if (onPhoneSubmitted) {
          onPhoneSubmitted();
        }
      } catch (error) {
        console.error('Error saving phone:', error);
        setSubmitting(false);
      }
    };

    return (
      <div key={index} className='message bot'>
        <div className='message-avatar'>
          <SecureImage
            src={supportImage || AVATARS.SUPPORT}
            alt='Support'
          />
        </div>
        <div className='message-content'>
          <div className='message-bubble'>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              A few more details will help get you to the right person:
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '8px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                  }}
                >
                  Phone Number
                </label>
                <div
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder='+1234567890'
                    disabled={submitting}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor =
                        chatbot_config.primaryColor || '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                  <button
                    type='submit'
                    disabled={!phoneNumber.trim() || submitting}
                    style={{
                      background: chatbot_config.primaryColor || '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor:
                        phoneNumber.trim() && !submitting
                          ? 'pointer'
                          : 'not-allowed',
                      opacity: phoneNumber.trim() && !submitting ? 1 : 0.5,
                      fontSize: '16px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      minWidth: '44px',
                    }}
                  >
                    {submitting ? '...' : '→'}
                  </button>
                </div>
              </div>
            </form>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
              Bot · Just now
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.role === 'separator') {
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          margin: '10px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }} />
        <span
          style={{
            padding: '0 10px',
            color: 'rgba(177, 177, 177, 0.88)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          Connected to Support
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }} />
      </div>
    );
  }

  // WhatsApp QR Code Message
  if (msg.role === 'whatsapp_qr') {
    const whatsappData =
      typeof msg.text === 'string' ? JSON.parse(msg.text) : msg.text;
    const phoneNumber = whatsappData.phoneNumber || '';
    const waLink = `https://wa.me/${phoneNumber}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
      waLink,
    )}`;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          ['--primary-color' as any]: chatbot_config.primaryColor,
          ['--secondary-color' as any]: chatbot_config.secondaryColor,
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', maxWidth: '85%' }}>
          <div className='message-avatar'>
            <SecureImage
              src={supportImage || AVATARS.SUPPORT}
              alt='Support'
            />
          </div>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
              }}
            >
              Continue on WhatsApp
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5',
              }}
            >
              Scan the QR with your phone
            </p>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.5',
              }}
            >
              When WhatsApp opens, send the message to continue the conversation
            </p>
            <div
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                display: 'inline-block',
                marginBottom: '16px',
                position: 'relative',
              }}
            >
              <img
                src={qrUrl}
                alt='WhatsApp QR Code'
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
              {/* WhatsApp Logo Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: '#ffffff',
                  borderRadius: '50%',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='#000000ff'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
                </svg>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              <a
                href={waLink}
                target='_blank'
                rel='noopener noreferrer'
                style={{
                  display: 'inline-block',
                  color: '#6b7280',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  fontWeight: '500',
                }}
              >
                Or continue on WhatsApp web →
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        ['--primary-color' as any]: chatbot_config.primaryColor,
        ['--secondary-color' as any]: chatbot_config.secondaryColor,
      }}
      className={`message ${msg.role === 'support' ? 'bot' : msg.role}`}
    >
      {(msg.role === 'bot' || msg.role === 'support') && (
        <div className='message-avatar'>
          {msg.role === 'support' ? (
            <SecureImage
              src={supportImage || AVATARS.SUPPORT}
              alt='Support'
            />
          ) : (
            <img
              src={AVATARS.BOT}
              alt='bot'
            />
          )}
        </div>
      )}

      <div className='message-content'>
        <div className='message-bubble'>
          {typeof msg.text === 'string' &&
            /<a\s+href=.*<\/a>/i.test(msg.text) ? (
            (() => {
              const match = msg.text.match(/href="([^"]+)".*>(.*?)<\/a>/i);
              const fileUrl = match ? match[1] : '';
              const fileName = match ? match[2] : 'Download file';
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

              return (
                <SecureAttachment
                  fileUrl={fileUrl}
                  fileName={fileName}
                  isImage={isImage}
                />
              );
            })()
          ) : typeof msg.text === 'string' ? (
            <span dangerouslySetInnerHTML={{ __html: msg.text }} />
          ) : (
            msg.text
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ====== Typing Indicator Component ======
export const TypingIndicator: React.FC<{
  supportImage: string | null;
  chatbot_config: any;
  typingRef: React.RefObject<HTMLDivElement>;
}> = ({ supportImage, chatbot_config, typingRef }) => {
  return (
    <div
      ref={typingRef}
      style={{
        ['--primary-color' as any]: chatbot_config.primaryColor,
        ['--secondary-color' as any]: chatbot_config.secondaryColor,
      }}
      className={`message bot`}
    >
      <div className='message-avatar'>
        {supportImage ? (
          <img src={supportImage} alt={'Bot'} />
        ) : (
          <img
            src={AVATARS.BOT}
            alt='bot'
          />
        )}
      </div>
      <div className='message-content'>
        <div className='message-bubble'>
          <div className='typing-dots'>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppQRModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  config: any;
}> = ({ isOpen, onClose, config }) => {
  if (!isOpen || !config) return null;

  const phoneNumber = config.phoneNumber || '';
  const waLink = `https://wa.me/${phoneNumber}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    waLink,
  )}`;

  return (
    <div className='overlay'>
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          position: 'relative',
          width: '90%',
          maxWidth: '320px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} color='#6b7280' />
        </button>

        <h3
          style={{
            marginTop: '0',
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
          }}
        >
          Connect on WhatsApp
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '20px',
          }}
        >
          Scan the QR code to chat with us on WhatsApp
        </p>

        <div
          style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '12px',
            display: 'inline-block',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
          }}
        >
          <img
            src={qrUrl}
            alt='WhatsApp QR Code'
            style={{ width: '200px', height: '200px', display: 'block' }}
          />
        </div>

        <a
          href={waLink}
          target='_blank'
          rel='noopener noreferrer'
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            background: '#25D366',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background 0.2s',
          }}
        >
          Open in WhatsApp
        </a>
      </div>
    </div>
  );
};

// ====== Action Buttons Component ======
export const ActionButtons: React.FC<{
  isConversationActive: boolean;
  isAdmin: boolean;
  isSpeakingWithRealPerson: boolean;
  reachedLimit: boolean;
  chatMessages: Message[];
  handleSwitchToRealPerson: () => void;
  setOpenTicket: React.Dispatch<React.SetStateAction<boolean>>;
  startNewConversation: () => void;
  loading: boolean;
  adminTestingMode?: boolean;
  whatsappConfig?: any;
  onWhatsAppClick?: () => void;
}> = ({
  isConversationActive,
  isAdmin,
  isSpeakingWithRealPerson,
  reachedLimit,
  chatMessages,
  handleSwitchToRealPerson,
  setOpenTicket,
  startNewConversation,
  loading,
  adminTestingMode,
  whatsappConfig,
  onWhatsAppClick,
}) => {
    return (
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'end',
          justifyContent: 'end',
          margin: 10,
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        {!isConversationActive && (
          <div className='hover-card' onClick={startNewConversation}>
            Start New Conversation
          </div>
        )}
        {!isAdmin &&
          !isSpeakingWithRealPerson &&
          isConversationActive &&
          (reachedLimit || chatMessages.length > 5) && (
            <button
              disabled={loading}
              style={{
                margin: 0,
                padding: 0,
                border: 'none',
                background: 'none',
              }}
              onClick={handleSwitchToRealPerson}
            >
              <div
                className='hover-card'
                style={{
                  fontSize: '14px',
                }}
              >
                Connect With Support
              </div>
            </button>
          )}
        {!adminTestingMode && (
          <div
            className='hover-card'
            onClick={() => setOpenTicket(true)}
            style={{
              fontSize: '14px',
            }}
          >
            Raise a ticket
          </div>
        )}
      </div>
    );
  };

// ====== Chat Input Component ======
export const ChatInput: React.FC<{
  isAdmin: boolean;
  isConversationActive: boolean;
  isConversationClosed: boolean;
  reachedLimit: boolean;
  isListening: boolean;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  loading: boolean;
  isSpeakingWithRealPerson: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  startListening: () => void;
  cancelListening: () => void;
  stopListening: () => void;
  chatbot_config: any;
  showEmojiPicker: boolean;
  adminTestingMode?: boolean;
  whatsappConfig?: any;
  onWhatsAppClick?: () => void;
  disabled?: boolean;
}> = ({
  isAdmin,
  isConversationActive,
  isConversationClosed,
  reachedLimit,
  isListening,
  message,
  setMessage,
  handleSend,
  loading,
  isSpeakingWithRealPerson,
  fileInputRef,
  handleFileUpload,
  setShowEmojiPicker,
  startListening,
  cancelListening,
  stopListening,
  chatbot_config,
  showEmojiPicker,
  adminTestingMode,
  whatsappConfig,
  onWhatsAppClick,
  disabled = false,
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && isConversationActive && !loading && !disabled) {
        handleSend();
      }
    };

    if (
      (isAdmin && !adminTestingMode) ||
      !isConversationActive ||
      isConversationClosed ||
      reachedLimit
    ) {
      return null;
    }

    return (
      <div
        className='chat-input'
        style={{
          position: 'relative',
          ['--primary-color' as any]: chatbot_config.primaryColor,
        }}
      >
        {!isListening ? (
          <>
            <input
              type='text'
              placeholder={
                isConversationClosed
                  ? 'Conversation closed'
                  : isConversationActive
                    ? 'Type a message'
                    : 'Conversation expired'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConversationActive || disabled}
              style={{
                opacity: isConversationActive && !disabled ? 1 : 0.6,
                cursor: disabled ? 'not-allowed' : 'text',
              }}
            />

            {isSpeakingWithRealPerson && isConversationActive && (
              <>
                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  className='input-btn'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isConversationActive || disabled}
                >
                  <Paperclip color='var(--text-primary)' size={20} />
                </button>
              </>
            )}

            {isConversationActive && (
              <>
                <button
                  className='input-btn'
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  disabled={!isConversationActive || disabled}
                >
                  <Smile size={20} color='var(--text-primary)' />
                </button>

                {/* WhatsApp Button - only show when speaking with real person and WhatsApp is configured */}
                {isSpeakingWithRealPerson &&
                  whatsappConfig &&
                  whatsappConfig.phoneNumber &&
                  onWhatsAppClick && (
                    <button
                      onClick={onWhatsAppClick}
                      className='input-btn'
                      title='Connect on WhatsApp'
                    >
                      <MessageCircle color='#25D366' size={20} />
                    </button>
                  )}

                <button
                  onClick={() => {
                    startListening();
                  }}
                  className='input-btn'
                  disabled={disabled}
                >
                  <Mic color='var(--text-primary)' size={20} />
                </button>

                <button
                  onClick={() => handleSend()}
                  className={`send-btn ${(message.length === 0 || !isConversationActive || loading || disabled) &&
                    'disabled'
                    }`}
                  disabled={!isConversationActive || loading || disabled}
                >
                  <SendHorizontal size={20} />
                </button>
              </>
            )}
          </>
        ) : (
          <div
            className='voice-mode'
            style={{ display: 'flex', alignItems: 'center', width: '100%' }}
          >
            <button
              className='voice-btn cancel'
              onClick={() => cancelListening()}
              style={{ marginRight: '10px' }}
            >
              <X size={22} color='white' />
            </button>

            <div className='waveform'>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <button
              className='voice-btn stop'
              onClick={stopListening}
              style={{ marginLeft: '10px' }}
            >
              <Square
                fill={chatbot_config.primaryColor}
                size={22}
                color={chatbot_config.primaryColor}
              />
            </button>
          </div>
        )}

        {/* Lazy-loaded Emoji Picker */}
        {showEmojiPicker && isConversationActive && (
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '20px',
              zIndex: 1000,
              transform: 'scale(0.8)',
              transformOrigin: 'bottom right',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense
              fallback={
                <div
                  style={{
                    width: '320px',
                    height: '400px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <Loader />
                </div>
              }
            >
              <EmojiPickerComponent
                onEmojiClick={(emojiData: any) => {
                  setMessage((prev) => prev + emojiData.emoji);
                }}
              />
            </Suspense>
          </div>
        )}
      </div>
    );
  };

// ====== Pre-Chat Form Component ======
export const PreChatForm: React.FC<{
  preChatForm: any;
  isConversationActive: boolean;
  handleSaveEmail: (values: Record<string, string>) => void;
  chatbot_config: any;
}> = ({
  preChatForm,
  isConversationActive,
  handleSaveEmail,
  chatbot_config,
}) => {
    return (
      <div className='overlay'>
        <div className='ticket-screen'>
          <div className='ticket-body'>
            <form
              className='ticket-form'
              onSubmit={(e) => {
                e.preventDefault();
                if (!isConversationActive) {
                  alert(
                    'This conversation has expired. Please start a new conversation.',
                  );
                  return;
                }

                const formData = new FormData(e.currentTarget);
                const values: Record<string, string> = {};

                const fields = Array.isArray(preChatForm)
                  ? preChatForm
                  : preChatForm.fields || [];

                fields.forEach((field: any) => {
                  values[field.id] = formData.get(field.id)?.toString() || '';
                });

                const emailField = fields.find((f: any) => f.type === 'email');
                if (emailField) {
                  const emailValue = values[emailField.id];
                  if (!emailValue) {
                    alert('Please enter your email!');
                    return;
                  }
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailPattern.test(emailValue)) {
                    alert('Please enter a valid email!');
                    return;
                  }
                }

                handleSaveEmail(values);
              }}
            >
              <div className='ticket-inputs'>
                {(Array.isArray(preChatForm)
                  ? preChatForm
                  : preChatForm.fields || []
                ).map((field: any) => (
                  <div
                    key={field.id}
                    className='ticket-input-group'
                    style={{
                      ['--primary-color' as any]: chatbot_config.primaryColor,
                    }}
                  >
                    <label htmlFor={field.id}>{field.label}</label>
                    <input
                      id={field.id}
                      type={field.type === 'name' ? 'text' : field.type}
                      name={field.id}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                      disabled={!isConversationActive}
                    />
                  </div>
                ))}
              </div>

              <button
                type='submit'
                className='submit-form-btn'
                style={{
                  ['--primary-color' as any]: chatbot_config.primaryColor,
                }}
              >
                Start Chat
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

// ====== Post-Chat Form Component ======
export const PostChatForm: React.FC<{
  postChatForm: any;
  handlePostFormSubmit: (values: Record<string, string>) => void;
  chatbot_config: any;
  handleCancel: () => void;
}> = ({ postChatForm, handlePostFormSubmit, chatbot_config, handleCancel }) => {
  return (
    <div className='overlay'>
      <div className='ticket-screen'>
        <div className='ticket-body'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h3>Feedback</h3>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <X size={20} />
            </button>
          </div>
          <form
            className='ticket-form'
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const values: Record<string, string> = {};

              const fields = Array.isArray(postChatForm.elements)
                ? postChatForm.elements
                : postChatForm.fields || [];

              fields.forEach((field: any) => {
                values[field.id] = formData.get(field.id)?.toString() || '';
              });

              handlePostFormSubmit(values);
            }}
          >
            <div className='ticket-inputs'>
              {(Array.isArray(postChatForm.elements)
                ? postChatForm.elements
                : postChatForm.fields || []
              ).map((field: any) => {
                if (field.type === 'rating') {
                  return (
                    <div key={field.id} className="rating-group">
                      <label style={{ textAlign: 'center', marginBottom: '10px' }} htmlFor={field.id}>{field.label}</label>
                      <StarRating name={field.id} required={field.required} />
                    </div>
                  )
                } else if (field.type === 'choice') {
                  return (
                    <div key={field.id} className="ticket-input-group" style={{ ['--primary-color' as any]: chatbot_config.primaryColor, }}>
                      <label htmlFor={field.id}>{field.label}</label>
                      <select
                        id={field.id}
                        name={field.id}
                        required={field.required}
                        style={{ padding: '12px 2px', borderRadius: '6px', width: '100%', }}
                      >
                        <option value="">-- Select an option --</option>
                        {field.options.map((option: string, idx: number) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );

                } else if (field.type === 'multiple-choice') {
                  return (
                    <div key={field.id} className="ticket-input-group" style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}>
                      <label>{field.label}</label>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', flexWrap: 'wrap' }}>
                        {field.options.map((option: string, idx: number) => (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="checkbox"
                              name={field.id}   // ✅ same name so FormData groups them
                              value={option}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  );

                } else {
                  return (
                    <div key={field.id} className='ticket-input-group' style={{ ['--primary-color' as any]: chatbot_config.primaryColor, }}>
                      <label htmlFor={field.id}>{field.label}</label>
                      <input
                        id={field.id}
                        type='text'
                        name={field.id}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                      />
                    </div>
                  )
                }
              })}
            </div>

            <button
              type='submit'
              className='submit-form-btn'
              style={{
                ['--primary-color' as any]: chatbot_config.primaryColor,
              }}
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
