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

  // Projets visibles dans la liste principale
  readonly activeProjects = computed(
    () => this._projects().filter(p => !p.archived)
  );

  // Projets archivés
  readonly archivedProjects = computed(
    () => this._projects().filter(p => p.archived)
  );

  // Les projets archivés ne comptent plus comme actifs
  readonly activeProjectsCount = computed(
    () => this._projects().filter(p => p.status === 'actif' && !p.archived).length
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

  // Règle  : archivable seulement si au moins une tâche et toutes terminées
  canArchive(projectId: number | string): boolean {
    const total = this.tasksCountOf(projectId);
    return total > 0 && this.doneCountOf(projectId) === total;
  }

  getById(id: number | string): Project | undefined {
    return this._projects().find(p => String(p.id) === String(id));
  }

  addProject(input: Omit<Project, 'id' | 'tasksCount'>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, { ...input, tasksCount: 0 }).pipe(
      tap(project => this._projects.update(projects => [...projects, project]))
    );
  }

  archiveProject(id: number | string): Observable<Project> {
    return this.setArchived(id, true);
  }

  unarchiveProject(id: number | string): Observable<Project> {
    return this.setArchived(id, false);
  }

  private setArchived(id: number | string, archived: boolean): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, { archived }).pipe(
      tap(updated =>
        this._projects.update(projects =>
          projects.map(p => (String(p.id) === String(id) ? updated : p))
        )
      )
    );
  }
}

export { computed, inject };