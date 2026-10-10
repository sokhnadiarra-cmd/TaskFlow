import { Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ProjetsService } from '../../shared/services/projets';
import { APP_CONFIG } from '../../config/app-config.token';
import { MatSlideToggle } from '@angular/material/slide-toggle';


@Component({
  imports: [RouterLink, RouterLinkActive, MatSlideToggle],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private config = inject(APP_CONFIG);
  protected readonly appName = this.config.appName;
  protected readonly pageSize = this.config.defaultPageSize;
  private projetsService = inject(ProjetsService);
  totalTasksCount = this.projetsService.totalTasksCount;

  ngOnInit() {
    this.projetsService.loadTasks();
  }
}
