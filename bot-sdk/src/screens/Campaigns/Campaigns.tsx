import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './Campaigns.scss';
import {
  trackCampaignImpression,
  trackCampaignClick,
  trackCampaignClose,
} from '@/services/campaign';
import type { Campaign, ButtonElement, CampaignsProps } from '@/types';

export const Campaigns: React.FC<CampaignsProps & { appId?: string }> = ({
  setIsOpen,
  activeCampaign,
  appId = '',
}) => {
  // Track impression on mount
  useEffect(() => {
    const trackImpression = async () => {
      trackCampaignImpression(activeCampaign.id, appId);
    };
    trackImpression();
  }, [activeCampaign.id, appId]);

  const handleButtonClick = async (btn: ButtonElement) => {
    // Track click
    trackCampaignClick(
      activeCampaign.id,
      btn.id,
      appId,
      btn.url,
      btn.actionType || 'open-url',
    );

    // Perform action based on actionType
    const actionType = btn.actionType || 'open-url';

    if (actionType === 'open-url') {
      const url = btn.url?.trim();

      if (!url) return;

      // If external link → open in new tab
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      }
      // If internal route → navigate inside site
      else {
        window.location.href = '/' + url.replace(/^\/+/, ''); // ensures no double slashes
      }
    } else if (actionType === 'phone-call') {
      // Initiate phone call
      window.location.href = `tel:${btn.url}`;
    } else if (actionType === 'send-message') {
      // Open messaging (could be SMS, WhatsApp, etc.)
      // For SMS:
      window.location.href = `sms:${btn.url}`;
      // For WhatsApp, use: window.open(`https://wa.me/${btn.url}`, '_blank');
    } else if (actionType === 'copy-coupon') {
      // Copy coupon code to clipboard
      navigator.clipboard
        .writeText(btn.url)
        .then(() => {
          alert(`Coupon code "${btn.url}" copied to clipboard!`);
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = btn.url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert(`Coupon code "${btn.url}" copied to clipboard!`);
        });
    } else if (actionType === 'open-moment') {
      // Open specific moment/page
      // Assuming moment ID is in btn.url
      window.location.href = `/moments/${btn.url}`;
    } else if (actionType === 'dismiss') {
      // Just close the campaign
      handleClose();
    } else {
      console.warn(`Unknown action type: ${actionType}`);
    }
  };

  const handleClose = async () => {
    // Track close
    trackCampaignClose(activeCampaign.id, appId);

    // Hide the campaign popup
    setIsOpen(false);
  };

  return (
    <>
      {/* Campaign Content */}
      <div className='campaign-card'>
        <div className='campaign-card-inner'>
          {/* Close Button */}
          <button className='campaign-close-btn' onClick={handleClose}>
            <X size={18} />
          </button>

          {/* Image Section */}
          {activeCampaign.content.hasImage && activeCampaign.content.media && (
            <div className='campaign-image'>
              <img
                src={activeCampaign.content.media.src}
                alt={activeCampaign.content.media.alt || 'Campaign image'}
              />
            </div>
          )}

          {/* Content Section */}
          <div className='campaign-content'>
            <div className='campaign-text'>
              <h3>{activeCampaign.content.heading}</h3>
              {(activeCampaign.content.layout.includes('subheading') ||
                activeCampaign.content.subheading) && (
                  <p>{activeCampaign.content.subheading}</p>
                )}
            </div>

            {/* Buttons */}
            <div className='campaign-buttons'>
              {activeCampaign.content.buttons.map((btn) => (
                <button
                  key={btn.id}
                  className={`campaign-btn ${btn.style === 'primary'
                    ? 'primary'
                    : btn.style === 'danger'
                      ? 'danger'
                      : 'secondary'
                    }`}
                  onClick={() => handleButtonClick(btn)}
                >
                  {btn.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
