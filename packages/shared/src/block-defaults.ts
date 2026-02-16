import type {
  BlockType,
  BlockStyle,
  HeroContent,
  TextContent,
  ImageTextContent,
  CampaignContent,
  DividerContent,
  FooterContent,
  ProductContent,
  ProductGridContent,
  BlockContent,
} from './types';

const defaultStyle: BlockStyle = {
  backgroundColor: undefined,
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: 24,
  paddingRight: 24,
  borderRadius: 0,
  fullWidth: false,
};

const heroDefaults: HeroContent = {
  imageUrl: '',
  imageAlt: 'Hero-bild',
  title: 'Rubrik här',
  subtitle: 'Underrubrik',
  ctaText: 'Läs mer',
  ctaUrl: '#',
  ctaColor: '#E87A2E',
  overlayOpacity: 0.3,
  textAlign: 'center',
};

const textDefaults: TextContent = {
  heading: 'Rubrik',
  body: '<p>Skriv din text här...</p>',
  textAlign: 'left',
};

const imageTextDefaults: ImageTextContent = {
  imageUrl: '',
  imageAlt: 'Bild',
  imagePosition: 'left',
  heading: 'Rubrik',
  body: '<p>Beskrivande text här...</p>',
  ctaText: 'Läs mer',
  ctaUrl: '#',
};

const campaignDefaults: CampaignContent = {
  backgroundColor: '#1B4D3E',
  heading: 'Kampanjrubrik',
  body: 'Missa inte vårt erbjudande!',
  ctaText: 'Handla nu',
  ctaUrl: '#',
  ctaColor: '#E87A2E',
  textColor: '#FFFFFF',
};

const dividerDefaults: DividerContent = {
  style: 'line',
  height: 1,
  lineColor: '#DDDDDD',
};

const footerDefaults: FooterContent = {
  companyName: 'Bygghandeln AB',
  address: 'Storgatan 5, 123 45 Byggstad',
  phone: '012-345 67 89',
  email: 'info@bygghandeln.se',
  websiteUrl: 'https://www.bygghandeln.se',
  socialLinks: [],
  unsubscribeText: 'Avregistrera dig från nyhetsbrevet',
  unsubscribeUrl: '#',
};

const productDefaults: ProductContent = {
  sku: '',
  name: 'Produktnamn',
  description: 'Kort produktbeskrivning',
  price: '0 kr',
  imageUrl: '',
  productUrl: '#',
  badge: '',
};

const productGridDefaults: ProductGridContent = {
  products: [
    { sku: '', name: 'Produkt 1', price: '0 kr', imageUrl: '', productUrl: '#' },
    { sku: '', name: 'Produkt 2', price: '0 kr', imageUrl: '', productUrl: '#' },
  ],
  columns: 2,
  heading: 'Produkter',
};

export function getBlockDefaults(type: BlockType): {
  content: BlockContent;
  style: BlockStyle;
} {
  const contentMap: Record<string, BlockContent> = {
    hero: heroDefaults,
    text: textDefaults,
    'image-text': imageTextDefaults,
    campaign: campaignDefaults,
    divider: dividerDefaults,
    footer: footerDefaults,
    product: productDefaults,
    'product-grid': productGridDefaults,
  };

  return {
    content: contentMap[type] ?? textDefaults,
    style: { ...defaultStyle },
  };
}
