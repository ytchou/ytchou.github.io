import type { ImageMetadata } from 'astro';
import formoriaHero from '../assets/formoria-hero.png';

export interface Project {
  title: string;
  description: string;
  descriptionZh?: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  image?: ImageMetadata;
}

export const projects: Project[] = [
  {
    title: 'Formoria',
    description: 'A curated directory platform connecting Taiwan-made brands with global consumers. Helps local manufacturers gain international visibility through a clean, trustworthy showcase experience.',
    descriptionZh: '精心策劃的目錄平台，連結台灣品牌與全球消費者，幫助在地製造商透過乾淨、值得信賴的展示體驗走向國際。',
    tags: ['Product', 'Next.js', 'TypeScript'],
    liveUrl: 'https://formoria.com/',
    featured: true,
    image: formoriaHero,
  },
];
