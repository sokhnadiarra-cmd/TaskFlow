import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { Project } from '../../models/project.models';
import { Task } from '../../models/task.models';
import { ProjetsService } from '../../services/projets';
import { TasksService } from '../../services/tasks';
import { UsersService } from '../../services/users';
import { TaskCard } from '../../components/task-card/task-card';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';

interface DetailState {
  loading: boolean;
  notFound: boolean;
  project: Project | null;
}

const INITIAL_STATE: DetailState = {
  loading: true,
  notFound: false,
  project: null,
};

@Component({
  imports: [RouterLink, MatButtonModule, TaskCard],
  selector: 'app-project-detail',
  styleUrl: './project-detail.scss',
  templateUrl: './project-detail.html',
})
export class ProjectDetail {
  private projectService = inject(ProjetsService);
  private tasksService = inject(TasksService);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')!))),
    { requireSync: true },
  );

  private readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.projectService.getById(id).pipe(
          map((project): DetailState => ({ loading: false, notFound: false, project })),
          catchError(() =>
            of<DetailState>({ loading: false, notFound: true, project: null }),
          ),
          startWith({ loading: true, notFound: false, project: null }),
        ),
      ),
    ),
    { initialValue: INITIAL_STATE },
  );

  protected readonly project = computed(() => this.state().project);
  protected readonly loading = computed(() => this.state().loading);
  protected readonly notFound = computed(() => this.state().notFound);

  protected readonly currentIndex = computed(() => {
    const current = this.project();
    if (!current) return -1;
    return this.projectService.projects().findIndex((p) => p.id === current.id);
  });

  protected readonly previousProject = computed(() => {
    const index = this.currentIndex();
    if (index <= 0) return null;
    return this.projectService.projects()[index - 1];
  });

  protected readonly nextProject = computed(() => {
    const index = this.currentIndex();
    if (index < 0 || index >= this.projectService.projects().length - 1) return null;
    return this.projectService.projects()[index + 1];
  });

  /** Tâches du projet courant, triées par priorité décroissante. */
  protected readonly tasks = computed(() => {
    const project = this.project();
    if (!project) return [];
    const priorityOrder = { urgente: 0, haute: 1, moyenne: 2, basse: 3 };
    return this.tasksService
      .tasks()
      .filter((t) => t.projectId === project.id)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  });

  /** Résout l'assigné pour chaque tâche. */
  protected readonly assigneesByTask = computed(() => {
    const map = new Map<number, ReturnType<UsersService['getById']>>();
    for (const task of this.tasks()) {
      map.set(task.id, this.usersService.getById(task.assigneeId ?? -1));
    }
    return map;
  });

  constructor() {
    effect(() => {
      const project = this.project();
      document.title = project ? `TaskFlow - ${project.name}` : 'TaskFlow';
    });
  }

  protected onTaskEdit(task: Task): void {
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id, 'edit']);
  }

  protected onTaskOpen(task: Task): void {
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id]);
  }

  protected onProjectEdit(project: Project): void {
    this.router.navigate(['/projects', project.id, 'edit']);
  }

  /** Handler du bouton Archiver / Désarchiver. */
  protected onProjectArchiveToggle(project: Project): void {
    const isArchived = project.archived === true;

    const ref = this.dialog.open(ConfirmDialog, {
      width: '440px',
      data: {
        title: isArchived ? 'Désarchiver le projet' : 'Archiver le projet',
        message: isArchived
          ? `Veux-tu vraiment restaurer « ${project.name} » ? Il réapparaîtra dans la liste principale.`
          : `Veux-tu archiver « ${project.name} » ? Il sera masqué de la liste mais ses tâches seront conservées.`,
        confirmLabel: isArchived ? 'Désarchiver' : 'Archiver',
        cancelLabel: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const action$ = isArchived
        ? this.projectService.unarchiveProject(project.id)
        : this.projectService.archiveProject(project.id);

      action$.subscribe({
        next: () => this.router.navigate(['/projects']),
        error: () => console.error('Échec archivage/désarchivage', project.id),
      });
    });
  }

  /** Handler du (remove) émis par TaskCard. */
  protected onTaskDelete(task: Task): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Supprimer la tâche',
        message: `Veux-tu vraiment supprimer « ${task.title} » ? Cette action est définitive.`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.tasksService.deleteTask(task.id).subscribe({
        error: () => console.error('Échec suppression tâche', task.id),
      });
    });
  }
}
