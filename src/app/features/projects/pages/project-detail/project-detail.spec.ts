import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDetail } from './project-detail';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })) },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    // 1) Créer le composant → instancie les 3 services et déclenche leurs GET
    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;

    // 2) Flusher les 3 requêtes de démarrage
    httpMock.expectOne(`${environment.apiUrl}/projects`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/tasks`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/users`).flush([]);

    // 3) Détection des changements → ProjectDetail déclenche GET /projects/1
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne(`${environment.apiUrl}/projects/1`).flush({
      id: 1,
      name: 'Refonte Facturation',
      description: 'Migration vers la nouvelle API de paiement',
      status: 'actif',
      tasksCount: 13,
      archived: false,   // ← AJOUT
    });
    expect(component).toBeTruthy();
  });

  it("affiche un message quand le projet n'existe pas", () => {
    httpMock.expectOne(`${environment.apiUrl}/projects/1`).flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Ce projet n'existe pas");
  });
});
