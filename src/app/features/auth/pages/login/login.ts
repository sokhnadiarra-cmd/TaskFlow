import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../../core/auth/auth';
import { Router, RouterLink } from '@angular/router';
import { textChangeRangeIsUnchanged } from 'typescript';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    RouterLink
],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private projetsService = inject(AuthService);
  private router = inject(Router); 

    protected readonly form = this.fb.nonNullable.group({
    email:['', [Validators.required, Validators.email]],
    password: ['', Validators.required]

  });
  protected readonly loginFailed = signal(false);
  protected readonly errorMessage = signal('');
  private authService = inject(AuthService);

  onSubmit() {
    this.loginFailed.set(false);
    this.errorMessage.set('');

    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: (err) => {
        this.errorMessage.set(
          err instanceof HttpErrorResponse ? 'Erreur de connexion au serveur.' : err.message,
        );
        this.loginFailed.set(true);
      },
    });
  }
}