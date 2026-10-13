import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ProjetsService } from '../../services/projets';
import { Project } from '../../models/project.models';
import { ProjectPreview } from '../../components/project-preview/project-preview';
import { uniqueProjectNameValidator } from '../../validators/unique-project-name.validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ProjectDraft {
  name: string;
  description: string;
  status: Project['status'];
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    ProjectPreview,
  ],
  selector: 'app-project-form',
  styleUrl: './project-form.scss',
  templateUrl: './project-form.html',
})
export class ProjectForm {
  private fb = inject(FormBuilder);
  private projetsService = inject(ProjetsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Présent uniquement en mode édition : /projects/:id/edit */
  private readonly projectIdParam = this.route.snapshot.paramMap.get('id');
  private readonly projectId = this.projectIdParam ? Number(this.projectIdParam) : null;

  protected readonly isEditMode = this.projectId !== null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', {
      validators: [Validators.required, Validators.minLength(3)],
      asyncValidators: [uniqueProjectNameValidator(this.projetsService, this.projectId ?? undefined)],
      updateOn: 'blur' as const,
    }],
    description: ['', [Validators.required, Validators.maxLength(200)]],
    status: ['actif' as Project['status'], [Validators.required]],
  });

  protected readonly draft = signal<ProjectDraft>(this.form.getRawValue());
  protected readonly submitting = signal(false);
  protected readonly submitFailed = signal(false);
  protected readonly notFound = signal(false);

  constructor() {
    // Pré-remplissage en mode édition
    if (this.isEditMode && this.projectId !== null) {
      const existing = this.projetsService.projects().find((p) => p.id === this.projectId);
      if (!existing) {
        this.notFound.set(true);
      } else {
        this.form.patchValue({
          name: existing.name,
          description: existing.description,
          status: existing.status,
        });
        this.draft.set({
          name: existing.name,
          description: existing.description,
          status: existing.status,
        });
      }
    }

    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.draft.set(value as ProjectDraft));
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { name, description, status } = this.form.getRawValue();

    const request$ = this.isEditMode && this.projectId !== null
      ? this.projetsService.updateProject(this.projectId, {
          name,
          description,
          status,
          tasksCount: this.projetsService.projects().find((p) => p.id === this.projectId)?.tasksCount ?? 0,
        })
      : this.projetsService.addProject({ name, description, status });

    request$.subscribe({
      next: (project) => {
        this.router.navigate(['/projects', project.id]);
      },
      error: () => {
        this.submitFailed.set(true);
        this.submitting.set(false);
      },
    });
  }
  onCancel(): void {
  if (this.isEditMode && this.projectId !== null) {
    this.router.navigate(['/projects', this.projectId]);
  } else {
    this.router.navigate(['/projects']);
  }
}
}
