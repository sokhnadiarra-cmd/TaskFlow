import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../app.config';
import { ProjectList } from './project-list';

describe('ProjectList', () => {
  let fixture: ComponentFixture<ProjectList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectList],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectList);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});