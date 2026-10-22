import { getServerApiUrl } from '@/services/api/client';
// Static URLs. Images and sounds are served by our backend next to the widget
// (rhinontech/backend/public/widget/assets), never from a third-party domain.

export const asset = (name: string) => `${getServerApiUrl()}/assets/${name}`;

export const LOGOS = {
  // As Saleszium named them: "Light" is the light-coloured (white) logo, for
  // dark backgrounds; "Dark" is dark ink, for light ones.
  primaryLight: asset('logo-light.png'),
  primaryDark: asset('logo-dark.png'),
  rhinonWhite: asset('logo-light.png'),
} as const;

export const AVATARS = {
  SUPPORT: asset('support-avatar.png'),
  BOT: asset('bot.png'),
  DEFAULT_USER: asset('support-avatar.png'),
} as const;

export const BACKGROUNDS = {
  default: asset('background.jpg'),
} as const;

export const NOTIFICATION_SOUND = asset('notify.mp3');

// QR Code API
export const QR_CODE_API = 'https://api.qrserver.com/v1/create-qr-code/';
export const getQRCodeUrl = (data: string, size: number = 256): string =>
  `${QR_CODE_API}?size=${size}x${size}&data=${encodeURIComponent(data)}`;

// WhatsApp
export const getWhatsAppLink = (phoneNumber: string): string =>
  `https://wa.me/${phoneNumber}`;

// IP Address API
export const IP_API_URL = 'https://api.ipify.org?format=json';
