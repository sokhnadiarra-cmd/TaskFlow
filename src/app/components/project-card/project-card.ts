import { Component, input, output } from '@angular/core';
import { Project } from '../../shared/models/project.models';
import { computed, inject } from '@angular/core';
import { ProjetsService } from '../../shared/services/projets';

@Component({
  imports: [],
  selector: 'app-project-card',
  styleUrl: './project-card.scss',
  templateUrl: './project-card.html',
})
export class ProjectCard {
  /**
   * Un dumb component recoit des données via input()
   * et signale des événements vers l'extérieur via output()
   */
  project = input.required<Project>();
  selected = output<Project>();

  onSelect(){
    console.log('ProjectCard selected card', this.project().name)
    this.selected.emit(this.project());
  }

 private readonly projetsService = inject(ProjetsService);

protected readonly taskCount = computed(() =>
  this.projetsService.tasksCountOf(this.project().id),
);
protected readonly doneCount = computed(() =>
  this.projetsService.doneCountOf(this.project().id),
); 
// Vrai si le projet a des tâches et qu'elles sont toutes terminées (règle A)
  protected readonly canArchive = computed(() =>
    this.projetsService.canArchive(this.project().id),
  );

  onArchive(event: Event): void {
    event.stopPropagation(); // évite de déclencher onSelect() sur la carte
    this.projetsService.archiveProject(this.project().id).subscribe();
  }

  onUnarchive(event: Event): void {
    event.stopPropagation();
    this.projetsService.unarchiveProject(this.project().id).subscribe();
  }
}
