import type { UIKey } from '../i18n/ui';

export interface ContactLink {
  labelKey: UIKey;
  href: string;
  display: string;
  external: boolean;
}

export const contactLinks: ContactLink[] = [
  { labelKey: 'contact.link.email', href: 'mailto:you@example.com', display: 'you@example.com', external: false },
  { labelKey: 'contact.link.github', href: 'https://github.com/ytchou', display: 'github.com/ytchou', external: true },
  { labelKey: 'contact.link.linkedin', href: 'https://linkedin.com/in/yourname', display: 'linkedin.com/in/yourname', external: true },
];

export const calendlyUrl = 'https://calendly.com/yourname/coffee-chat';
