import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

import { gestorGuard } from './gestor.guard';

describe('gestorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => gestorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthService]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
