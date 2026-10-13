import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TasksService } from '../../services/tasks';
import { UsersService } from '../../services/users';
import { CommentsService } from '../../services/comments';
import { AuthService } from '../../../../core/auth/auth';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../../models/task.models';
import { SlicePipe } from '@angular/common';

@Component({
  imports: [
    RouterLink,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    SlicePipe,
  ],
  selector: 'app-task-detail',
  styleUrl: './task-detail.scss',
  templateUrl: './task-detail.html',
})
export class TaskDetail {
  private tasksService = inject(TasksService);
  private usersService = inject(UsersService);
  private commentsService = inject(CommentsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // ⬇️ protected (et non private) car utilisés dans le template
  protected readonly projectId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')!))),
    { requireSync: true },
  );

  protected readonly taskId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('taskId')!))),
    { requireSync: true },
  );

  protected readonly task = computed(() =>
    this.tasksService.tasks().find((t) => t.id === this.taskId()),
  );

  protected readonly assignee = computed(() => {
    const t = this.task();
    if (!t || !t.assigneeId) return null;
    return this.usersService.getById(t.assigneeId) ?? null;
  });

  protected readonly comments = computed(() =>
    this.commentsService.commentsByTask(this.taskId())(),
  );

  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly priorityLabels = TASK_PRIORITY_LABELS;

  protected readonly commentForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]],
  });

  protected readonly submitting = signal(false);

  /** Renvoie l'auteur d'un commentaire pour l'affichage. */
  protected authorOf(authorId: number) {
    return this.usersService.getById(authorId);
  }

  protected onAddComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.submitting.set(true);
    const { content } = this.commentForm.getRawValue();

    this.commentsService
      .addComment({
        taskId: this.taskId(),
        authorId: user.id,
        content,
      })
      .subscribe({
        next: () => {
          this.commentForm.reset({ content: '' });
          this.submitting.set(false);
        },
        error: () => this.submitting.set(false),
      });
  }

  protected onBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
