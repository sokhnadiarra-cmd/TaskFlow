import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus,
} from '../../../projects/models/task.models';
import { from } from 'rxjs';
import { TasksService } from '../../../projects/services/tasks';
import { UsersService } from '../../../projects/services/users';

@Component({
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  selector: 'app-task-form',
  styleUrl: './task-form.scss',
  templateUrl: './task-form.html',
})
export class TaskForm {
  private fb = inject(FormBuilder);
  private tasksService = inject(TasksService);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Le projet vient de l'URL : /projects/:id/tasks/... */
  private readonly projectId = Number(this.route.snapshot.paramMap.get('id'));

  /** Présent uniquement en mode édition : /projects/:id/tasks/:taskId/edit */
  private readonly taskIdParam = this.route.snapshot.paramMap.get('taskId');
  private readonly taskId = this.taskIdParam ? Number(this.taskIdParam) : null;

  /** Mode dérivé une seule fois, pas besoin de signal. */
  protected readonly isEditMode = this.taskId !== null;

  protected readonly users = this.usersService.users;
  protected readonly submitting = signal(false);
  protected readonly submitFailed = signal(false);
  protected readonly notFound = signal(false);

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly priorityLabels = TASK_PRIORITY_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    status: ['a_faire' as TaskStatus, [Validators.required]],
    priority: ['moyenne' as TaskPriority, [Validators.required]],
    assigneeId: [null as number | null],
    deadline: ['' as string],   // ← NOUVEAU (vide = pas de deadline)
  });

  constructor() {
    if (this.isEditMode && this.taskId !== null) {
      const existing = this.tasksService.tasks().find((t) => t.id === this.taskId);
      if (!existing) {
        this.notFound.set(true);
        return;
      }
      this.form.patchValue({
        title: existing.title,
        description: existing.description,
        status: existing.status,
        priority: existing.priority,
        assigneeId: existing.assigneeId,
        deadline: existing.deadline ? existing.deadline.substring(0, 10) : '', // ← NOUVEAU
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();

   const draft = {
  projectId: this.projectId,
  title: value.title,
  description: value.description,
  status: value.status,
  priority: value.priority,
  assigneeId: value.assigneeId,
  deadline: value.deadline ? new Date(value.deadline).toISOString() : null,  // ← NOUVEAU
};

    const request$ =
      this.isEditMode && this.taskId !== null
        ? this.tasksService.updateTask(this.taskId, draft)
        : this.tasksService.addTask(draft);

    request$.subscribe({
      next: () => this.router.navigate(['/projects', this.projectId]),
      error: () => {
        this.submitFailed.set(true);
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/projects', this.projectId]);
  }
}
