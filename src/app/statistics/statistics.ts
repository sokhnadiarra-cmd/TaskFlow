import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProjetsService } from '../shared/services/projets';
import { StatCard } from './components/stat-card/stat-card';
import { TaskService } from '../features/tasks/task.service';
import { Task } from '../features/tasks/task.model';

@Component({
  selector: 'app-statistics',
  imports: [StatCard],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class StatisticsComponent implements OnInit {
  private readonly projetsService = inject(ProjetsService);
  private readonly taskService = inject(TaskService);

  readonly projects = this.projetsService.projects;
  readonly tasks = signal<Task[]>([]);

  // Projets
  readonly totalProjects = computed(() => this.projects().length);
  readonly activeProjects = this.projetsService.activeProjectsCount;
  readonly pausedProjects = computed(
    () => this.projects().filter((p) => p.status === 'en_pause').length,
  );
  readonly completedProjects = computed(
    () => this.projects().filter((p) => p.status === 'terminé').length,
  );

  // Tâches
  readonly totalTasks = computed(() => this.tasks().length);
  readonly todoTasks = computed(() => this.count('actif'));
  readonly inProgressTasks = computed(() => this.count('en_pause'));
  readonly doneTasks = computed(() => this.count('terminé'));
  readonly overdueTasks = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.tasks().filter(
      (t) => t.status !== 'terminé' && t.deadline !== null && t.deadline < today,
    ).length;
  });
  readonly completionRate = computed(() =>
    this.totalTasks() === 0 ? 0 : Math.round((this.doneTasks() / this.totalTasks()) * 100),
  );
  readonly todoPercent = computed(() => this.percentOf(this.todoTasks()));
  readonly inProgressPercent = computed(() => this.percentOf(this.inProgressTasks()));
  readonly donePercent = computed(() => this.percentOf(this.doneTasks()));

  readonly projectProgress = computed(() =>
    this.projects().map((p) => {
      const list = this.tasks().filter((t) => String(t.projectId) === String(p.id));
      const done = list.filter((t) => t.status === 'terminé').length;
      return {
        id: p.id,
        name: p.name,
        total: list.length,
        done,
        percent: list.length === 0 ? 0 : Math.round((done / list.length) * 100),
      };
    }),
  );

  private percentOf(n: number): number {
    return this.totalTasks() === 0 ? 0 : (n / this.totalTasks()) * 100;
  }

  ngOnInit(): void {
    this.taskService.getAll().subscribe((t) => this.tasks.set(t));
  }

  private count(status: Task['status']): number {
    return this.tasks().filter((t) => t.status === status).length;
  }
}