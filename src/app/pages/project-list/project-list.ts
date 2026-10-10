import { Component, inject, signal } from '@angular/core';
import { Project } from '../../shared/models/project.models';
import { Panel } from '../../components/panel/panel';
import { ProjectCard } from '../../components/project-card/project-card';
import { RouterLink } from "@angular/router";
import { ProjetsService } from '../../shared/services/projets';
import { APP_CONFIG, defaultAppConfig } from '../../config/app-config.token';
import { Router} from '@angular/router';
@Component({
  imports: [ProjectCard, RouterLink],
  selector: 'app-project-list',
  styleUrl: './project-list.scss',
  templateUrl: './project-list.html',

  providers: [
    { provide: APP_CONFIG, useValue: { ...defaultAppConfig, defaultPageSize: 25} }
  ]
})
export class ProjectList {
  private projectService = inject(ProjetsService);
  private config = inject(APP_CONFIG);
  protected readonly projects = this.projectService.projects;
  protected readonly activeProjectsCount = this.projectService.activeProjectsCount;
  private router = inject(Router);

  /**
   * Methode pour récuper l'evenement exposer par le dumb component enfant ProjectCard
   * @param project
   */
  onProjectSelected(project: Project) {
    this.router.navigate(['/projects', project.id]);
  }

}
