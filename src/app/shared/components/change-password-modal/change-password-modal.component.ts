import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-change-password-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './change-password-modal.component.html',
    styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {
    newPassword = '';
    confirmPassword = '';
    errorMessage = '';

    private authService = inject(AuthService);

    onSubmit() {
        this.errorMessage = '';

        if (!/^\d+$/.test(this.newPassword)) {
            this.errorMessage = 'A senha deve conter apenas números.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'As senhas não coincidem.';
            return;
        }

        if (this.newPassword === '123456') {
            this.errorMessage = 'A nova senha não pode ser igual a padrão.';
            return;
        }

        const success = this.authService.atualizarSenhaUsuario(this.newPassword);
        if (!success) {
            this.errorMessage = 'Erro ao atualizar senha. Tente novamente.';
        } else {
            alert('Senha alterada com sucesso!');
            // Modal closes automatically via parent condition
        }
    }
}
