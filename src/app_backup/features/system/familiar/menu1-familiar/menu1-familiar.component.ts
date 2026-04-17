import { Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paciente, PacienteService } from '../../gestor/paciente.service';

@Component({
  selector: 'app-menu1-familiar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu1-familiar.component.html',
  styleUrl: './menu1-familiar.component.css'
})
export class Menu1FamiliarComponent {
  @Input() paciente: Paciente | null = null;
  @Input() loading: boolean = false;

  private pacienteService = inject(PacienteService);
  private cdr = inject(ChangeDetectorRef);

  modalAberto: boolean = false;
  modalSucessoAberto: boolean = false;
  
  pacienteEditando: Partial<Paciente> = {};

  abrirModalEdicao(): void {
    if (this.paciente) {
      this.pacienteEditando = { ...this.paciente };
      this.modalAberto = true;
    }
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  onFotoSelecionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem.');
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        alert('A imagem é muito grande. O limite é 1MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.pacienteEditando.foto = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  salvarPerfil(): void {
    if (this.paciente?.cpf && this.pacienteEditando) {
      this.pacienteService.atualizarPacientePorCpf(this.paciente.cpf, this.pacienteEditando);
      
      this.modalAberto = false;
      this.modalSucessoAberto = true;
    }
  }

  fecharModalSucesso(): void {
    this.modalSucessoAberto = false;
  }

  formatarData(data: string | undefined): string {
    if (!data) return 'Não informada';
    
    // Se já estiver no formato DD/MM/AAAA, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    
    // Tenta converter se for outro formato (ajustando para garantir o padrão solicitado)
    try {
      const partes = data.split(/[-/]/);
      if (partes.length === 3) {
        // Se for AAAA-MM-DD
        if (partes[0].length === 4) {
          return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        // Se for DD/MM/AAAA ou similar mas com hífen
        return `${partes[0].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[2]}`;
      }
    } catch(e) {}
    
    return data;
  }
}
