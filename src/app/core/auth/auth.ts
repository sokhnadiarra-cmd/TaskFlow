import { computed, inject, Service, signal } from '@angular/core';
import { User } from './user.model';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, switchMap, tap } from 'rxjs';
import { EmailService } from '../../features/projects/services/email.service';

interface StoredSession {
  token: string;
  user: User;
  expiresAt: number
}
export interface PasswordReset {
  id: number;
  userId: number;
  token: string;
  expiresAt: number;
  used: boolean;
}


const STORAGE_KEY = 'taskflow.session';
// Une session utilisateur doit durer raisonnablement longtemps.
// 30 min est un bon compromis pour une démo/projet pédagogique.
const SESSION_TTL_MS = 30 * 60_000;   // 30 minutes

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiUrl}/users`;
  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private expiresAt: number | null = null;
  private readonly resetUrl = `${environment.apiUrl}/passwordResets`;
  //Exposition du signal en lecture seule pour
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._token() != null);
  private readonly emailService = inject(EmailService);


  constructor() {
    const session = this.readStoredSession();
    if(!session) return;
    this._currentUser.set(session.user);
    this._token.set(session.token);
    this.expiresAt = session.expiresAt;
  }

  login(email: string, password: string): Observable<User> {
    return this.http
    .get<Array<User & { password : string}>>(this.usersUrl, {
      params: {email: email.trim().toLocaleLowerCase(), password}
    })
    .pipe(
      map(matches => {
        if(matches.length === 0) throw new Error('Identifiants invalides');
        const {password: _password, ...user} = matches[0];
        return user;
      }),
      tap(user => this.startSession(user))
    );
  }
 register(input: { name: string; email: string; password: string }): Observable<User> {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };

  return this.http
    .post<User & { password: string }>(this.usersUrl, payload, {
      headers: { 'X-Skip-Auth': 'true' },   // ⬅️ AJOUT
    })
    .pipe(map(({ password: _password, ...user }) => user));
}

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    this.expiresAt = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  getValidToken(): string | null {
    const token = this._token();
    if(!token || !this.expiresAt) return null;
    if(Date.now() > this.expiresAt) {
      this.logout();
      return null;
    }

    return token;
  }

  private startSession(user: User): void {
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    this._currentUser.set(user);
    this._token.set(token);
    this.expiresAt = expiresAt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({token, user, expiresAt} satisfies StoredSession))
  }

  private readStoredSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;

    const session: StoredSession = JSON.parse(raw);
    if(Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  }
 /**
 * Vérifie côté API si un compte existe déjà avec cet email.
 * Utilisé par uniqueEmailValidator à l'inscription.
 */
checkEmailExists(email: string): Observable<boolean> {
  return this.http
    .get<Array<User>>(this.usersUrl, {
      params: { email: email.trim().toLowerCase() },
    })
    .pipe(map((matches) => matches.length > 0));
}
/**
 * Demande un lien de réinitialisation pour l'email donné.
 * Retourne le token (en vrai, il serait envoyé par email).
 */
requestPasswordReset(email: string): Observable<{ token: string }> {
  return this.http
    .get<Array<User & { password: string }>>(this.usersUrl, {
      params: { email: email.trim().toLowerCase() },
    })
    .pipe(
      switchMap((matches) => {
        if (matches.length === 0) {
          throw new Error('Aucun compte associé à cet email');
        }

        const user = matches[0];
        const payload: Omit<PasswordReset, 'id'> = {
          userId: user.id,
          token: crypto.randomUUID(),
          expiresAt: Date.now() + 15 * 60_000,
          used: false,
        };

        return this.http
          .post<PasswordReset>(this.resetUrl, payload, {
            headers: { 'X-Skip-Auth': 'true' },
          })
          .pipe(
            switchMap((reset) => {
              // Construit le lien de reset (front)
              const resetLink = `${window.location.origin}/reset-password?token=${reset.token}`;

              // Envoie l'email via EmailJS
              return from(
                this.emailService.sendPasswordReset(user.email, user.name, resetLink),
              ).pipe(map(() => ({ token: reset.token })));
            }),
          );
      }),
    );
}



findValidReset(token: string): Observable<PasswordReset | null> {
  return this.http
    .get<PasswordReset[]>(this.resetUrl, { params: { token } })
    .pipe(
      map((matches) => {
        const reset = matches[0];
        if (!reset) return null;
        if (reset.used) return null;
        if (Date.now() > reset.expiresAt) return null;
        return reset;
      }),
    );
}

resetPassword(token: string, newPassword: string): Observable<void> {
  return this.findValidReset(token).pipe(
    switchMap((reset) => {
      if (!reset) {
        throw new Error('Token invalide ou expiré');
      }

      return this.http
        .get<User & { password: string }>(`${this.usersUrl}/${reset.userId}`)
        .pipe(
          switchMap((user) => {
            const updated = { ...user, password: newPassword };
            return this.http.put<User>(`${this.usersUrl}/${user.id}`, updated, {
              headers: { 'X-Skip-Auth': 'true' },
            });
          }),
          switchMap(() =>
            this.http.patch<PasswordReset>(
              `${this.resetUrl}/${reset.id}`,
              { used: true },
              { headers: { 'X-Skip-Auth': 'true' } },
            ),
          ),
          map(() => void 0),
        );
    }),
  );
}

}
