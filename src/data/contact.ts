import type { UIKey } from '../i18n/ui';

export interface ContactLink {
  labelKey: UIKey;
  href: string;
  display: string;
  external: boolean;
}

export const contactLinks: ContactLink[] = [
  { labelKey: 'contact.link.email', href: 'mailto:patrick.ytchou@gmail.com', display: 'patrick.ytchou@gmail.com', external: false },
  { labelKey: 'contact.link.github', href: 'https://github.com/ytchou', display: 'github.com/ytchou', external: true },
  { labelKey: 'contact.link.linkedin', href: 'https://linkedin.com/in/ytchou', display: 'linkedin.com/in/ytchou', external: true },
];

export const calendlyUrl = 'https://calendly.com/ytchou/30min';
