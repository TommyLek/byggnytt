// === Nyhetsbrev ===
export interface Newsletter {
  id: string;
  title: string;
  channel: 'proffs' | 'konsument';
  status: 'draft' | 'ready' | 'sent';
  blocks: Block[];
  settings: NewsletterSettings;
  created_at: string;
  updated_at: string;
}

export interface HeaderStore {
  name: string;
  logoUrl: string;
}

export interface NewsletterSettings {
  preheader: string;
  subject: string;
  sender_name: string;
  header_logo_url?: string;
  // Header-chrome (proffskanalen): etikett + butikslogotyper
  header_label?: string;
  header_label_size?: number;
  header_stores?: HeaderStore[];
  footer_text: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  font_family: string;
}

// === Block ===
export type BlockType =
  | 'hero'
  | 'text'
  | 'image-text'
  | 'campaign'
  | 'divider'
  | 'footer'
  | 'product'
  | 'product-grid';

export interface Block {
  id: string;
  type: BlockType;
  order: number;
  content: BlockContent;
  style: BlockStyle;
}

export interface BlockStyle {
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  borderRadius?: number;
  fullWidth?: boolean;
}

// === Blockinnehåll per typ ===
export interface HeroContent {
  imageUrl: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaColor?: string;
  overlayOpacity?: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface TextContent {
  heading?: string;
  body: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageTextContent {
  imageUrl: string;
  imageAlt: string;
  imagePosition: 'left' | 'right';
  heading?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignContent {
  backgroundImageUrl?: string;
  backgroundColor: string;
  heading: string;
  body?: string;
  ctaText: string;
  ctaUrl: string;
  ctaColor: string;
  textColor: string;
}

export interface DividerContent {
  style: 'line' | 'space' | 'dots';
  height: number;
  lineColor?: string;
}

export interface FooterContent {
  companyName: string;
  address: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  socialLinks?: { platform: string; url: string }[];
  unsubscribeText: string;
  unsubscribeUrl: string;
}

export interface ProductContent {
  sku: string;
  name: string;
  description?: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  badge?: string;
}

export interface ProductGridContent {
  products: ProductContent[];
  columns: 2 | 3;
  heading?: string;
}

// Union type för content
export type BlockContent =
  | HeroContent
  | TextContent
  | ImageTextContent
  | CampaignContent
  | DividerContent
  | FooterContent
  | ProductContent
  | ProductGridContent;

// === API Types ===
export interface CreateNewsletterRequest {
  title: string;
  channel: 'proffs' | 'konsument';
  blocks?: Block[];
  settings?: Partial<NewsletterSettings>;
  from_template_id?: string;
}

export interface UpdateNewsletterRequest {
  title?: string;
  status?: 'draft' | 'ready' | 'sent';
  blocks?: Block[];
  settings?: Partial<NewsletterSettings>;
}

export interface ImageInfo {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  uploaded_at: string;
  url: string;
}

export interface Template {
  id: string;
  name: string;
  channel: 'proffs' | 'konsument';
  blocks: Block[];
  settings: NewsletterSettings;
  is_default: boolean;
  created_at: string;
}
