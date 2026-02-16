import type { NewsletterSettings } from './types';

export const CHANNEL_CONFIG = {
  proffs: {
    label: 'Proffs',
    description: 'Hantverkare, byggföretag och B2B-kunder',
    defaultSettings: {
      preheader: '',
      subject: '',
      sender_name: 'Bygghandeln Proffs',
      footer_text: 'Bygghandeln AB | Industrivägen 10 | 123 45 Byggstad',
      color_primary: '#1B4D3E',
      color_secondary: '#2E7D5B',
      color_background: '#F5F5F5',
      font_family: 'Arial, Helvetica, sans-serif',
    } satisfies NewsletterSettings,
  },
  konsument: {
    label: 'Konsument',
    description: 'Privatpersoner och DIY-entusiaster',
    defaultSettings: {
      preheader: '',
      subject: '',
      sender_name: 'Bygghandeln',
      footer_text: 'Bygghandeln AB | Storgatan 5 | 123 45 Byggstad | Öppet mån-fre 8-18, lör 9-15',
      color_primary: '#E87A2E',
      color_secondary: '#4CAF50',
      color_background: '#FFFFFF',
      font_family: 'Arial, Helvetica, sans-serif',
    } satisfies NewsletterSettings,
  },
} as const;

export type Channel = keyof typeof CHANNEL_CONFIG;

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero',
  text: 'Text',
  'image-text': 'Bild + Text',
  campaign: 'Kampanj',
  divider: 'Avdelare',
  footer: 'Footer',
  product: 'Produkt',
  'product-grid': 'Produktgrid',
};

export const MAX_IMAGE_WIDTH = 800;
export const MAX_IMAGE_SIZE_MB = 5;
export const NEWSLETTER_MAX_WIDTH = 600;
export const AUTOSAVE_DEBOUNCE_MS = 5000;
