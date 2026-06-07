export interface Milestone {
  hash: string;
  description: string;
  descriptionZh: string;
  year: number | 'NOW';
  isHead?: boolean;
}

export const milestones: Milestone[] = [
  {
    hash: 'HEAD',
    description: 'building data products at the intersection of analytics & design',
    descriptionZh: '在數據分析與設計的交會點打造數據產品',
    year: 'NOW',
    isHead: true,
  },
  {
    hash: 'a7f3e21',
    description: 'product designer & data scientist — crafting tools that make data accessible',
    descriptionZh: '產品設計師 & 資料科學家 — 打造讓數據更易理解的工具',
    year: 2024,
  },
  {
    hash: 'b92c4d8',
    description: 'deep dive into sabermetrics and baseball analytics',
    descriptionZh: '深入研究棒球統計分析與 sabermetrics',
    year: 2023,
  },
  {
    hash: 'c51e7a3',
    description: 'started writing about data, design, and building products',
    descriptionZh: '開始撰寫關於數據、設計和產品開發的文章',
    year: 2022,
  },
  {
    hash: 'd84bf19',
    description: 'first data visualization project — fell in love with making data tell stories',
    descriptionZh: '第一個數據視覺化專案 — 愛上用數據說故事',
    year: 2020,
  },
  {
    hash: 'e42ac70',
    description: 'studied data science and product design',
    descriptionZh: '學習資料科學與產品設計',
    year: 2018,
  },
  {
    hash: 'f7c4de2',
    description: 'first line of code',
    descriptionZh: '寫下第一行程式碼',
    year: 2015,
  },
];
