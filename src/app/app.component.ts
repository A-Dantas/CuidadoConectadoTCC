import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ChangePasswordModalComponent } from './shared/components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChangePasswordModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'cuidado_conectado';
  authService = inject(AuthService);
}
