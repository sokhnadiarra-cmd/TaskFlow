import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Project } from '../models/project.models';
import { Task } from '../../features/tasks/task.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ProjetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/projects`;
  private readonly tasksUrl = `${environment.apiUrl}/tasks`;

  private readonly _projects = signal<Project[]>([]);
  private readonly _tasks = signal<Task[]>([]);

  // Exposition en lecture seule pour les composants
  readonly projects = this._projects.asReadonly();
  readonly loaded = signal(false);

  readonly activeProjectsCount = computed(
    () => this._projects().filter(p => p.status === 'actif').length
  );

  // Vrai nombre de tâches, lu depuis /tasks
  readonly totalTasksCount = computed(() => this._tasks().length);

  constructor() {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects(): void {
    this.http.get<Project[]>(this.apiUrl).subscribe(projects => {
      this._projects.set(projects);
      this.loaded.set(true);
    });
  }

  loadTasks(): void {
    this.http.get<Task[]>(this.tasksUrl).subscribe(tasks => this._tasks.set(tasks));
  }

  tasksCountOf(projectId: number | string): number {
    return this._tasks().filter(t => String(t.projectId) === String(projectId)).length;
  }

  doneCountOf(projectId: number | string): number {
    return this._tasks().filter(
      t => String(t.projectId) === String(projectId) && t.status === 'terminé'
    ).length;
  }

  getById(id: number | string): Project | undefined {
    return this._projects().find(p => String(p.id) === String(id));
  }

  addProject(input: Omit<Project, 'id' | 'tasksCount'>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, { ...input, tasksCount: 0 }).pipe(
      tap(project => this._projects.update(projects => [...projects, project]))
    );
  }
}