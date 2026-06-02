import type { Channel } from './constants';
import type { NewsletterSettings } from './types';

/**
 * Renderingsvariant per kanal.
 * - 'jabs'    – proffskanalens nya jabs.se-uttryck (orange/svart/blå, kortbaserat)
 * - 'classic' – ursprunglig layout (konsument tills vidare)
 */
export type ThemeVariant = 'classic' | 'jabs';

export function themeVariant(channel: Channel | string | undefined): ThemeVariant {
  return channel === 'proffs' ? 'jabs' : 'classic';
}

/**
 * jabs.se-paletten. Neutralerna är fasta för att hålla uttrycket konsekvent;
 * accent (orange) och länk (blå) hämtas från kanalprofilen så att färgväljaren
 * i egenskapspanelen fortfarande styr dem.
 */
export const JABS = {
  pageBg: '#E4E6E8',
  surface: '#FFFFFF',
  sectionBg: '#EEF0F1',
  ink: '#1F1F1F',
  body: '#5A5F65',
  muted: '#8E8E8E',
  accent: '#EC6A1E',
  accentInk: '#FFFFFF',
  link: '#1A6FB5',
  cardBorder: '#E0E2E4',
  dividerLine: '#E6E8EA',
  badgeSecondary: '#6B7077',
  featuredBg: '#1F1F1F',
  featuredImageBg: '#2A2A2A',
  featuredInk: '#FFFFFF',
  featuredBody: '#C8CCD0',
  footerBg: '#1F1F1F',
  footerInk: '#FFFFFF',
  footerMuted: '#9A9DA2',
} as const;

export interface JabsTheme {
  variant: 'jabs';
  accent: string;
  accentInk: string;
  link: string;
  pageBg: string;
  surface: string;
  sectionBg: string;
  ink: string;
  body: string;
  muted: string;
  cardBorder: string;
  dividerLine: string;
  badgeSecondary: string;
  featuredBg: string;
  featuredImageBg: string;
  featuredInk: string;
  featuredBody: string;
  footerBg: string;
  footerInk: string;
  footerMuted: string;
}

/**
 * Bygger jabs-temat och låter kanalprofilens primär-/sekundärfärg styra
 * accent (orange) respektive länk (blå). Neutralerna kommer från JABS.
 */
export function jabsTheme(settings: NewsletterSettings): JabsTheme {
  return {
    variant: 'jabs',
    accent: settings.color_primary || JABS.accent,
    accentInk: JABS.accentInk,
    link: settings.color_secondary || JABS.link,
    pageBg: JABS.pageBg,
    surface: JABS.surface,
    sectionBg: JABS.sectionBg,
    ink: JABS.ink,
    body: JABS.body,
    muted: JABS.muted,
    cardBorder: JABS.cardBorder,
    dividerLine: JABS.dividerLine,
    badgeSecondary: JABS.badgeSecondary,
    featuredBg: JABS.featuredBg,
    featuredImageBg: JABS.featuredImageBg,
    featuredInk: JABS.featuredInk,
    featuredBody: JABS.featuredBody,
    footerBg: JABS.footerBg,
    footerInk: JABS.footerInk,
    footerMuted: JABS.footerMuted,
  };
}
