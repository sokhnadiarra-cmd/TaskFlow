import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then((c) => c.Home) },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then((c) => c.Login) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register/register').then((c) => c.Register) },
  {
  path: 'forgot-password',
  loadComponent: () =>
    import('./features/auth/pages/forgot-password/forgot-password').then(
      (c) => c.ForgotPassword,
    ),
},
{
  path: 'reset-password',
  loadComponent: () =>
    import('./features/auth/pages/reset-password/reset-password').then(
      (c) => c.ResetPassword,
    ),
},
  {
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/dashboard/pages/dashboard/dashboard').then((c) => c.Dashboard),
},
  {
    path: 'projects',
    canActivateChild: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/projects/pages/project-list/project-list').then((c) => c.ProjectList) },
      { path: 'new', loadComponent: () => import('./features/projects/pages/project-form/project-form').then((c) => c.ProjectForm) },

      // Routes tâches : spécifiques AVANT ':id'
      { path: ':id/tasks/new', loadComponent: () => import('./features/projects/components/task-form/task-form').then((c) => c.TaskForm) }, // Feature 1
      { path: ':id/tasks/:taskId/edit', loadComponent: () => import('./features/projects/components/task-form/task-form').then((c) => c.TaskForm) }, // Feature 2
      // { path: ':id/tasks', loadComponent: () => import('./features/projects/pages/project-tasks/project-tasks').then((c) => c.ProjectTasks) }, // Feature 3

      { path: ':id', loadComponent: () => import('./features/projects/pages/project-detail/project-detail').then((c) => c.ProjectDetail) },
      { path: ':id/tasks', loadComponent: () => import('./features/projects/pages/project-tasks/project-tasks').then((c) => c.ProjectTasks) },
      { path: ':id/tasks/:taskId', loadComponent: () => import('./features/projects/pages/project-tasks/project-tasks').then((c) => c.ProjectTasks) },
      { path: ':id/tasks/:taskId/detail', loadComponent: () => import('./features/projects/components/task-detail/task-detail').then((c) => c.TaskDetail) },
      { path: ':id/edit', loadComponent: () => import('./features/projects/pages/project-form/project-form').then((c) => c.ProjectForm) },
      { path: ':id/tasks/:taskId/delete', loadComponent: () => import('./features/projects/pages/project-tasks/project-tasks').then((c) => c.ProjectTasks) },
      { path: ':id/delete', loadComponent: () => import('./features/projects/pages/project-tasks/project-tasks').then((c) => c.ProjectTasks) },
      { path: ':id/edit', loadComponent: () => import('./features/projects/pages/project-form/project-form').then((c) => c.ProjectForm) },
      {
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/dashboard/pages/dashboard/dashboard').then((c) => c.Dashboard),
},

    ],
  },

  { path: '**', redirectTo: '' },
];
