import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../../../app.config';
import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let fixture: ComponentFixture<ResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});