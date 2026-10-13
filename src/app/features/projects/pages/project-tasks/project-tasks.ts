import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import { TasksService } from '../../services/tasks';
import { UsersService } from '../../services/users';
import { ProjetsService } from '../../services/projets';
import {
  Task,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TaskStatus,
} from '../../models/task.models';
import { TaskCard } from '../../components/task-card/task-card';
import {
  TaskFilters,
  TaskFiltersValue,
} from '../../components/task-filters/task-filters';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';

interface Column {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

@Component({
  imports: [RouterLink, MatButtonModule, TaskCard, TaskFilters, CdkDropList, CdkDrag],
  selector: 'app-project-tasks',
  styleUrl: './project-tasks.scss',
  templateUrl: './project-tasks.html',
})
export class ProjectTasks {
  private tasksService = inject(TasksService);
  private usersService = inject(UsersService);
  private projectService = inject(ProjetsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // ⬇️ protected (et non private) car utilisé dans le template
  protected readonly projectId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')!))),
    { requireSync: true },
  );

  /** Projet affiché (utile pour le titre et le lien retour). */
  protected readonly project = computed(() =>
    this.projectService.projects().find((p) => p.id === this.projectId()),
  );

  /** État local des filtres. */
  protected readonly filters = signal<TaskFiltersValue>({
    status: 'all',
    priority: 'all',
    deadlineFrom: null,
    deadlineTo: null,
  });

  /** Tâches du projet filtrées (avant regroupement Kanban). */
  private readonly filteredTasks = computed(() => {
    const f = this.filters();
    const from = f.deadlineFrom ? new Date(f.deadlineFrom).getTime() : null;
    const to = f.deadlineTo ? new Date(f.deadlineTo).getTime() : null;

    return this.tasksService
      .tasks()
      .filter((t) => t.projectId === this.projectId())
      .filter((t) => f.status === 'all' || t.status === f.status)
      .filter((t) => f.priority === 'all' || t.priority === f.priority)
      .filter((t) => {
        if (!from && !to) return true;
        const created = new Date(t.createdAt).getTime();
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      });
  });

  /** Colonnes Kanban dérivées des tâches filtrées. */
  protected readonly columns = computed<Column[]>(() => {
    const tasks = this.filteredTasks();
    return TASK_STATUSES.map((status) => ({
      status,
      label: TASK_STATUS_LABELS[status],
      tasks: tasks.filter((t) => t.status === status),
    }));
  });

  protected readonly totalFiltered = computed(() => this.filteredTasks().length);

  /** Résolution de l'assigné pour chaque tâche. */
  protected readonly assigneesByTask = computed(() => {
    const map = new Map<number, ReturnType<UsersService['getById']>>();
    for (const task of this.filteredTasks()) {
      map.set(task.id, this.usersService.getById(task.assigneeId ?? -1));
    }
    return map;
  });

  protected readonly connectedLists = computed(() =>
    TASK_STATUSES.map((s) => `col-${s}`),
  );

  protected onFiltersChange(value: TaskFiltersValue): void {
    this.filters.set(value);
  }

  /** Drag & drop : gère les deux cas (réordonner ou changer de colonne). */
  protected onDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    // 1. Même colonne → réordonner visuellement (pas de PUT)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // 2. Changement de colonne → déplacer + persister
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const task = event.container.data[event.currentIndex];
    if (!task) return;

    this.tasksService.moveTask(task.id, targetStatus).subscribe({
      error: () => console.error('Échec déplacement', task.id),
    });
  }

  protected onTaskEdit(task: Task): void {
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id, 'edit']);
  }

  protected onTaskDelete(task: Task): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Supprimer la tâche',
        message: `Veux-tu vraiment supprimer « ${task.title} » ?`,
        confirmLabel: 'Supprimer',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.tasksService.deleteTask(task.id).subscribe();
    });
  }

  protected onTaskView(task: Task): void {
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id]);
  }
}
