import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Task, TaskComment } from './task.model';

export interface Member {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly tasksUrl = `${environment.apiUrl}/tasks`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  getByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl, { params: { projectId } });
  }

  create(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http.post<Task>(this.tasksUrl, task);
  }

  update(id: number, changes: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.tasksUrl}/${id}`, changes);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}/${id}`);
  }

  // Les membres de l'équipe = les utilisateurs, sans leur mot de passe
  getMembers(): Observable<Member[]> {
    return this.http
      .get<Member[]>(this.usersUrl)
      .pipe(map((users) => users.map(({ id, name, email }) => ({ id, name, email }))));
  }
  addComment(task: Task, comment: TaskComment): Observable<Task> {
    return this.update(task.id!, { comments: [...task.comments, comment] });
  }
  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl);
  }
}