import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth-guard';
import { StatisticsComponent } from './statistics/statistics';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(c => c.Home)},
  {path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then(c => c.Login)},
  {
  path: 'register',loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),},
  {path: 'projects',
    canActivateChild: [authGuard],
    children: [
        { path: '', loadComponent: () => import('./pages/project-list/project-list').then(c => c.ProjectList)},
        { path: 'new', loadComponent: () => import('./features/projects/pages/project-form/project-form').then(c => c.ProjectForm)},
        { path: ':id', loadComponent: () => import('./pages/project-detail/project-detail').then(c => c.ProjectDetail)},
    ]
  },
  
  {path: 'statistics',
    canActivate: [authGuard],
    loadComponent: () => import('./statistics/statistics').then(c => StatisticsComponent)
  },

{
  path: 'forgot-password',
  loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
},
{
  path: 'reset-password/:token',
  loadComponent: () => import('./features/auth/pages/reset-password/reset-password').then((m) => m.ResetPassword),
},  

  { path: '**', redirectTo: ''}
];
