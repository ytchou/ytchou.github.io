export interface Project {
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    title: 'Baseball Analytics Dashboard',
    description: 'A real-time sabermetrics dashboard for tracking player performance metrics. Features interactive visualizations, predictive models, and historical comparisons.',
    tags: ['Python', 'React', 'Data Viz'],
    githubUrl: 'https://github.com/ytchou/baseball-analytics',
    featured: true,
  },
  {
    title: 'Data Pipeline Toolkit',
    description: 'An open-source ETL framework for building reliable data pipelines. Handles schema validation, retry logic, and monitoring out of the box.',
    tags: ['Python', 'FastAPI', 'PostgreSQL'],
    githubUrl: 'https://github.com/ytchou/data-pipeline-toolkit',
    featured: true,
  },
];
