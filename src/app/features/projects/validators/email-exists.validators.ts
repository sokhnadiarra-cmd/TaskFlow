import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EmailVerificationService } from '../../projects/services/email-verification.service';

/**
 * Validateur asynchrone : vérifie que l'email existe réellement
 * (via EmailVerificationService → API externe).
 */
export function emailExistsValidator(
  emailVerificationService: EmailVerificationService,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = (control.value ?? '').trim().toLowerCase();

    if (!email) return of(null);

    return emailVerificationService.verifyEmail(email).pipe(
      map((result) => (result.valid ? null : { emailNotExists: true })),
      catchError(() => of(null)),
    );
  };
}
