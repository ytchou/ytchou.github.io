export interface SeriesInfo {
  title: string;
  totalDays: number;
}

// Keyed by the `series` frontmatter value on blog posts.
export const seriesInfo: Record<string, SeriesInfo> = {
  ironman: { title: '挑戰用 30 天利用 Side Project 學習 AI Agents', totalDays: 30 },
};
