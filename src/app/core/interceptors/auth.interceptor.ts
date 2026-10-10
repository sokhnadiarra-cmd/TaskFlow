import { HttpErrorResponse, HttpInterceptor, HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environments.development";
import { inject } from "@angular/core";
import { AuthService } from "../auth/auth";
import { throwError } from "rxjs";

// Seules les requêtes qui modifient une ressource exigent un jeton
export const authInterceptor : HttpInterceptorFn = (req, next) => {
  const isWriteApiCall = req.url.startsWith(environment.apiUrl) && req.method !== 'GET';

  const isRegister = req.method === 'POST' && req.url === `${environment.apiUrl}/users`;

  const isPasswordReset = req.method === 'PATCH' && req.url.startsWith(`${environment.apiUrl}/users`);
  
  if(!isWriteApiCall || isRegister || isPasswordReset) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.getValidToken();

  if(!token) {
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: req.url}));
  }

  return next(req.clone({setHeaders: {
    Authorization: `Bearer ${token}`}}));
};