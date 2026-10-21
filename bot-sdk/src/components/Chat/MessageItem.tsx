// Message Item Component - Renders individual chat messages
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { Message, ChatbotConfig } from '@/types';
import { saveCustomerPhone } from '@/services/config';
import { AVATARS, getQRCodeUrl, getWhatsAppLink } from '@/constants/urls';
import { SecureImage } from '../common';

export interface MessageItemProps {
  msg: Message;
  index: number;
  supportImage: string | null;
  chatbot_config: ChatbotConfig;
  onPhoneSubmitted?: () => void;
}

// Timeout Message
const TimeoutMessage: React.FC<{ text: string; index: number }> = ({ text, index }) => (
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
      {text}
    </div>
  </div>
);

// Phone Request Message
const PhoneRequestMessage: React.FC<{
  msg: Message;
  index: number;
  supportImage: string | null;
  chatbot_config: ChatbotConfig;
  onPhoneSubmitted?: () => void;
}> = ({ msg, index, supportImage, chatbot_config, onPhoneSubmitted }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      onPhoneSubmitted?.();
    } catch (error) {
      console.error('Error saving phone:', error);
      setSubmitting(false);
    }
  };

  return (
    <div key={index} className='message bot'>
      <div className='message-avatar'>
        <SecureImage src={supportImage || AVATARS.SUPPORT} alt='Support' />
      </div>
      <div className='message-content'>
        <div className='message-bubble'>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
            A few more details will help get you to the right person:
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Phone Number
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    e.target.style.borderColor = chatbot_config.primaryColor || '#3b82f6';
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
                    cursor: phoneNumber.trim() && !submitting ? 'pointer' : 'not-allowed',
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
};

// Separator Message
const SeparatorMessage: React.FC<{ index: number }> = ({ index }) => (
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

// WhatsApp QR Message
const WhatsAppQRMessage: React.FC<{
  msg: Message;
  index: number;
  supportImage: string | null;
  chatbot_config: ChatbotConfig;
}> = ({ msg, index, supportImage, chatbot_config }) => {
  const whatsappData = typeof msg.text === 'string' ? JSON.parse(msg.text) : msg.text;
  const phoneNumber = whatsappData.phoneNumber || '';
  const waLink = getWhatsAppLink(phoneNumber);
  const qrUrl = getQRCodeUrl(waLink, 256);

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
          <SecureImage src={supportImage || AVATARS.SUPPORT} alt='Support' />
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
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Continue on WhatsApp
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
            Scan the QR with your phone
          </p>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
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
            <img src={qrUrl} alt='WhatsApp QR Code' style={{ width: '200px', height: '200px', display: 'block' }} />
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
              <svg width='32' height='32' viewBox='0 0 24 24' fill='#000000ff' xmlns='http://www.w3.org/2000/svg'>
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
};

// Regular Message
const RegularMessage: React.FC<{
  msg: Message;
  index: number;
  supportImage: string | null;
  chatbot_config: ChatbotConfig;
}> = ({ msg, index, supportImage, chatbot_config }) => {

  // Helper to parse and render text with clickable links
  const parseTextWithLinks = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Define all patterns
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
    const phoneRegex = /(\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{4,})/;

    while (currentText.length > 0) {
      let earliestMatch: { index: number; length: number; type: string; match: RegExpMatchArray } | null = null;

      // Find markdown link
      const mdMatch = currentText.match(markdownLinkRegex);
      if (mdMatch && mdMatch.index !== undefined) {
        earliestMatch = { index: mdMatch.index, length: mdMatch[0].length, type: 'markdown', match: mdMatch };
      }

      // Find URL (but not if it's part of a markdown link we already found)
      const urlMatch = currentText.match(urlRegex);
      if (urlMatch && urlMatch.index !== undefined) {
        if (!earliestMatch || urlMatch.index < earliestMatch.index) {
          earliestMatch = { index: urlMatch.index, length: urlMatch[0].length, type: 'url', match: urlMatch };
        }
      }

      // Find email
      const emailMatch = currentText.match(emailRegex);
      if (emailMatch && emailMatch.index !== undefined) {
        if (!earliestMatch || emailMatch.index < earliestMatch.index) {
          earliestMatch = { index: emailMatch.index, length: emailMatch[0].length, type: 'email', match: emailMatch };
        }
      }

      // Find phone
      const phoneMatch = currentText.match(phoneRegex);
      if (phoneMatch && phoneMatch.index !== undefined) {
        if (!earliestMatch || phoneMatch.index < earliestMatch.index) {
          earliestMatch = { index: phoneMatch.index, length: phoneMatch[0].length, type: 'phone', match: phoneMatch };
        }
      }

      // If no matches found, add remaining text and break
      if (!earliestMatch) {
        if (currentText) {
          parts.push(currentText);
        }
        break;
      }

      // Add text before the match
      if (earliestMatch.index > 0) {
        parts.push(currentText.substring(0, earliestMatch.index));
      }

      // Add the matched element
      if (earliestMatch.type === 'markdown') {
        const linkText = earliestMatch.match[1];
        const url = earliestMatch.match[2];
        parts.push(
          <a
            key={`md-link-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: chatbot_config.primaryColor || '#3b82f6',
              textDecoration: 'underline',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {linkText}
          </a>
        );
      } else if (earliestMatch.type === 'url') {
        const url = earliestMatch.match[0];
        parts.push(
          <a
            key={`url-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: chatbot_config.primaryColor || '#3b82f6',
              textDecoration: 'underline',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        );
      } else if (earliestMatch.type === 'email') {
        const email = earliestMatch.match[0];
        parts.push(
          <a
            key={`email-${keyCounter++}`}
            href={`mailto:${email}`}
            style={{
              color: chatbot_config.primaryColor || '#3b82f6',
              textDecoration: 'underline',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {email}
          </a>
        );
      } else if (earliestMatch.type === 'phone') {
        const phone = earliestMatch.match[0];
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        parts.push(
          <a
            key={`phone-${keyCounter++}`}
            href={`tel:${cleanPhone}`}
            style={{
              color: chatbot_config.primaryColor || '#3b82f6',
              textDecoration: 'underline',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {phone}
          </a>
        );
      }

      // Move past the match
      currentText = currentText.substring(earliestMatch.index + earliestMatch.length);
    }

    // Process text parts for bold, italic, line breaks
    const processedParts: (string | JSX.Element)[] = [];
    parts.forEach((part, partIdx) => {
      if (typeof part === 'string') {
        // Split by line breaks
        const lines = part.split('\n');
        lines.forEach((line, lineIdx) => {
          // Process bold and italic
          const segments = line.split(/(\*\*[^\*]+\*\*|__[^_]+__|_[^_]+_|\*[^\*]+\*)/);
          segments.forEach((seg, segIdx) => {
            if (!seg) return;
            if (/^\*\*(.+)\*\*$/.test(seg) || /^__(.+)__$/.test(seg)) {
              processedParts.push(<strong key={`bold-${partIdx}-${lineIdx}-${segIdx}`}>{seg.replace(/^\*\*|__|\*\*$|__$/g, '')}</strong>);
            } else if (/^\*(.+)\*$/.test(seg) || /^_(.+)_$/.test(seg)) {
              processedParts.push(<em key={`italic-${partIdx}-${lineIdx}-${segIdx}`}>{seg.replace(/^\*|_|\*$|_$/g, '')}</em>);
            } else {
              processedParts.push(seg);
            }
          });
          if (lineIdx < lines.length - 1) {
            processedParts.push(<br key={`br-${partIdx}-${lineIdx}`} />);
          }
        });
      } else {
        processedParts.push(part);
      }
    });

    return processedParts;
  };

  const renderMessageContent = () => {
    if (typeof msg.text === 'string' && /<a\s+href=.*<\/a>/i.test(msg.text)) {
      const match = msg.text.match(/href="([^"]+)".*>(.*?)<\/a>/i);
      const fileUrl = match ? match[1] : '';
      const fileName = match ? match[2] : 'Download file';
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

      if (isImage) {
        return (
          <a
            href={fileUrl}
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
            <SecureImage src={fileUrl} alt={fileName} style={{ width: '100%', height: 'auto', display: 'block' }} />
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
      }

      return (
        <a
          href={fileUrl}
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
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {fileName}
          </div>
        </a>
      );
    }

    if (typeof msg.text === 'string') {
      // For bot messages, only parse markdown if streaming is complete
      // For user messages, always parse immediately
      if (msg.role === 'bot' && !msg.streamComplete) {
        // Show raw text while streaming
        return <span>{msg.text}</span>;
      }
      // Parse and render with clickable links
      return <span>{parseTextWithLinks(msg.text)}</span>;
    }

    return msg.text;
  };

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
            <SecureImage src={supportImage || AVATARS.SUPPORT} alt='Support' />
          ) : (
            <img src={AVATARS.BOT} alt='bot' />
          )}
        </div>
      )}
      <div className='message-content'>
        <div className='message-bubble'>{renderMessageContent()}</div>
      </div>
    </motion.div>
  );
};

// Main Message Item Component
export const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  index,
  supportImage,
  chatbot_config,
  onPhoneSubmitted,
}) => {
  // Hide trigger and whatsapp_trigger messages
  if (msg.role === 'trigger' || msg.role === 'whatsapp_trigger') {
    return null;
  }

  if (msg.role === 'timeout') {
    return <TimeoutMessage text={msg.text} index={index} />;
  }

  if (msg.role === 'phone_request') {
    return (
      <PhoneRequestMessage
        msg={msg}
        index={index}
        supportImage={supportImage}
        chatbot_config={chatbot_config}
        onPhoneSubmitted={onPhoneSubmitted}
      />
    );
  }

  if (msg.role === 'separator') {
    return <SeparatorMessage index={index} />;
  }

  if (msg.role === 'whatsapp_qr') {
    return (
      <WhatsAppQRMessage
        msg={msg}
        index={index}
        supportImage={supportImage}
        chatbot_config={chatbot_config}
      />
    );
  }

  return (
    <RegularMessage
      msg={msg}
      index={index}
      supportImage={supportImage}
      chatbot_config={chatbot_config}
    />
  );
};

// Memoize MessageItem to prevent re-renders when props haven't changed
export default React.memo(MessageItem);
