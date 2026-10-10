import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProjectDetail } from './project-detail';

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});