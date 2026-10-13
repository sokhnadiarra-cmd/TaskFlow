import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../../core/auth/auth';
import { passwordsMatchValidator } from '../../../projects/validators/passwords-match.validators';
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  selector: 'app-reset-password',
  styleUrl: './reset-password.scss',
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Token récupéré depuis l'URL ?token=xxx */
  protected readonly token = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected get passwordCtrl() {
    return this.form.controls.password;
  }

  protected get confirmCtrl() {
    return this.form.controls.confirmPassword;
  }

  constructor() {
    const t = this.route.snapshot.queryParamMap.get('token');
    this.token.set(t);
    if (!t) {
      this.errorMessage.set('Lien invalide : token manquant.');
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.token();
    if (!token) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { password } = this.form.getRawValue();

    this.authService.resetPassword(token, password).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { reset: '1' },
        });
      },
      error: () => {
        this.errorMessage.set('Lien invalide ou expiré. Demande un nouveau lien.');
        this.submitting.set(false);
      },
    });
  }
}
