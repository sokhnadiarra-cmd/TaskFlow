import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from '../../../../app.config';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});