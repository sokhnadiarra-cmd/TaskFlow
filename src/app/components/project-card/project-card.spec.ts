import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProjectCard } from './project-card';

describe('ProjectCard', () => {
  let fixture: ComponentFixture<ProjectCard>;
  let component: ProjectCard;

  const fakeProject = {
    id: 1,
    name: 'Projet test',
    description: 'Description test',
    status: 'actif',
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', fakeProject);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the project name', () => {
    expect(fixture.nativeElement.textContent).toContain('Projet test');
  });

  it('should emit the project when selected', () => {
    let emitted: unknown;
    component.selected.subscribe((p) => (emitted = p));
    component.onSelect();
    expect(emitted).toEqual(fakeProject);
  });
});