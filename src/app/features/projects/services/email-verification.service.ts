import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface EmailVerificationResult {
  valid: boolean;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailVerificationService {
  private http = inject(HttpClient);

  /** API gratuite, sans clé, sans inscription. */
  private readonly apiUrl = 'https://rapid-email-verifier.fly.dev/api/validate';

  /**
   * Vérifie si une adresse email existe réellement (MX record + syntaxe).
   * En cas d'erreur réseau, on considère l'email comme "acceptable"
   * pour ne pas bloquer l'utilisateur.
   */
  verifyEmail(email: string): Observable<EmailVerificationResult> {
    if (!email) {
      return of({ valid: false, reason: 'Email vide' });
    }

    return this.http
      .get<{ status: string }>(this.apiUrl, { params: { email } })
      .pipe(
        timeout(5000),
        map((response) =>
          response.status === 'VALID'
            ? { valid: true }
            : { valid: false, reason: response.status },
        ),
        catchError(() => of({ valid: true, reason: 'Vérification impossible' })),
      );
  }
}
