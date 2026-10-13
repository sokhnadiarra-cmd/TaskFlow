import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';


import {
  DEADLINE_SOON_DAYS,
  Task,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,

} from '../../models/task.models';
import { User } from '../../../../core/auth/user.model';

@Component({
  imports: [MatButtonModule],
  selector: 'app-task-card',
  styleUrl: './task-card.scss',
  templateUrl: './task-card.html',
})
export class TaskCard {

  task = input.required<Task>();
  assignee = input<User | null>(null);

  edit = output<Task>();
  remove = output<Task>();
  view = output<Task>();

  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly priorityLabels = TASK_PRIORITY_LABELS;

  /** État visuel de la deadline : null si pas de deadline. */
  protected readonly deadlineState = computed<'none' | 'ok' | 'soon' | 'overdue'>(() => {
    const deadline = this.task().deadline;
    if (!deadline) return 'none';

    const now = Date.now();
    const due = new Date(deadline).getTime();
    const diffDays = (due - now) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays <= DEADLINE_SOON_DAYS) return 'soon';
    return 'ok';
  });

  /** Date lisible pour l'affichage. */
  protected readonly deadlineLabel = computed(() => {
    const deadline = this.task().deadline;
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  onEdit(): void {
    this.edit.emit(this.task());
  }

  onDelete(): void {
    this.remove.emit(this.task());
  }
  onOpen() {
    window.open(`/projects/${this.task().projectId}/tasks/${this.task().id}`, '_blank');
  }
  onView(): void {
  this.view.emit(this.task());
}
}
