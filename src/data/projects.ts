import type { ImageMetadata } from 'astro';
import cardioSlotHero from '../assets/cardio-slot-hero.png';
import formoriaHero from '../assets/formoria-hero.png';

export interface Project {
  title: string;
  description: string;
  descriptionZh?: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  inDevelopment?: boolean;
  image?: ImageMetadata;
}

export const projects: Project[] = [
  {
    title: 'Cardio Slot',
    description: 'A slot-machine-inspired workout generator that builds varied treadmill sessions by combining focus, pattern, finish, duration, warm-up, and cooldown options.',
    descriptionZh: '以拉霸機概念設計的有氧訓練產生器，組合訓練重點、節奏、收尾、時間、暖身與緩和，快速建立多變的跑步機課表。',
    tags: ['Fitness', 'React', 'PWA'],
    githubUrl: 'https://github.com/ytchou/cardio-slot',
    liveUrl: 'https://ytchou.github.io/cardio-slot/',
    image: cardioSlotHero,
  },
  {
    title: 'Formoria',
    description: 'A curated directory platform connecting Taiwan-made brands with global consumers. Helps local manufacturers gain international visibility through a clean, trustworthy showcase experience.',
    descriptionZh: '精心策劃的目錄平台，連結台灣品牌與全球消費者，幫助在地製造商透過乾淨、值得信賴的展示體驗走向國際。',
    tags: ['Product', 'Next.js', 'TypeScript'],
    inDevelopment: true,
    image: formoriaHero,
  },
];
