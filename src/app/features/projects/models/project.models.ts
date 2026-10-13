export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'actif' | 'en_pause' | 'termine';
  tasksCount: number;
  createdAt?: string;
  archived?: boolean;   // ← NOUVEAU : optionnel pour compatibilité
}
