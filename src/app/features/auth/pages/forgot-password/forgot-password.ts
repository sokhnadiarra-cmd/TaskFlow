import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../../core/auth/auth';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  selector: 'app-forgot-password',
  styleUrl: './forgot-password.scss',
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly emailSent = signal(false);
  /** Token généré (affiché à l'écran pour la démo, en vrai il serait envoyé par email). */
  protected readonly resetToken = signal<string | null>(null);

  protected get emailCtrl() {
    return this.form.controls.email;
  }

 onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.submitting.set(true);
  this.errorMessage.set(null);
  this.emailSent.set(false);

  const { email } = this.form.getRawValue();

  this.authService.requestPasswordReset(email).subscribe({
    next: () => {
      this.emailSent.set(true);
      this.submitting.set(false);
    },
    error: (err: Error) => {
      this.errorMessage.set(err.message ?? 'Une erreur est survenue');
      this.submitting.set(false);
    },
  });
}
}

