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
    title: 'Project One',
    description: 'A short description of what this project does and why it matters.',
    tags: ['TypeScript', 'React', 'Node.js'],
    githubUrl: 'https://github.com/yourname/project-one',
    liveUrl: 'https://project-one.example.com',
    featured: true,
  },
  {
    title: 'Project Two',
    description: 'Another project — replace this with your real work.',
    tags: ['Python', 'FastAPI'],
    githubUrl: 'https://github.com/yourname/project-two',
    featured: false,
  },
];
