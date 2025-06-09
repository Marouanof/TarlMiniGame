import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'pending-approval', loadComponent: () => import('./pages/pending-approval/pending-approval.component').then(m => m.PendingApprovalComponent) },
  { path: 'test-create', loadComponent: () => import('./pages/test-creation/test-creation.component').then(m => m.TestCreationComponent), canActivate: [AuthGuard] },
  { path: 'test-list', loadComponent: () => import('./pages/test-list/test-list.component').then(m => m.TestListComponent), canActivate: [AuthGuard] },
  { path: 'edit-test/:testId', loadComponent: () => import('./pages/test-edition/test-edition.component').then(m => m.TestEditionComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
