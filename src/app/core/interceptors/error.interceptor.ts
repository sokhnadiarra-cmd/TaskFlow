import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`Erreur HTTP ${error.status} sur ${req.method} ${req.url}`, error);
      if(error.status === 401) {
        auth.logout(); 
        router.navigate(['/login']);
      }
      return throwError(() => error)
    })
  );
}; 