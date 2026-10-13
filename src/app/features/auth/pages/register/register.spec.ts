import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EmailVerificationService } from '../../../projects/services/email-verification.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        EmailVerificationService,   // ← AJOUT
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejette un email invalide', () => {
    component['form'].controls.email.setValue('pas-un-email');
    expect(component['form'].controls.email.hasError('email')).toBe(true);
  });

  it('détecte des mots de passe différents', () => {
    component['form'].patchValue({
      name: 'Test',
      email: 'test@taskflow.dev',
      password: 'secret123',
      confirmPassword: 'autre-chose',
    });
    expect(component['form'].hasError('passwordsMismatch')).toBe(true);
  });
});
