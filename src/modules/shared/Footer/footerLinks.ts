import type { SvgIconComponent } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FaxIcon from '@mui/icons-material/Fax';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import LanguageIcon from '@mui/icons-material/Language';

/**
 * Identifies a contact row so the footer can decide how to render it
 * (translated address text vs. LTR contact values such as phone/email).
 */
export type ContactItemId = 'address' | 'poBox' | 'phone' | 'fax' | 'email' | 'website';

/**
 * A single contact row shown in the "Contact us" column.
 * - `labelKey`: i18n key for the row's visible text when it must be translated (e.g. the address).
 * - `text`: literal value shown as-is (phone numbers, emails, URLs) — always rendered LTR.
 * - `link`: optional href (`mailto:`, `tel:`, or `https://`).
 */
export interface ContactItem {
  id: ContactItemId;
  icon: SvgIconComponent;
  labelKey?: string;
  text?: string;
  link?: string;
}

/**
 * A link rendered in the bottom bar of the footer.
 * `labelKey` is an i18n key; `href` may be internal (`/path`) or external (`https://`).
 */
export interface FooterBottomLink {
  id: string;
  labelKey: string;
  href: string;
}

/** Public website of the Aqaba Special Economic Zone Authority. */
export const ASEZA_WEBSITE_URL = 'https://www.aseza.jo';

/**
 * ASEZA contact details shown in the footer.
 * Values are kept in one place so they can be updated without touching the component.
 */
export const CONTACT_ITEMS: ReadonlyArray<ContactItem> = [
  {
    id: 'address',
    icon: LocationOnIcon,
    labelKey: 'footer.contact.address',
  },
  {
    id: 'poBox',
    icon: MarkunreadMailboxIcon,
    labelKey: 'footer.contact.poBox',
  },
  {
    id: 'phone',
    icon: PhoneIcon,
    text: '+962 3 209 1000',
    link: 'tel:+96232091000',
  },
  {
    id: 'fax',
    icon: FaxIcon,
    text: '+962 3 209 1056',
  },
  {
    id: 'email',
    icon: EmailIcon,
    text: 'aldiwan@aseza.jo',
    link: 'mailto:aldiwan@aseza.jo',
  },
  {
    id: 'website',
    icon: LanguageIcon,
    text: 'www.aseza.jo',
    link: ASEZA_WEBSITE_URL,
  },
];

/** Vendor credit shown in the footer's "Powered by" line. */
export const POWERED_BY = {
  name: 'DataHub Analytics',
  href: 'https://datahubanalytics.com/',
} as const;

/** Links shown next to the copyright line in the footer's bottom bar. */
export const BOTTOM_LINKS: ReadonlyArray<FooterBottomLink> = [
  { id: 'user-guide', labelKey: 'footer.bottomLinks.help', href: '/user-guide' },
  { id: 'website', labelKey: 'footer.bottomLinks.officialWebsite', href: ASEZA_WEBSITE_URL },
];

/**
 * Returns true when a link points outside the SPA and should open as a plain anchor.
 * Kept strict so in-app routes are never misclassified as external.
 */
export const isExternalHref = (href: string): boolean => {
  const trimmed = href.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  );
};
