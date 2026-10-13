import { Component, computed, inject, signal } from '@angular/core';
import { ProjectCard } from '../../components/project-card/project-card';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.models';
import { ProjetsService } from '../../services/projets';
import { APP_CONFIG, defaultAppConfig } from '../../../../core/config/app-config.token';
import { MatButtonModule } from '@angular/material/button';

type ProjectStatus = Project['status'];
type StatusFilter = 'all' | ProjectStatus;

interface Column {
  status: ProjectStatus;
  label: string;
  projects: Project[];
}

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'actif', label: 'Actif' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'termine', label: 'Terminé' },
];

@Component({
  imports: [ProjectCard, RouterLink, MatButtonModule],
  selector: 'app-project-list',
  styleUrl: './project-list.scss',
  templateUrl: './project-list.html',
  providers: [
    { provide: APP_CONFIG, useValue: { ...defaultAppConfig, defaultPageSize: 25 } },
  ],
})
export class ProjectList {
  private projectService = inject(ProjetsService);
  private config = inject(APP_CONFIG);

  protected readonly loading = this.projectService.loading;
  protected readonly activeProjectsCount = this.projectService.activeProjectsCount;
  protected readonly archivedCount = this.projectService.archivedCount;
  protected readonly pageSize = this.config.defaultPageSize;

  /** Bascule : actifs par défaut, archivés sur demande. */
  protected readonly showArchived = signal(false);

  /**
   * Alias `projects` pour compatibilité : renvoie actifs ou archivés selon le toggle.
   * Tout le reste du code (filtres, kanban) hérite de ce comportement.
   */
  protected readonly projects = computed(() =>
    this.showArchived()
      ? this.projectService.archivedProjects()
      : this.projectService.activeProjects(),
  );

  /** Filtre de statut sélectionné. */
  protected readonly statusFilter = signal<StatusFilter>('all');

  /** Bornes du filtre de date (YYYY-MM-DD). */
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  protected readonly hasDateFilter = computed(() => !!this.dateFrom() || !!this.dateTo());

  private readonly dateFilteredProjects = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (!from && !to) return this.projects();

    return this.projects().filter((p) => {
      const day = (p.createdAt ?? '').slice(0, 10);
      if (!day) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  });

  protected readonly filterOptions = computed(() => {
    const all = this.dateFilteredProjects();
    return [
      { value: 'all' as StatusFilter, label: 'Tous', count: all.length },
      ...STATUSES.map((s) => ({
        value: s.value as StatusFilter,
        label: s.label,
        count: all.filter((p) => p.status === s.value).length,
      })),
    ];
  });

  protected readonly columns = computed<Column[]>(() => {
    const filter = this.statusFilter();
    const all = this.dateFilteredProjects();
    return STATUSES.filter((s) => filter === 'all' || s.value === filter).map((s) => ({
      status: s.value,
      label: s.label,
      projects: all.filter((p) => p.status === s.value),
    }));
  });

  protected setFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected toggleArchived(): void {
    this.showArchived.update((v) => !v);
    // On reset le filtre de statut pour ne pas masquer les projets d'une autre colonne
    this.statusFilter.set('all');
  }

  protected onDateFromChange(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  protected onDateToChange(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  protected resetDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  onProjectSelected(project: Project): void {
    console.log('Projet selectionné:', project.name);
  }
}
