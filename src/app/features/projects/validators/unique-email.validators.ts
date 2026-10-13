import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, map, Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth';
/**
 * Vérifie que l'email n'est pas déjà utilisé par un autre compte.
 * Utilisé uniquement à l'inscription.
 *
 * - Anti-rebond : 300ms pour ne pas spammer l'API à chaque frappe
 * - Tolérant aux erreurs : si l'API plante, on considère l'email comme valide
 *   (le formulaire ne doit pas se bloquer à cause d'une erreur réseau)
 */
export function uniqueEmailValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = (control.value ?? '').trim().toLowerCase();

    if (!email) return of(null);

    return timer(300).pipe(
      switchMap(() => authService.checkEmailExists(email)),
      map((exists) => (exists ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
  };
}
