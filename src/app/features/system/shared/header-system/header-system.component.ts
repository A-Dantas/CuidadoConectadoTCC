import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { UsuarioService, Usuario } from '../../../system/gestor/usuario.service';
import { PacienteService, Paciente } from '../../../system/gestor/paciente.service';
import { ChatService, MensagemGeral, MensagemDireta, MapaMensagensDiretas } from '../services/chat.service';
import { SidebarService } from '../services/sidebar.service';

@Component({
  selector: 'app-header-system',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './header-system.component.html',
  styleUrl: './header-system.component.css'
})
export class HeaderSystemComponent implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private pacienteService = inject(PacienteService);
  private chatService = inject(ChatService);
  private sidebarService = inject(SidebarService);
  private cdr = inject(ChangeDetectorRef);

  chatAberto: boolean = false;
  abaAtiva: 'geral' | 'diretas' = 'geral';
  mensagemTexto: string = '';

  // Mensagens
  mensagensGerais: MensagemGeral[] = [];
  mapaMensagensDiretas: MapaMensagensDiretas = {};

  // Usuários e pacientes
  usuarios: Usuario[] = [];
  pacientes: Paciente[] = [];
  pacienteSelecionado: Paciente | null = null;
  usuarioSelecionado: Usuario | null = null;

  // Usuários filtrados por paciente
  usuariosFiltrados: Usuario[] = [];

  ngOnInit(): void {
    this.carregarDadosUsuarioLogado();

    this.usuarioService.getUsuarios().subscribe(usuarios => {
      this.usuarios = usuarios;
      // Se for um usuário comum, recarrega os dados para garantir sincronia com a lista global
      if (!this.isGestor) {
        this.carregarDadosUsuarioLogado();
      }
    });

    this.pacienteService.getPacientes().subscribe(pacientes => {
      this.pacientes = pacientes;
    });

    // Subscribe to general messages
    this.chatService.mensagensGerais$.subscribe(mensagens => {
      this.mensagensGerais = mensagens;
      this.cdr.detectChanges();
    });

    // Subscribe to direct messages
    this.chatService.mensagensDiretas$.subscribe(mapa => {
      this.mapaMensagensDiretas = mapa;
      this.cdr.detectChanges();
    });
  }

  carregarDadosUsuarioLogado(): void {
    if (this.isGestor) {
      const dadosSalvos = this.authService.getDadosGestor();
      this.dadosGestor = { ...dadosSalvos, senha: '', fotoPerfil: dadosSalvos.fotoPerfil || '' };
    } else {
      const user = this.authService.getUsuarioLogadoCompleto();
      if (user) {
        this.dadosGestor = {
          nome: user.userName,
          email: user.email,
          telefone: user.telefone || '',
          senha: '',
          fotoPerfil: user.fotoPerfil || ''
        };
      }
    }
    this.perfilEditando = { ...this.dadosGestor };
    this.cdr.detectChanges();
  }

  logout(): void {
    this.authService.sair();
  }

  toggleChat(): void {
    this.chatAberto = !this.chatAberto;
    // Força a aba inicial para 'diretas' se for familiar, proibindo o acesso à geral
    if (this.chatAberto && this.usuarioCargo === 'Responsável Familiar') {
        this.abaAtiva = 'diretas';
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  mudarAba(aba: 'geral' | 'diretas'): void {
    if (aba === 'geral' && this.usuarioCargo === 'Responsável Familiar') return; // Bloqueia totalmente
    this.abaAtiva = aba;
    this.usuarioSelecionado = null;
    this.pacienteSelecionado = null;
    this.usuariosFiltrados = [];
  }

  selecionarPaciente(event: any): void {
    const nomePaciente = event.target.value;
    if (!nomePaciente) {
      this.pacienteSelecionado = null;
      this.usuariosFiltrados = [];
      return;
    }

    this.pacienteSelecionado = this.pacientes.find(p => p.nomePaciente === nomePaciente) || null;

    if (this.pacienteSelecionado) {
      // Identificar quem está logado para removê-lo da lista
      const usuarioLogadoNome = this.isGestor ? 'Gestor' : this.authService.getUsuarioLogadoCompleto()?.userName;

      // Filtrar usuários relacionados ao paciente (removendo a si mesmo)
      let filtrados = this.usuarios.filter(u =>
        (u.userName === this.pacienteSelecionado!.cuidadorAtribuido ||
         u.userName === this.pacienteSelecionado!.medicoAtribuido ||
         u.userName === this.pacienteSelecionado!.contatoFamiliar) &&
        u.userName !== usuarioLogadoNome
      );

      // Adiciona o Gestor na lista manualmente para cuidadores/familiares poderem enviar mensagens
      if (!this.isGestor) {
        filtrados.push({
          userName: 'Gestor',
          role: 'Gestor',
          sobrenome: '',
          email: 'admin@cuidado.com',
          dataNascimento: '',
          telefone: '',
          rua: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          endereco: '',
          whatsapp: ''
        } as Usuario);
      }

      this.usuariosFiltrados = filtrados;
    }
  }

  selecionarUsuario(usuario: Usuario): void {
    this.usuarioSelecionado = usuario;
    this.chatService.marcarComoLidas(usuario.userName);
  }

  voltarListaUsuarios(): void {
    this.usuarioSelecionado = null;
  }

  onKeyDown(event: KeyboardEvent): void {
    // Ctrl+Enter or Cmd+Enter to send message
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.enviarMensagem();
    }
  }

  enviarMensagem(): void {
    if (this.mensagemTexto.trim()) {
      const agora = new Date();
      const hora = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
      const data = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

      const novaMensagem = {
        texto: this.mensagemTexto,
        autor: 'Você',
        hora: hora,
        data: data,
        lida: true
      };

      if (this.abaAtiva === 'geral') {
        this.chatService.adicionarMensagemGeral(novaMensagem);
      } else if (this.usuarioSelecionado) {
        this.chatService.adicionarMensagemDireta(this.usuarioSelecionado.userName, novaMensagem);
      }

      this.mensagemTexto = '';
    }
  }

  getMensagensAtivas(): (MensagemGeral | MensagemDireta)[] {
    if (this.abaAtiva === 'geral') {
      return this.mensagensGerais;
    } else if (this.usuarioSelecionado) {
      return this.mapaMensagensDiretas[this.usuarioSelecionado.userName] || [];
    }
    return [];
  }

  getNumeroMensagensNaoLidas(usuarioId: string): number {
    const mensagens = this.mapaMensagensDiretas[usuarioId] || [];
    return mensagens.filter(msg => !msg.lida && msg.autor !== 'Você').length;
  }

  get podeEnviarMensagem(): boolean {
    if (this.abaAtiva === 'geral') {
      return this.authService.perfil() === 'gestor';
    }
    return !!this.usuarioSelecionado;
  }

  // --- Gerenciamento Unificado de Modais ---
  // Estados possíveis: 'fechado', 'perfil', 'sucesso'
  estadoModal: 'fechado' | 'perfil' | 'sucesso' = 'fechado';

  // Dados simulados do Gestor (estado local)
  dadosGestor = {
    nome: 'Administrador',
    email: 'admin@cuidado.com',
    telefone: '(11) 99999-9999',
    senha: '',
    fotoPerfil: ''
  };

  // Objeto temporário para edição
  perfilEditando = { ...this.dadosGestor };

  // Propriedades do usuário logado
  get usuarioNome(): string {
    return this.dadosGestor.nome || 'Usuário';
  }

  get usuarioEmail(): string {
    return this.dadosGestor.email || 'usuario@cuidado.com';
  }

  get usuarioCargo(): string {
    const perfil = this.authService.perfil();
    if (perfil === 'gestor') return 'Gestor';
    if (perfil === 'Family Member') return 'Responsável Familiar';
    if (perfil === 'Doctor') return 'Médico';
    if (perfil === 'Caregiver') return 'Cuidador';
    return perfil || 'Visitante';
  }

  get isGestor(): boolean {
    return this.authService.perfil() === 'gestor';
  }

  // Métodos
  abrirModalPerfil(): void {
    this.carregarDadosUsuarioLogado();
    this.estadoModal = 'perfil';
  }

  fecharModal(): void {
    this.estadoModal = 'fechado';
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
        this.perfilEditando.fotoPerfil = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  salvarPerfil(): void {
    // Atualiza dados locais
    this.dadosGestor = { ...this.perfilEditando };

    if (this.isGestor) {
      // Atualiza dados persistidos no AuthService (localStorage)
      this.authService.atualizarDadosGestor({
        nome: this.perfilEditando.nome,
        email: this.perfilEditando.email,
        telefone: this.perfilEditando.telefone,
        fotoPerfil: this.perfilEditando.fotoPerfil
      });

      // Se houve alteração de senha, atualiza no serviço de autenticação
      if (this.perfilEditando.senha && this.perfilEditando.senha.trim() !== '') {
        this.authService.atualizarSenhaGestor(this.perfilEditando.senha);
      }
    } else {
      const login = this.authService.getUsuarioAtualLogin();
      if (login) {
        const novosDados: Partial<Usuario> = {
          userName: this.perfilEditando.nome,
          email: this.perfilEditando.email,
          telefone: this.perfilEditando.telefone,
          fotoPerfil: this.perfilEditando.fotoPerfil
        };

        if (this.perfilEditando.senha && this.perfilEditando.senha.trim() !== '') {
          novosDados.password = this.perfilEditando.senha;
        }

        this.usuarioService.atualizarPerfilPorLogin(login, novosDados);
      }
    }

    // Limpa a senha do objeto para segurança e UX
    this.perfilEditando.senha = '';
    this.dadosGestor.senha = '';

    console.log('Perfil atualizado:', this.dadosGestor);

    // Transição imediata para sucesso
    this.estadoModal = 'sucesso';
    this.cdr.detectChanges();

    // Fecha automaticamente após 3 segundos
    setTimeout(() => {
      // Só fecha se ainda estiver no estado de sucesso (previne bugs de UI)
      if (this.estadoModal === 'sucesso') {
        this.fecharModal();
        this.cdr.detectChanges();
      }
    }, 3000);
  }

}
