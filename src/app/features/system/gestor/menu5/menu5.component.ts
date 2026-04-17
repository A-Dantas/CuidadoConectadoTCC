import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../usuario.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu5',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu5.component.html',
  styleUrl: './menu5.component.css'
})
export class Menu5Component implements OnInit, OnDestroy {
  curriculos: Usuario[] = [];
  filtroBusca: string = '';
  private subscription: Subscription = new Subscription();

  // Modal states
  modalDetalhesAberto: boolean = false;
  modalSucessoAtivacaoAberto: boolean = false;
  
  usuarioSelecionado: Usuario | null = null;
  indiceOriginal: number = -1;
  usuarioAtivadoCredenciais: any = null;

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.usuarioService.getUsuarios().subscribe(usuarios => {
        // Filtrar apenas usuários com status 'pending' que são currículos (robustamente)
        this.curriculos = usuarios.filter(u => 
          u.isCurriculo === true && 
          (u.status?.toLowerCase().trim() === 'pending')
        );
      })
    );
  }

  isNovo(curriculo: Usuario): boolean {
    return this.usuarioService.isNovo(curriculo);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get curriculosFiltrados(): Usuario[] {
    if (!this.filtroBusca) return this.curriculos;
    return this.curriculos.filter(c => 
      c.userName.toLowerCase().includes(this.filtroBusca.toLowerCase()) ||
      c.email.toLowerCase().includes(this.filtroBusca.toLowerCase())
    );
  }

  abrirDetalhes(curriculo: Usuario): void {
    this.usuarioSelecionado = curriculo;
    // Encontrar o índice real no array de usuários do serviço
    const todosUsuarios = this.usuarioService.getUsuariosAtuais();
    this.indiceOriginal = todosUsuarios.findIndex(u => u.email === curriculo.email);
    this.modalDetalhesAberto = true;
  }

  fecharDetalhes(): void {
    this.modalDetalhesAberto = false;
    this.usuarioSelecionado = null;
    this.indiceOriginal = -1;
  }

  ativarCadastro(): void {
    if (this.indiceOriginal !== -1 && this.usuarioSelecionado) {
      this.usuarioService.ativarUsuario(this.indiceOriginal);
      
      // Pegar o usuário atualizado para mostrar as credenciais
      const usuarioAtualizado = this.usuarioService.getUsuariosAtuais()[this.indiceOriginal];
      this.usuarioAtivadoCredenciais = {
        userName: usuarioAtualizado.userName,
        login: usuarioAtualizado.login,
        password: usuarioAtualizado.password,
        email: usuarioAtualizado.email
      };

      this.modalDetalhesAberto = false;
      this.modalSucessoAtivacaoAberto = true;
    }
  }

  fecharModalSucesso(): void {
    this.modalSucessoAtivacaoAberto = false;
    this.usuarioAtivadoCredenciais = null;
  }

  visualizarPdf(): void {
    if (this.usuarioSelecionado?.curriculoPdf) {
      const pdfWindow = window.open("");
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='${this.usuarioSelecionado.curriculoPdf}'></iframe>`
        );
      } else {
        alert("Por favor, permita pop-ups para visualizar o PDF.");
      }
    }
  }

  baixarPdf(): void {
    if (this.usuarioSelecionado?.curriculoPdf) {
      const link = document.createElement('a');
      link.href = this.usuarioSelecionado.curriculoPdf;
      link.download = `Curriculo_${this.usuarioSelecionado.userName}.pdf`;
      link.click();
    }
  }
}
