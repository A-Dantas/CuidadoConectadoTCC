import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../usuario.service';
import { Subscription } from 'rxjs';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-menu3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu3.component.html',
  styleUrl: './menu3.component.css'
})
export class Menu3Component implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  filtroRole: string = 'Todos';
  private subscription: Subscription = new Subscription();

  get usuariosFiltrados(): Usuario[] {
    const usuariosSemGestor = this.usuarios.filter(u => {
      const role = u.role.toLowerCase();
      return role !== 'manager' && role !== 'gestor';
    });

    if (this.filtroRole === 'Todos') {
      return usuariosSemGestor.sort((a, b) => {
        const ordem: { [key: string]: number } = {
          'Family Member': 1,
          'Doctor': 2,
          'Caregiver': 3
        };
        const prioridadeA = ordem[a.role] || 4;
        const prioridadeB = ordem[b.role] || 4;
        return prioridadeA - prioridadeB;
      });
    }
    return usuariosSemGestor.filter(u => u.role === this.filtroRole);
  }

  // Modal states
  modalEdicaoAberto: boolean = false;
  modalConfirmacaoExclusaoAberto: boolean = false;
  modalSucessoEdicaoAberto: boolean = false;
  modalSucessoExclusaoAberto: boolean = false;
  modalCartaoCuidadorAberto: boolean = false;
  modalSucessoReenvioAberto: boolean = false;

  // Edit/Delete tracking
  usuarioEditando: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: '',
    dataNascimento: '',
    idade: undefined,
    telefone: '',
    whatsapp: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: ''
  };
  cuidadorSelecionado: Usuario | null = null;
  indiceEditando: number = -1;
  indiceExcluindo: number = -1;

  // Double-click tracking for overlay
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 300;

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.usuarioService.getUsuarios().subscribe(usuarios => {
        this.usuarios = usuarios;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  baixarCartao(): void {
    const element = document.getElementById('cartaoExportar');
    if (element) {
      // Create a copy of the current html2canvas configuration targeting bugs with opacity/animations
      html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#ffffff', // Ensures a solid white canvas instead of transparent blending
        useCORS: true,
        onclone: (documentClone) => {
           // Find the cloned element and force it to be 100% solid and skip animations
           const clonedElement = documentClone.getElementById('cartaoExportar');
           if (clonedElement) {
               clonedElement.style.animation = 'none';
               clonedElement.style.opacity = '1';
               clonedElement.style.transform = 'none';
           }
        }
      }).then(canvas => {
        const link = document.createElement('a');
        const nome = this.cuidadorSelecionado?.userName || 'cuidador';
        link.download = `cartao_${nome}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error('Erro ao gerar cartão:', err);
      });
    }
  }

  // Método para abrir cartão do cuidador
  abrirModalCartao(usuario: Usuario): void {
    if (usuario.role === 'Caregiver') {
      this.cuidadorSelecionado = usuario;
      this.modalCartaoCuidadorAberto = true;
    }
  }

  fecharModalCartao(): void {
    this.modalCartaoCuidadorAberto = false;
    this.cuidadorSelecionado = null;
  }

  // Métodos para Edição
  abrirModalEdicao(usuario: Usuario, index: number): void {
    // Evita abrir o cartão ao clicar no botão de editar
    // O evento de clique no card deve ser tratado separadamente dos botões de ação
    this.usuarioEditando = { ...usuario };
    if (!this.usuarioEditando.tipoChavePix) {
        this.usuarioEditando.tipoChavePix = 'CPF';
    }
    this.indiceEditando = index;
    this.modalEdicaoAberto = true;
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.indiceEditando = -1;
    this.resetarUsuarioEditando();
  }

  salvarEdicao(): void {
    if (this.indiceEditando !== -1) {
      // Validação específica PIX para Cuidador
      if (this.usuarioEditando.role === 'Caregiver' && this.usuarioEditando.chavePix) {
        const tipo = this.usuarioEditando.tipoChavePix;
        const valor = this.usuarioEditando.chavePix;
        if (tipo === 'CPF' && valor.length < 14) {
          alert('O formato da chave PIX CPF está incompleto.');
          return;
        }
        if (tipo === 'Telefone' && valor.length < 14) {
          alert('O formato da chave PIX Telefone está incompleto.');
          return;
        }
        if (tipo === 'Email' && !valor.includes('@')) {
          alert('O formato da chave PIX E-mail é inválido.');
          return;
        }
      }

      this.usuarioService.atualizarUsuario(this.indiceEditando, this.usuarioEditando);
      this.fecharModalEdicao();
      this.modalSucessoEdicaoAberto = true;
    }
  }

  fecharModalSucessoEdicao(): void {
    this.modalSucessoEdicaoAberto = false;
  }

  // Métodos para Exclusão
  abrirModalConfirmacaoExclusao(index: number): void {
    this.indiceExcluindo = index;
    this.modalConfirmacaoExclusaoAberto = true;
  }

  fecharModalConfirmacaoExclusao(): void {
    this.modalConfirmacaoExclusaoAberto = false;
    this.indiceExcluindo = -1;
  }

  confirmarExclusao(): void {
    if (this.indiceExcluindo !== -1) {
      this.usuarioService.removerUsuario(this.indiceExcluindo);
      this.fecharModalConfirmacaoExclusao();
      this.modalSucessoExclusaoAberto = true;
    }
  }

  fecharModalSucessoExclusao(): void {
    this.modalSucessoExclusaoAberto = false;
  }

  reenviarSenha(): void {
    if (this.usuarioEditando.email) {
      console.log(`Simulando reenvio de senha para: ${this.usuarioEditando.email}`);
      console.log(`Login: ${this.usuarioEditando.login} | Senha: ${this.usuarioEditando.password}`);
      
      this.modalSucessoReenvioAberto = true;
      
      // Fecha automaticamente após 2 segundos
      setTimeout(() => {
        this.modalSucessoReenvioAberto = false;
      }, 2500);
    }
  }

  // Utilitários
  handleOverlayClick(): void {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - this.lastClickTime;

    if (timeDiff < this.DOUBLE_CLICK_DELAY) {
      if (this.modalEdicaoAberto) this.fecharModalEdicao();
      else if (this.modalConfirmacaoExclusaoAberto) this.fecharModalConfirmacaoExclusao();
      else if (this.modalSucessoEdicaoAberto) this.fecharModalSucessoEdicao();
      else if (this.modalSucessoExclusaoAberto) this.fecharModalSucessoExclusao();
      else if (this.modalCartaoCuidadorAberto) this.fecharModalCartao();
    }

    this.lastClickTime = currentTime;
  }

  // Validações e Formatações
  validarNome(event: any, campo: string, objeto: any): void {
    const valor = event.target.value;
    const valorSemNumeros = valor.replace(/[0-9]/g, '');
    objeto[campo] = valorSemNumeros;
    event.target.value = valorSemNumeros;
  }

  formatarTelefone(event: any, campo: string, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    let valorFormatado = '';
    if (valor.length > 0) {
      valorFormatado = '(' + valor.substring(0, 2);
    }
    if (valor.length >= 3) {
      valorFormatado += ') ' + valor.substring(2, 7);
    }
    if (valor.length >= 8) {
      valorFormatado += '-' + valor.substring(7, 11);
    }
    objeto[campo] = valorFormatado;
    event.target.value = valorFormatado;
  }

  // Helper para converter string DD/MM/AAAA em objeto Date
  parseDataBR(dataBR: string): Date | null {
    const partes = dataBR.split('/');
    if (partes.length !== 3) return null;
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const ano = parseInt(partes[2]);
    const date = new Date(ano, mes, dia);
    return (date.getFullYear() === ano && date.getMonth() === mes && date.getDate() === dia) ? date : null;
  }

  calcularIdade(dataNascimento: string | undefined): number | undefined {
    if (!dataNascimento) return undefined;
    const nascimento = this.parseDataBR(dataNascimento);
    if (!nascimento) return undefined;
    
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : undefined;
  }

  atualizarIdadeUsuario(): void {
    this.usuarioEditando.idade = this.calcularIdade(this.usuarioEditando.dataNascimento);
  }

  formatarDataBR(event: any, campo: string, objeto: any, callback?: Function): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.substring(0, 8);
    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = valor.substring(0, 2);
    if (valor.length >= 3) valorFormatado += '/' + valor.substring(2, 4);
    if (valor.length >= 5) valorFormatado += '/' + valor.substring(4, 8);
    objeto[campo] = valorFormatado;
    event.target.value = valorFormatado;
    if (callback) callback();
  }

  formatarCPF(event: any, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = valor.substring(0, 3);
    if (valor.length >= 4) valorFormatado += '.' + valor.substring(3, 6);
    if (valor.length >= 7) valorFormatado += '.' + valor.substring(6, 9);
    if (valor.length >= 10) valorFormatado += '-' + valor.substring(9, 11);
    
    if (objeto.role === 'Family Member') {
      objeto.cpfPacienteResponsavel = valorFormatado;
    }
    event.target.value = valorFormatado;
  }

  formatarChavePix(event: any, objeto: any): void {
    const tipo = objeto.tipoChavePix;
    if (tipo === 'CPF') {
      this.formatarCPF(event, objeto);
      objeto.chavePix = event.target.value;
    } else if (tipo === 'Telefone') {
      this.formatarTelefone(event, 'chavePix', objeto);
    } else {
      objeto.chavePix = event.target.value;
    }
  }

  // Método para traduzir role
  traduzirRole(role: string): string {
    const traducoes: { [key: string]: string } = {
      'Caregiver': 'Cuidador',
      'Doctor': 'Médico',
      'Family Member': 'Familiar'
    };
    return traducoes[role] || role;
  }

  // Métodos para comorbidades (Cuidador)
  adicionarExperienciaComorbidadeUsuario(): void {
    if (!this.usuarioEditando.experienciaComorbidadesList) {
      this.usuarioEditando.experienciaComorbidadesList = [];
    }
    this.usuarioEditando.experienciaComorbidadesList.push('');
  }

  removerExperienciaComorbidadeUsuario(index: number): void {
    if (this.usuarioEditando.experienciaComorbidadesList && this.usuarioEditando.experienciaComorbidadesList.length > 0) {
      this.usuarioEditando.experienciaComorbidadesList.splice(index, 1);
    }
  }

  private resetarUsuarioEditando(): void {
    this.usuarioEditando = {
      userName: '',
      sobrenome: '',
      email: '',
      role: '',
      dataNascimento: '',
      idade: undefined,
      telefone: '',
      whatsapp: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      endereco: '',
      chavePix: '',
      tempoExperiencia: '',
      experienciaComorbidadesList: [''],
      cpfPacienteResponsavel: '',
      tipoChavePix: 'CPF',
      login: '',
      password: ''
    };
  }
}
