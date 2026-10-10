import { computed, inject, Service, signal } from '@angular/core';
import { User } from './user.model';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
interface StoredSession {
    token: string;
    user: User;
    expiresAt: number;
}
const STORAGE_KEY = 'taskflow_session';
const SESSION_TTL_MS = 30 * 60 * 1000;

@Service()
export class AuthService {
    
    private readonly http = inject(HttpClient);
    private readonly usersUrl =  `${environment.apiUrl}/users`;   
    private readonly _currentUser = signal<User | null>(null);
    private readonly _token = signal<string | null>(null);
    private expiresAt: number | null = null;

    //Exposition du signal en lecture seule
    readonly currentUser = this._currentUser.asReadonly();
    readonly isAuthenticated = computed(() => this._token() != null);

    constructor() {
        const session = this.readStoredSession();
        if(!session) return;
        this._currentUser.set(session.user);
        this._token.set(session.token);
        this.expiresAt = session.expiresAt;
    }

    login(email: string, password: string): Observable<User> {
  return this.http
    .get<Array<User & { password: string }>>(this.usersUrl, {
      params: { email: email.trim().toLowerCase() },
    })
    .pipe(
      map((matches) => {
        if (matches.length === 0) throw new Error("Cet email n'existe pas!");
        const { password: storedPassword, ...user } = matches[0];
        if (storedPassword !== password) throw new Error("Mot de passe erroné!");
        return user as User;
      }),
      tap((user) => this.startSession(user)),
    );
}

     // Inscription
    register(name: string, email: string, password: string): Observable<User> {
  const normalized = email.trim().toLowerCase();

  return this.http
    .get<User[]>(this.usersUrl, { params: { email: normalized } })
    .pipe(
      switchMap((existing) => {
        if (existing.length > 0) {
          return throwError(() => new Error('EMAIL_TAKEN'));
        }
        return this.http.post<User & { password: string }>(this.usersUrl, {
          name,
          email: normalized,
          password,
        });
      }),
      map(({ password: _password, ...user }) => user as User),
    );
}

requestPasswordReset(email: string): Observable<string> {
  const normalized = email.trim().toLowerCase();
  return this.http.get<User[]>(this.usersUrl, { params: { email: normalized } }).pipe(
    switchMap((matches) => {
      if (matches.length === 0) {
        return throwError(() => new Error("Cet email n'existe pas !"));
      }
      const token = crypto.randomUUID();
      const resetExpiresAt = Date.now() + 15 * 60 * 1000;
      return this.http
        .patch(`${this.usersUrl}/${matches[0].id}`, { resetToken: token, resetExpiresAt })
        .pipe(map(() => token));
    }),
  );
}

resetPassword(token: string, newPassword: string): Observable<void> {
  return this.http
    .get<Array<User & { resetExpiresAt?: number }>>(this.usersUrl, { params: { resetToken: token } })
    .pipe(
      switchMap((matches) => {
        const user = matches[0];
        if (!user || !user.resetExpiresAt || user.resetExpiresAt < Date.now()) {
          return throwError(() => new Error('Lien invalide ou expiré.'));
        }
        return this.http.patch(`${this.usersUrl}/${user.id}`, {
          password: newPassword,
          resetToken: null,
          resetExpiresAt: null,
        });
      }),
      map(() => undefined),
    );
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({token, user, expiresAt} satisfies  StoredSession))
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

}
