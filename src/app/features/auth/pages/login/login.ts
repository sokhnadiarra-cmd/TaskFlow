import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly loginFailed = signal(false);
  protected readonly justRegistered = signal(false);
  protected readonly passwordReset = signal(false);

  constructor() {
    const params = this.route.snapshot.queryParamMap;

    if (params.get('registered') === '1') {
      this.justRegistered.set(true);
      const email = params.get('email');
      if (email) this.form.controls.email.setValue(email);
    }

    if (params.get('reset') === '1') {
      this.passwordReset.set(true);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => this.loginFailed.set(true),
    });
  }
}
