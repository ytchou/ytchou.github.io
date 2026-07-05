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
    description: 'back in Taiwan — building and writing at the intersection of AI × data',
    descriptionZh: '回到台灣，在 AI x 資料科學領域深耕與探索',
    year: 'NOW',
    isHead: true,
  },
  {
    hash: 'a3f9c12',
    description: 'full-time data scientist in the US',
    descriptionZh: '在美國擔任全職資料科學家',
    year: 2023,
  },
  {
    hash: 'b71d4e8',
    description: 'start providing free career consulting for aspiring data science students',
    descriptionZh: '開始為有志資料科學的學生提供免費職涯諮詢',
    year: 2022,
  },
  {
    hash: 'c58a2f1',
    description: 'move to the US — study data science at UPenn',
    descriptionZh: '前往美國，就讀賓州大學資料科學學程',
    year: 2021,
  },
  {
    hash: 'd94e7b3',
    description: 'first analytics role',
    descriptionZh: '第一份數據分析工作',
    year: 2020,
  },
  {
    hash: 'e26c8a5',
    description: 'first line of code — getting into data science',
    descriptionZh: '寫下第一行程式碼，踏入資料科學領域',
    year: 2018,
  },
  {
    hash: 'f13b9d7',
    description: 'studying international business at NTU',
    descriptionZh: '就讀台灣大學國際企業學系',
    year: 2015,
  },
];
