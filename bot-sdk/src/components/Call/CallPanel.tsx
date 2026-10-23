// Voice call screen inside the chat window: the incoming ring, connecting and
// the live call. Minimised, a live call shrinks to a bar so the visitor can
// keep chatting while they talk.
import React from 'react';
import { ChevronDown, Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

export type CallView = 'incoming' | 'connecting' | 'live';

interface CallPanelProps {
  view: CallView;
  callerName: string;
  brandName: string;
  duration: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  minimized: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onMinimize: (minimized: boolean) => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export const CallPanel: React.FC<CallPanelProps> = ({
  view,
  callerName,
  brandName,
  duration,
  isMuted,
  isSpeakerOn,
  minimized,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
  onMinimize,
}) => {
  const status = view === 'incoming' ? 'Incoming voice call' : view === 'connecting' ? 'Connecting…' : duration;

  if (minimized && view !== 'incoming') {
    return (
      <motion.div
        className='rh-call-bar'
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        role='status'
        aria-label={`On a call with ${callerName}`}
      >
        <button type='button' className='rh-call-bar-main' onClick={() => onMinimize(false)}>
          <span className='rh-call-bar-dot' />
          <span className='rh-call-bar-name'>{callerName}</span>
          <span className='rh-call-bar-time'>{view === 'live' ? duration : 'Connecting…'}</span>
        </button>
        <button type='button' className='rh-call-bar-end' onClick={onEnd} aria-label='End call'>
          <PhoneOff size={15} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`rh-call rh-call--${view}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role='dialog'
      aria-label={view === 'incoming' ? `Incoming call from ${callerName}` : `Call with ${callerName}`}
    >
      {view !== 'incoming' && (
        <button type='button' className='rh-call-min' onClick={() => onMinimize(true)} aria-label='Back to the chat'>
          <ChevronDown size={18} />
        </button>
      )}

      <div className='rh-call-who'>
        <div className='rh-call-avatar'>
          {view !== 'live' && (
            <>
              <span className='rh-call-ring' />
              <span className='rh-call-ring rh-call-ring--2' />
            </>
          )}
          <span className='rh-call-initials'>{initials(callerName)}</span>
        </div>
        <p className='rh-call-name'>{callerName}</p>
        <p className='rh-call-brand'>{brandName}</p>
        <p className={`rh-call-status${view === 'live' ? ' is-live' : ''}`}>{status}</p>
      </div>

      {view === 'incoming' ? (
        <div className='rh-call-actions'>
          <CallButton tone='danger' label='Decline' onClick={onDecline}>
            <PhoneOff size={24} />
          </CallButton>
          <CallButton tone='accept' label='Accept' onClick={onAccept}>
            <Phone size={24} />
          </CallButton>
        </div>
      ) : (
        <div className='rh-call-actions'>
          <CallButton tone={isMuted ? 'on' : 'plain'} label={isMuted ? 'Unmute' : 'Mute'} onClick={onToggleMute}>
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </CallButton>
          <CallButton tone='danger' label='End' onClick={onEnd}>
            <PhoneOff size={24} />
          </CallButton>
          <CallButton tone={isSpeakerOn ? 'plain' : 'on'} label={isSpeakerOn ? 'Sound' : 'Muted'} onClick={onToggleSpeaker}>
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </CallButton>
        </div>
      )}
    </motion.div>
  );
};

const CallButton: React.FC<{ tone: 'plain' | 'on' | 'danger' | 'accept'; label: string; onClick: () => void; children: React.ReactNode }> = ({
  tone,
  label,
  onClick,
  children,
}) => (
  <div className='rh-call-btn-wrap'>
    <button type='button' className={`rh-call-btn rh-call-btn--${tone}`} onClick={onClick} aria-label={label}>
      {children}
    </button>
    <span>{label}</span>
  </div>
);

export default CallPanel;
