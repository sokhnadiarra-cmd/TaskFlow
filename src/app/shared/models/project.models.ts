export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'actif' | 'en_pause' | 'terminé';
  tasksCount: number;
}
