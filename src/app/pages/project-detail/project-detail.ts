import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProjetsService } from '../../shared/services/projets';
import { Member, TaskService } from '../../features/tasks/task.service';
import { Task, TaskComment } from '../../features/tasks/task.model';
import { AuthService } from '../../core/auth/auth';

@Component({
  imports: [DatePipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  selector: 'app-project-detail',
  styleUrl: './project-detail.scss',
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit {
  private projectService = inject(ProjetsService);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly project = computed(() => this.projectService.getById(this.id) ?? null);
  protected readonly notFound = computed(
    () => this.projectService.loaded() && this.project() === null
  );
  protected readonly tasks = signal<Task[]>([]);
  protected readonly members = signal<Member[]>([]);

  // Filtre par membre
  protected readonly memberFilter = signal<number | null>(null);
  protected readonly statusFilter = signal<string>('');
protected readonly dateFrom = signal<string>('');
protected readonly dateTo = signal<string>('');
  protected readonly filteredTasks = computed(() => {
  const m = this.memberFilter();
  const s = this.statusFilter();
  const from = this.dateFrom();
  const to = this.dateTo();

  return this.tasks().filter((t) => {
    if (m !== null && t.assigneeId !== m) return false;
    if (s && t.status !== s) return false;
    if (from && (!t.deadline || t.deadline < from)) return false;
    if (to && (!t.deadline || t.deadline > to)) return false;
    return true;
  });
});

  protected readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    assigneeId: this.fb.nonNullable.control<number | null>(null),
    deadline: [''],
  });

  ngOnInit(): void {
    this.taskService.getByProject(Number(this.id)).subscribe((t) => this.tasks.set(t));
    this.taskService.getMembers().subscribe((m) => this.members.set(m));
  }

  protected memberName(id: number | null): string {
    return this.members().find((m) => m.id === id)?.name ?? 'Non assignée';
  }

protected resetFilters(): void {
  this.memberFilter.set(null);
  this.statusFilter.set('');
  this.dateFrom.set('');
  this.dateTo.set('');
}

  protected setMemberFilter(value: string): void {
    this.memberFilter.set(value === '' ? null : Number(value));
  }

  protected addTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const v = this.taskForm.getRawValue();
    this.taskService
      .create({
        projectId: Number(this.id),
        title: v.title,
        description: v.description,
        status: 'actif',
        assigneeId: v.assigneeId,
        deadline: v.deadline || null,
        createdAt: new Date().toISOString().slice(0, 10),
        comments: [],
      })
      .subscribe({
  next: (created) => {
    this.tasks.update((list) => [...list, created]);
    this.taskForm.reset({ title: '', description: '', assigneeId: null, deadline: '' });
    this.addError.set('');
    this.showform.set(false);
    this.projectService.loadTasks();
  },
  error: (err) =>
    this.addError.set(
      err.status === 401
        ? 'Session expirée, reconnecte-toi.'
        : "Erreur lors de l'ajout de la tâche.",
    ),
});
    
  }

  protected changeStatus(task: Task, status: string): void {
    this.taskService
      .update(task.id!, { status: status as Task['status'] })
      .subscribe((updated) => this.replaceTask(updated));
  }

  protected addComment(task: Task, input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text) return;

    const user = this.auth.currentUser();
    const comment: TaskComment = {
      id: Date.now(),
      authorId: user?.id ?? 0,
      authorName: user?.name ?? 'Anonyme',
      text,
      createdAt: new Date().toISOString(),
    };

    this.taskService.addComment(task, comment).subscribe((updated) => {
      this.replaceTask(updated);
      input.value = '';
    });
  }

protected readonly editingId = signal<Task['id'] | null>(null);

  protected readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    assigneeId: this.fb.nonNullable.control<number | null>(null),
    deadline: [''],
  });

  protected startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.editForm.reset({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      deadline: task.deadline ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected readonly showform = signal(false);
  protected readonly addError = signal('');
  protected saveEdit(task: Task): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.getRawValue();
    this.taskService
      .update(task.id!, {
        title: v.title,
        description: v.description,
        assigneeId: v.assigneeId,
        deadline: v.deadline || null,
      })
      .subscribe((updated) => {
        this.replaceTask(updated);
        this.editingId.set(null);
      });
  }

  protected deleteTask(task: Task): void {
    if (!confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    this.taskService
      .delete(task.id!)
      .subscribe(() => {
        this.tasks.update((list) => list.filter((t) => t.id !== task.id));
        this.projectService.loadTasks();
      });
    }

  private replaceTask(updated: Task): void {
    this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
  }
}