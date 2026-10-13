import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Project } from '../models/project.models';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProjetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/projects`;
  private readonly _projects = signal<Project[]>([]);
  private _loading = signal(true);

  readonly projects = this._projects.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activeProjectsCount = computed(
    () => this._projects().filter((p) => p.status === 'actif' && !p.archived).length,
  );

  readonly totalTasksCount = computed(() =>
    this._projects()
      .filter((p) => !p.archived)
      .reduce((sum, p) => sum + p.tasksCount, 0),
  );

  /** Projets non archivés (affichés par défaut). */
  readonly activeProjects = computed(() =>
    this._projects().filter((p) => !p.archived),
  );

  /** Projets archivés (consultables via un toggle). */
  readonly archivedProjects = computed(() =>
    this._projects().filter((p) => p.archived === true),
  );

  readonly archivedCount = computed(() => this.archivedProjects().length);

  constructor() {
    this.http.get<Project[]>(this.apiUrl).subscribe({
      next: (projects) => {
        this._projects.set(projects);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  searchByName(name: string): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl, { params: { name_like: name } });
  }

  addProject(input: Omit<Project, 'id' | 'tasksCount' | 'createdAt'>): Observable<Project> {
    const project: Omit<Project, 'id'> = {
      ...input,
      tasksCount: 0,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    return this.http.post<Project>(this.apiUrl, project).pipe(
      tap((created) => this._projects.update((projects) => [...projects, created])),
    );
  }

  updateProject(id: number, input: Omit<Project, 'id'>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, { ...input, id }).pipe(
      tap((updated) =>
        this._projects.update((projects) =>
          projects.map((p) => (p.id === id ? updated : p)),
        ),
      ),
    );
  }

  /** Bascule le projet en mode archivé. */
  archiveProject(id: number): Observable<Project> {
    return this.setArchived(id, true);
  }

  /** Retire le projet des archives. */
  unarchiveProject(id: number): Observable<Project> {
    return this.setArchived(id, false);
  }

  private setArchived(id: number, archived: boolean): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, { archived }).pipe(
      tap((updated) =>
        this._projects.update((projects) =>
          projects.map((p) => (p.id === id ? { ...p, ...updated, archived } : p)),
        ),
      ),
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() =>
        this._projects.update((projects) => projects.filter((p) => p.id !== id)),
      ),
    );
  }
}
