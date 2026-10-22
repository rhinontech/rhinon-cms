// WhatsApp QR Modal Component - Shows QR code to connect via WhatsApp
import React from 'react';
import { X } from 'lucide-react';
import type { WhatsAppConfig } from '@/types';
import { getQRCodeUrl, getWhatsAppLink } from '@/constants/urls';

export interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WhatsAppConfig | null;
}

export const WhatsAppQRModal: React.FC<WhatsAppQRModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen || !config) return null;

  const phoneNumber = config.phoneNumber || '';
  const waLink = getWhatsAppLink(phoneNumber);
  const qrUrl = getQRCodeUrl(waLink, 200);

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

export default WhatsAppQRModal;
