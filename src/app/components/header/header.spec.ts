import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProjetsService } from '../../shared/services/projets';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;

  // Faux service : aucune requête réseau
  const fakeProjetsService = {
    totalTasksCount: () => 3,
    activeProjectsCount: () => 2,
    loadTasks: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: ProjetsService, useValue: fakeProjetsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the total number of tasks', () => {
    expect(fixture.nativeElement.textContent).toContain('3 tâche(s) au total');
  });
});