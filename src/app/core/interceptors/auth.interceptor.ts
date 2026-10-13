import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../auth/auth';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';

// Seules les requêtes qui modifient une ressource exigent un jeton.
// Endpoints publics :
//   - POST /users           → inscription (whitelist par URL)
//   - tout endpoint marqué X-Skip-Auth (ex: password reset)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isWriteApiCall = req.url.startsWith(environment.apiUrl) && req.method !== 'GET';
  const isPublicRegister = req.method === 'POST' && req.url === `${environment.apiUrl}/users`;
  const skipAuth = req.headers.has('X-Skip-Auth');

  // 1) Pas une écriture API → on laisse passer
  // 2) Inscription → publique
  // 3) X-Skip-Auth → endpoint public explicite
  if (!isWriteApiCall || isPublicRegister) {
    return next(req);
  }

  if (skipAuth) {
    // On retire le header avant l'envoi (propreté côté serveur)
    return next(req.clone({ headers: req.headers.delete('X-Skip-Auth') }));
  }

  const auth = inject(AuthService);
  const token = auth.getValidToken();

  if (!token) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
        }),
    );
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
