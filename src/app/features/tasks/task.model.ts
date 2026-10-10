export type TaskStatus = 'actif' | 'en_pause' | 'terminé';

export interface TaskComment {
  id: number;
  authorId: number;
  authorName: string;
  text: string;
  createdAt: string; // date ISO
}

export interface Task {
  id?: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number | null; // id d'un utilisateur de /users
  deadline: string | null;   // date ISO (yyyy-MM-dd)
  createdAt: string;
  comments: TaskComment[];
}