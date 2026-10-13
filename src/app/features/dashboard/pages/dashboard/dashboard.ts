import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProjetsService } from '../../../projects/services/projets';
import { TasksService } from '../../../projects/services/tasks';
import { UsersService } from '../../../projects/services/users';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus,
} from '../../../projects/models/task.models';

/** Stats d'un projet pour la barre d'avancement. */
interface ProjectProgress {
  id: number;
  name: string;
  total: number;
  done: number;
  percent: number;
}

/** KPI card du haut. */
interface Kpi {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  hint?: string;
}

@Component({
  imports: [RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private projectsService = inject(ProjetsService);
  private tasksService = inject(TasksService);
  private usersService = inject(UsersService);

  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly priorityLabels = TASK_PRIORITY_LABELS;

  protected readonly loading = computed(
    () => this.projectsService.loading() || this.tasksService.loading(),
  );

  // ─────────────────────────────
  // KPIs
  // ─────────────────────────────

  protected readonly totalProjects = computed(() => this.projectsService.activeProjects().length);
  protected readonly totalTasks = computed(() => this.tasksService.tasks().length);

  protected readonly overdueTasks = computed(() => {
    const now = Date.now();
    return this.tasksService
      .tasks()
      .filter((t) => t.deadline && t.status !== 'termine')
      .filter((t) => new Date(t.deadline!).getTime() < now);
  });

  protected readonly urgentTasks = computed(() =>
    this.tasksService
      .tasks()
      .filter((t) => t.priority === 'urgente' && t.status !== 'termine'),
  );

  protected readonly kpis = computed<Kpi[]>(() => [
    {
      label: 'Projets',
      value: this.totalProjects(),
      tone: 'neutral',
    },
    {
      label: 'Tâches',
      value: this.totalTasks(),
      tone: 'neutral',
      hint: `${this.usersService.usersCount()} membres`,
    },
    {
      label: 'Urgentes en cours',
      value: this.urgentTasks().length,
      tone: 'warning',
    },
    {
      label: 'En retard',
      value: this.overdueTasks().length,
      tone: 'danger',
    },
  ]);

  // ─────────────────────────────
  // Donut : répartition par statut
  // ─────────────────────────────

  protected readonly tasksByStatus = computed(() => {
    const all = this.tasksService.tasks();
    return {
      a_faire: all.filter((t) => t.status === 'a_faire').length,
      en_cours: all.filter((t) => t.status === 'en_cours').length,
      termine: all.filter((t) => t.status === 'termine').length,
    };
  });

  /** Génère le `conic-gradient` du donut à partir des proportions. */
  protected readonly statusDonutGradient = computed(() => {
    const total = this.totalTasks();
    if (total === 0) {
      return 'conic-gradient(var(--color-border) 0% 100%)';
    }

    const counts = this.tasksByStatus();
    const p1 = (counts.a_faire / total) * 100;
    const p2 = (counts.en_cours / total) * 100;
    const p3 = (counts.termine / total) * 100;

    const a = p1;
    const b = p1 + p2;
    const c = p1 + p2 + p3;

    return `conic-gradient(
      var(--color-ink-muted) 0% ${a}%,
      var(--color-status-en_pause) ${a}% ${b}%,
      var(--color-status-actif) ${b}% ${c}%
    )`;
  });

  protected readonly statusLegend = computed(() => {
    const counts = this.tasksByStatus();
    const total = this.totalTasks() || 1;
    return (['a_faire', 'en_cours', 'termine'] as TaskStatus[]).map((s) => ({
      status: s,
      label: this.statusLabels[s],
      count: counts[s],
      percent: Math.round((counts[s] / total) * 100),
    }));
  });

  // ─────────────────────────────
  // Barres : répartition par priorité
  // ─────────────────────────────

  protected readonly priorityBars = computed(() => {
    const all = this.tasksService.tasks();
    const total = all.length || 1;
    return (['urgente', 'haute', 'moyenne', 'basse'] as TaskPriority[]).map((p) => {
      const count = all.filter((t) => t.priority === p).length;
      return {
        priority: p,
        label: this.priorityLabels[p],
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  });

  // ─────────────────────────────
  // Avancement par projet
  // ─────────────────────────────

  protected readonly projectProgress = computed<ProjectProgress[]>(() => {
    const tasks = this.tasksService.tasks();
    return  this.projectsService.activeProjects().map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projectTasks.length;
      const done = projectTasks.filter((t) => t.status === 'termine').length;
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      return { id: p.id, name: p.name, total, done, percent };
    });
  });

  // ─────────────────────────────
  // Activité récente
  // ─────────────────────────────

  protected readonly recentTasks = computed(() =>
    [...this.tasksService.tasks()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  /** Résout le nom du projet d'une tâche pour l'activité récente. */
  protected projectNameOf(projectId: number): string {
    return (
      this.projectsService.projects().find((p) => p.id === projectId)?.name ?? 'Projet inconnu'
    );
  }
}
