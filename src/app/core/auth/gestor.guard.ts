import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';


export const gestorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const estaLogado = authService.estaLogado();
  const perfil = authService.perfil();

  if (estaLogado && perfil === 'gestor') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};