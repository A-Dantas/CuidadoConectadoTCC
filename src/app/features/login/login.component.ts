import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  privacyPolicyAccepted = false;

  errorMessage: string | null = null;

  private authService = inject(AuthService);

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = null;

    const success = this.authService.entrar(this.username, this.password);

    if (!success) {
      alert('Dados incorretos!');
      this.errorMessage = 'Usuário ou senha inválidos. Tente novamente.';
    }
  }

}