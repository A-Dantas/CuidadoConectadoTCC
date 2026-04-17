import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PacienteService, Paciente } from '../paciente.service';
import { UsuarioService, Usuario } from '../usuario.service';
import { ChatService, MensagemGeral } from '../../shared/services/chat.service';
import { EvolutionService, EvolutionEntry } from '../../../../core/services/evolution.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu1',
  imports: [FormsModule, CommonModule],
  templateUrl: './menu1.component.html',
  styleUrl: './menu1.component.css'
})
export class Menu1Component implements OnInit, OnDestroy {
  modalAberto: boolean = false;
  modalSucessoAberto: boolean = false;
  modalUsuarioAberto: boolean = false;
  modalSucessoUsuarioAberto: boolean = false;
  modalLinkCadastroAberto: boolean = false;
  tipoUsuarioLink: string = '';
  modalCpfExistenteGestor: boolean = false;

  quantidadePacientes: number = 0;
  quantidadeUsuarios: number = 0;
  mensagensGeraisRecentes: MensagemGeral[] = [];
  mensagensGeraisHistorico: MensagemGeral[] = [];
  mostrarHistoricoGeral: boolean = false;
  private subscription: Subscription = new Subscription();

  // Double-click tracking
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

  // Cadastro rápido
  mostrarCadastroCuidador: boolean = false;
  mostrarCadastroMedico: boolean = false;
  mostrarCadastroFamiliar: boolean = false;

  novoPaciente: Paciente = {
    nomePaciente: '',
    cpf: '',
    dataNascimento: '',
    idade: null,
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    comorbidades: '',
    cuidadorAtribuido: '',
    medicoAtribuido: '',
    contatoFamiliar: ''
  };

  comorbidadesList: string[] = [''];

  novoUsuario: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: 'Caregiver',
    dataNascimento: '',
    idade: undefined,
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    chavePix: '',
    whatsapp: '',
    tempoExperiencia: '',
    experienciaComorbidades: '',
    tipoUsuario: '',
    experienciaComorbidadesList: ['']
  };

  experienciaComorbidadesUsuarioList: string[] = [''];

  novoCuidador: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: 'Caregiver',
    dataNascimento: '',
    idade: undefined,
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    chavePix: '',
    whatsapp: '',
    tempoExperiencia: '',
    experienciaComorbidades: ''
  };

  novoMedico: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: 'Doctor',
    dataNascimento: '',
    idade: undefined,
    telefone: '',
    whatsapp: ''
  } as Usuario;

  novoFamiliar: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: 'Family Member',
    dataNascimento: '',
    idade: undefined,
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    whatsapp: '',
    cpfPacienteResponsavel: ''
  } as Usuario;



  errosPaciente: any = {};
  errosUsuario: any = {};
  errosCuidador: any = {};
  errosMedico: any = {};
  errosFamiliar: any = {};
  emailInvalidoUsuario: boolean = false;
  emailInvalidoMedico: boolean = false;
  emailInvalidoCuidador: boolean = false;
  emailInvalidoFamiliar: boolean = false;

  experienciaComorbidadesList: string[] = [''];

  cuidadores: string[] = [];
  medicos: string[] = [];
  familiares: string[] = [];
  roles: string[] = ['Caregiver', 'Doctor', 'Family Member'];

  constructor(
    private pacienteService: PacienteService,
    private usuarioService: UsuarioService,
    private chatService: ChatService,
    private evolutionService: EvolutionService
  ) { }

  onFotoSelecionada(event: any, objeto: any): void {
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
        objeto.fotoPerfil = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  validarData(data: string | undefined): boolean {
    if (!data) return false;
    // Formato esperado: DD/MM/AAAA
    const partes = data.split('/');
    if (partes.length !== 3) return false;
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]);
    const ano = parseInt(partes[2]);
    
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
    if (ano < 1900 || ano > 9999) return false;
    if (mes < 1 || mes > 12) return false;
    
    const diasNoMes = new Date(ano, mes, 0).getDate();
    return dia >= 1 && dia <= diasNoMes;
  }

  // Helper para converter string DD/MM/AAAA em objeto Date
  parseDataBR(dataBR: string): Date | null {
    const partes = dataBR.split('/');
    if (partes.length !== 3) return null;
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Meses em JS são 0-indexed
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

  // Validação de nome - não permite números
  validarNome(event: any, campo: string, objeto: any): void {
    const valor = event.target.value;
    const valorSemNumeros = valor.replace(/[0-9]/g, '');
    objeto[campo] = valorSemNumeros;
    event.target.value = valorSemNumeros;
  }

  // Validação de email - verifica se contém @
  validarEmail(email: string): boolean {
    return email.includes('@');
  }

  // Validação de email em tempo real para o formulário de usuário
  validarEmailUsuario(valor?: string): void {
    const emailToCheck = valor !== undefined ? valor : this.novoUsuario?.email;

    if (!this.novoUsuario || !emailToCheck) {
      this.emailInvalidoUsuario = false;
      return;
    }

    const email = emailToCheck.trim();
    if (email.length > 0) {
      this.emailInvalidoUsuario = !email.includes('@');
      this.errosUsuario.email = false; // Limpa erro de obrigatório
    } else {
      this.emailInvalidoUsuario = false;
    }
  }

  validarEmailMedico(valor?: string): void {
    const emailToCheck = valor !== undefined ? valor : this.novoMedico?.email;

    if (!this.novoMedico || !emailToCheck) {
      this.emailInvalidoMedico = false;
      return;
    }

    const email = emailToCheck.trim();
    if (email.length > 0) {
      this.emailInvalidoMedico = !email.includes('@');
      this.errosMedico.email = false; // Limpa erro de obrigatório
    } else {
      this.emailInvalidoMedico = false;
    }
  }

  validarEmailCuidador(valor?: string): void {
    const emailToCheck = valor !== undefined ? valor : this.novoCuidador?.email;

    if (!this.novoCuidador || !emailToCheck) {
      this.emailInvalidoCuidador = false;
      return;
    }

    const email = emailToCheck.trim();
    if (email.length > 0) {
      this.emailInvalidoCuidador = !email.includes('@');
      this.errosCuidador.email = false; // Limpa erro de obrigatório
    } else {
      this.emailInvalidoCuidador = false;
    }
  }

  validarEmailFamiliar(valor?: string): void {
    const emailToCheck = valor !== undefined ? valor : this.novoFamiliar?.email;

    if (!this.novoFamiliar || !emailToCheck) {
      this.emailInvalidoFamiliar = false;
      return;
    }

    const email = emailToCheck.trim();
    if (email.length > 0) {
      this.emailInvalidoFamiliar = !email.includes('@');
      this.errosFamiliar.email = false; // Limpa erro de obrigatório
    } else {
      this.emailInvalidoFamiliar = false;
    }
  }

  // Formatação de telefone - (XX) XXXXX-XXXX
  formatarTelefone(event: any, campo: string, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito

    if (valor.length > 11) {
      valor = valor.substring(0, 11); // Limita a 11 dígitos
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

  formatarDataBR(event: any, campo: string, objeto: any, callback?: Function): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }
    
    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = valor.substring(0, 2);
    if (valor.length >= 3) valorFormatado += '/' + valor.substring(2, 4);
    if (valor.length >= 5) valorFormatado += '/' + valor.substring(4, 8);
    
    objeto[campo] = valorFormatado;
    event.target.value = valorFormatado;
    
    if (callback) callback();
  }

  atualizarIdadePaciente(): void {
    this.novoPaciente.idade = this.calcularIdade(this.novoPaciente.dataNascimento) ?? null;
  }

  atualizarIdadeUsuario(): void {
    this.novoUsuario.idade = this.calcularIdade(this.novoUsuario.dataNascimento);
  }

  atualizarIdadeMedico(): void {
    this.novoMedico.idade = this.calcularIdade(this.novoMedico.dataNascimento);
  }

  atualizarIdadeFamiliar(): void {
    this.novoFamiliar.idade = this.calcularIdade(this.novoFamiliar.dataNascimento);
  }

  atualizarIdadeCuidador(): void {
    this.novoCuidador.idade = this.calcularIdade(this.novoCuidador.dataNascimento);
  }

  ngOnInit(): void {
    this.subscription.add(
      this.pacienteService.getPacientes().subscribe(pacientes => {
        this.quantidadePacientes = pacientes.length;
      })
    );

    this.subscription.add(
      this.usuarioService.getUsuarios().subscribe(usuarios => {
        this.quantidadeUsuarios = usuarios.length;
        this.atualizarListasUsuarios(usuarios);
      })
    );

    // Subscribe to chat general entries
    this.subscription.add(
      this.chatService.mensagensGerais$.subscribe(mensagens => {
        const agora = new Date();
        const gestorMensagens = mensagens; // As we said, we assume gestor messages are here, or filter if needed. Actually we want all from "geral"

        this.mensagensGeraisRecentes = [];
        this.mensagensGeraisHistorico = [];

        // Reverse to show newest first
        const reversed = [...gestorMensagens].reverse();

        for (const msg of reversed) {
           let msgDateStr = msg.data;
           let msgTimeStr = msg.hora;
           
           if (!msgDateStr) {
              // fallback if missing data
              msgDateStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;
           }

           const [d, m, y] = msgDateStr.split('/');
           const [hora, min] = msgTimeStr ? msgTimeStr.split(':') : ['0', '0'];

           const msgDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hora), parseInt(min));
           
           // diff in ms
           const diff = agora.getTime() - msgDate.getTime();
           const hoursDiff = diff / (1000 * 60 * 60);

           if (hoursDiff <= 24) {
               this.mensagensGeraisRecentes.push(msg);
           } else {
               this.mensagensGeraisHistorico.push(msg);
           }
        }
      })
    );
  }

  toggleHistoricoGeral(): void {
    this.mostrarHistoricoGeral = !this.mostrarHistoricoGeral;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  atualizarListasUsuarios(usuarios: Usuario[]): void {
    this.cuidadores = usuarios
      .filter(u => u.role === 'Caregiver')
      .map(u => u.userName);

    this.medicos = usuarios
      .filter(u => u.role === 'Doctor')
      .map(u => u.userName);

    this.familiares = usuarios
      .filter(u => u.role === 'Family Member')
      .map(u => u.userName);
  }

  handleOverlayClick(): void {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - this.lastClickTime;

    if (timeDiff < this.DOUBLE_CLICK_DELAY) {
      // Double-click detected
      if (this.modalAberto) this.fecharModal();
      else if (this.modalUsuarioAberto) this.fecharModalUsuario();
      else if (this.modalSucessoAberto) this.fecharModalSucesso();
      else if (this.modalSucessoUsuarioAberto) this.fecharModalSucessoUsuario();
      else if (this.modalLinkCadastroAberto) this.fecharModalLinkCadastro();
    }

    this.lastClickTime = currentTime;
  }

  selecionarOpcaoCuidador(event: any): void {
    const valor = event.target.value;
    if (valor === 'CADASTRAR_NOVO') {
      this.mostrarCadastroCuidador = true;
      this.novoPaciente.cuidadorAtribuido = '';
    } else {
      this.mostrarCadastroCuidador = false;
      this.novoPaciente.cuidadorAtribuido = valor;
    }
  }

  salvarNovoCuidador(): void {
    this.errosCuidador = {};

    if (!this.novoCuidador.userName?.trim()) this.errosCuidador.userName = true;
    if (!this.novoCuidador.sobrenome?.trim()) this.errosCuidador.sobrenome = true;
    if (!this.novoCuidador.telefone?.trim()) this.errosCuidador.telefone = true;
    if (!this.novoCuidador.email?.trim()) this.errosCuidador.email = true;
    if (!this.novoCuidador.whatsapp?.trim()) this.errosCuidador.whatsapp = true;
    if (!this.novoCuidador.tempoExperiencia?.trim()) this.errosCuidador.tempoExperiencia = true;

    if (Object.keys(this.errosCuidador).length > 0) return;

    if (this.novoCuidador.userName.trim() && this.novoCuidador.email.trim()) {
      // Validação de email
      if (!this.validarEmail(this.novoCuidador.email)) {
        this.emailInvalidoCuidador = true;
        return;
      }

      // Validação de data (opcional para cuidador, mas se preenchida deve ser válida)
      if (this.novoCuidador.dataNascimento && !this.validarData(this.novoCuidador.dataNascimento)) {
        alert('Data de nascimento inválida. O ano deve ter 4 dígitos e ser a partir de 1900.');
        return;
      }

      // Gerar endereço completo
      const enderecoCompleto = [
        this.novoCuidador.rua,
        this.novoCuidador.numero,
        this.novoCuidador.bairro,
        this.novoCuidador.cidade,
        this.novoCuidador.estado
      ].filter(part => part && part.trim()).join(', ');

      this.novoCuidador.endereco = enderecoCompleto;

      // Gerar string de comorbidades de experiência
      const comorbidadesValidas = this.experienciaComorbidadesList
        .map(c => c.trim())
        .filter(c => c.length > 0);
      this.novoCuidador.experienciaComorbidades = comorbidadesValidas.join(', ');
      this.novoCuidador.experienciaComorbidadesList = comorbidadesValidas; // Salvar array também

      // Adicionar usuário
      this.usuarioService.adicionarUsuario({ ...this.novoCuidador });

      // Atribuir ao paciente
      this.novoPaciente.cuidadorAtribuido = this.novoCuidador.userName;

      // Ocultar seção e resetar
      this.mostrarCadastroCuidador = false;
      this.resetarFormularioCuidador();
    }
  }

  cancelarCadastroCuidador(): void {
    this.mostrarCadastroCuidador = false;
    this.resetarFormularioCuidador();
  }

  selecionarOpcaoMedico(event: any): void {
    const valor = event.target.value;
    if (valor === 'CADASTRAR_NOVO') {
      this.mostrarCadastroMedico = true;
      this.novoPaciente.medicoAtribuido = '';
    } else {
      this.mostrarCadastroMedico = false;
      this.novoPaciente.medicoAtribuido = valor;
    }
  }

  salvarNovoMedico(): void {
    this.errosMedico = {};

    if (!this.novoMedico.userName?.trim()) this.errosMedico.userName = true;
    if (!this.novoMedico.sobrenome?.trim()) this.errosMedico.sobrenome = true;
    if (!this.novoMedico.telefone?.trim()) this.errosMedico.telefone = true;
    if (!this.novoMedico.whatsapp?.trim()) this.errosMedico.whatsapp = true;
    if (!this.novoMedico.email?.trim()) this.errosMedico.email = true;

    if (Object.keys(this.errosMedico).length > 0) return;

    if (this.novoMedico.userName.trim() && this.novoMedico.email.trim()) {
      // Validação de email
      if (!this.validarEmail(this.novoMedico.email)) {
        this.emailInvalidoMedico = true;
        return;
      }

      this.usuarioService.adicionarUsuario({ ...this.novoMedico });
      this.novoPaciente.medicoAtribuido = this.novoMedico.userName;
      this.mostrarCadastroMedico = false;
      this.resetarFormularioMedico();
    }
  }

  cancelarCadastroMedico(): void {
    this.mostrarCadastroMedico = false;
    this.resetarFormularioMedico();
  }

  resetarFormularioMedico(): void {
    this.errosMedico = {};
    this.emailInvalidoMedico = false;
    this.novoMedico = {
      userName: '',
      sobrenome: '',
      email: '',
      role: 'Doctor',
      dataNascimento: '',
      idade: undefined,
      telefone: '',
      whatsapp: ''
    } as Usuario;
  }

  selecionarOpcaoFamiliar(event: any): void {
    const valor = event.target.value;
    if (valor === 'CADASTRAR_NOVO') {
      this.mostrarCadastroFamiliar = true;
      this.novoPaciente.contatoFamiliar = '';
    } else {
      this.mostrarCadastroFamiliar = false;
      this.novoPaciente.contatoFamiliar = valor;
    }
  }

  salvarNovoFamiliar(): void {
    this.errosFamiliar = {};

    if (!this.novoFamiliar.userName?.trim()) this.errosFamiliar.userName = true;
    if (!this.novoFamiliar.sobrenome?.trim()) this.errosFamiliar.sobrenome = true;
    if (!this.novoFamiliar.dataNascimento) this.errosFamiliar.dataNascimento = true;
    if (!this.novoFamiliar.telefone?.trim()) this.errosFamiliar.telefone = true;
    if (!this.novoFamiliar.whatsapp?.trim()) this.errosFamiliar.whatsapp = true;
    if (!this.novoFamiliar.email?.trim()) this.errosFamiliar.email = true;
    if (!this.novoFamiliar.rua?.trim()) this.errosFamiliar.rua = true;
    if (!this.novoFamiliar.numero?.trim()) this.errosFamiliar.numero = true;
    if (!this.novoFamiliar.bairro?.trim()) this.errosFamiliar.bairro = true;
    if (!this.novoFamiliar.cidade?.trim()) this.errosFamiliar.cidade = true;
    if (!this.novoFamiliar.estado?.trim()) this.errosFamiliar.estado = true;

    if (Object.keys(this.errosFamiliar).length > 0) return;

    if (this.novoFamiliar.userName.trim() && this.novoFamiliar.email.trim()) {
      // Validação de email
      if (!this.validarEmail(this.novoFamiliar.email)) {
        this.emailInvalidoFamiliar = true;
        return;
      }
      if (!this.novoFamiliar.cpfPacienteResponsavel || this.novoFamiliar.cpfPacienteResponsavel.length < 14) {
        alert('CPF do Idoso é obrigatório para o cadastro de familiar.');
        return;
      }

      if (this.novoFamiliar.dataNascimento && !this.validarData(this.novoFamiliar.dataNascimento)) {
        alert('Data de nascimento inválida. O ano deve ter 4 dígitos e ser a partir de 1900.');
        return;
      }
      // Gerar endereço completo
      const enderecoCompleto = [
        this.novoFamiliar.rua,
        this.novoFamiliar.numero,
        this.novoFamiliar.bairro,
        this.novoFamiliar.cidade,
        this.novoFamiliar.estado
      ].filter(part => part && part.trim()).join(', ');

      this.novoFamiliar.endereco = enderecoCompleto;

      this.usuarioService.adicionarUsuario({ ...this.novoFamiliar });
      this.novoPaciente.contatoFamiliar = this.novoFamiliar.userName;
      this.mostrarCadastroFamiliar = false;
      this.resetarFormularioFamiliar();
    }
  }

  cancelarCadastroFamiliar(): void {
    this.mostrarCadastroFamiliar = false;
    this.resetarFormularioFamiliar();
  }

  resetarFormularioFamiliar(): void {
    this.errosFamiliar = {};
    this.emailInvalidoFamiliar = false;
    this.novoFamiliar = {
      userName: '',
      sobrenome: '',
      email: '',
      role: 'Family Member',
      dataNascimento: '',
      idade: undefined,
      telefone: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      endereco: '',
      whatsapp: ''
    } as Usuario;
  }

  resetarFormularioCuidador(): void {
    this.errosCuidador = {};
    this.emailInvalidoCuidador = false;
    this.novoCuidador = {
      userName: '',
      sobrenome: '',
      email: '',
      role: 'Caregiver',
      dataNascimento: '',
      idade: undefined,
      telefone: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      endereco: '',
      chavePix: '',
      whatsapp: '',
      tempoExperiencia: '',
      experienciaComorbidades: ''
    };
    this.experienciaComorbidadesList = [''];
  }

  adicionarExperienciaComorbidade(): void {
    this.experienciaComorbidadesList.push('');
  }

  removerExperienciaComorbidade(index: number): void {
    if (this.experienciaComorbidadesList.length > 1) {
      this.experienciaComorbidadesList.splice(index, 1);
    }
  }

  // Métodos para comorbidades do modal de usuário principal
  adicionarExperienciaComorbidadeUsuario(): void {
    if (!this.novoUsuario.experienciaComorbidadesList) {
      this.novoUsuario.experienciaComorbidadesList = [''];
    }
    this.novoUsuario.experienciaComorbidadesList.push('');
  }

  removerExperienciaComorbidadeUsuario(index: number): void {
    if (this.novoUsuario.experienciaComorbidadesList && this.novoUsuario.experienciaComorbidadesList.length > 1) {
      this.novoUsuario.experienciaComorbidadesList.splice(index, 1);
    }
  }

  abrirModal(): void {
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.resetarFormulario();
  }

  resetarFormulario(): void {
    this.errosPaciente = {};
    this.errosUsuario = {};
    this.novoPaciente = {
      nomePaciente: '',
      dataNascimento: '',
      idade: null,
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      endereco: '',
      comorbidades: '',
      cuidadorAtribuido: '',
      medicoAtribuido: '',
      contatoFamiliar: ''
    };
    this.comorbidadesList = [''];
    this.mostrarCadastroCuidador = false;
    this.mostrarCadastroMedico = false;
    this.mostrarCadastroFamiliar = false;
    this.resetarFormularioCuidador();
    this.resetarFormularioMedico();
    this.resetarFormularioFamiliar();
  }

  adicionarComorbidade(): void {
    this.comorbidadesList.push('');
  }

  removerComorbidade(index: number): void {
    if (this.comorbidadesList.length > 1) {
      this.comorbidadesList.splice(index, 1);
    }
  }

  adicionarPaciente(): void {
    // Resetar erros
    this.errosPaciente = {};

    // Validação de campos obrigatórios
    if (!this.novoPaciente.nomePaciente.trim()) this.errosPaciente.nomePaciente = true;
    if (!this.novoPaciente.cpf || this.novoPaciente.cpf.length < 14) this.errosPaciente.cpf = true;
    if (!this.novoPaciente.dataNascimento || !this.validarData(this.novoPaciente.dataNascimento)) this.errosPaciente.dataNascimento = true;
    if (this.novoPaciente.idade === undefined || this.novoPaciente.idade === null) this.errosPaciente.idade = true;
    if (!this.novoPaciente.rua.trim()) this.errosPaciente.rua = true;
    if (!this.novoPaciente.numero.trim()) this.errosPaciente.numero = true;
    if (!this.novoPaciente.bairro.trim()) this.errosPaciente.bairro = true;
    if (!this.novoPaciente.cidade.trim()) this.errosPaciente.cidade = true;
    if (!this.novoPaciente.estado.trim()) this.errosPaciente.estado = true;
    if (!this.novoPaciente.contatoFamiliar) this.errosPaciente.contatoFamiliar = true;

    // Se houver erros, interrompe o processo
    if (Object.keys(this.errosPaciente).length > 0) {
      return;
    }

    const pacientes = this.pacienteService.getPacientesValue();
    const cpfDuplicado = pacientes.some(p => p.cpf === this.novoPaciente.cpf);

    if (cpfDuplicado) {
      this.modalCpfExistenteGestor = true;
      return;
    }

    if (this.novoPaciente.nomePaciente.trim()) {
      // Gerar endereço completo
      const enderecoCompleto = [
        this.novoPaciente.rua,
        this.novoPaciente.numero,
        this.novoPaciente.bairro,
        this.novoPaciente.cidade,
        this.novoPaciente.estado
      ].filter(part => part.trim()).join(', ');

      this.novoPaciente.endereco = enderecoCompleto;

      // Gerar string de comorbidades
      const comorbidadesValidas = this.comorbidadesList
        .map(c => c.trim())
        .filter(c => c.length > 0);
      this.novoPaciente.comorbidades = comorbidadesValidas.join(', ');

      this.pacienteService.adicionarPaciente({ ...this.novoPaciente });
      this.fecharModal();
      this.modalSucessoAberto = true;
    }
  }

  fecharModalSucesso(): void {
    this.modalSucessoAberto = false;
  }

  fecharModalCpfGestor(): void {
    this.modalCpfExistenteGestor = false;
  }

  formatarCPF(event: any, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = valor.substring(0, 3);
    if (valor.length >= 4) valorFormatado += '.' + valor.substring(3, 6);
    if (valor.length >= 7) valorFormatado += '.' + valor.substring(6, 9);
    if (valor.length >= 10) valorFormatado += '-' + valor.substring(9, 11);
    
    objeto.cpf = valorFormatado;
    event.target.value = valorFormatado;
  }

  formatFirstAndLastName(fullName: string): string {
    if (!fullName) return 'Não informado';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  getPatientData(cpf: string): any {
    const pacientes = this.pacienteService.getPacientesValue();
    const paciente = pacientes.find(p => p.cpf === cpf);
    if (!paciente) return { nome: 'Desconhecido', familiar: 'Não informado', telefone: 'Não informado' };

    const familiarName = paciente.contatoFamiliar;
    let familiarPhone = 'Não informado';
    let formattedFamiliar = 'Não informado';

    if (familiarName) {
      const usuarios = this.usuarioService.getUsuariosAtuais();
      const familiar = usuarios.find(u => u.userName === familiarName && u.role === 'Family Member');
      
      let fullFamiliarName = familiarName;
      if (familiar && familiar.sobrenome) {
          fullFamiliarName = `${familiarName} ${familiar.sobrenome}`;
      } else if (familiar && familiar.userName) {
          fullFamiliarName = familiar.userName;
      }
      formattedFamiliar = this.formatFirstAndLastName(fullFamiliarName);

      if (familiar && familiar.telefone) {
        familiarPhone = familiar.telefone;
      }
    }

    return {
      nome: this.formatFirstAndLastName(paciente.nomePaciente),
      familiar: formattedFamiliar,
      telefone: familiarPhone
    };
  }

  verificarCpfExistenteGestor(): void {
    if (!this.novoPaciente.cpf || this.novoPaciente.cpf.length < 14) return;
    
    const pacientes = this.pacienteService.getPacientesValue();
    const existe = pacientes.some(p => p.cpf === this.novoPaciente.cpf);
    
    if (existe) {
      this.errosPaciente.cpf = true;
      this.modalCpfExistenteGestor = true;
    } else {
      this.errosPaciente.cpf = false;
    }
  }

  abrirModalUsuario(): void {
    this.novoUsuario.tipoUsuario = 'cuidador';
    this.modalUsuarioAberto = true;
  }

  fecharModalUsuario(): void {
    this.modalUsuarioAberto = false;
    this.resetarFormularioUsuario();
  }

  resetarFormularioUsuario(): void {
    this.errosUsuario = {};
    this.emailInvalidoUsuario = false;
    this.novoUsuario = {
      userName: '',
      sobrenome: '',
      email: '',
      role: 'Caregiver',
      dataNascimento: '',
      idade: undefined,
      telefone: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      endereco: '',
      chavePix: '',
      whatsapp: '',
      tempoExperiencia: '',
      experienciaComorbidades: '',
      tipoUsuario: '',
      experienciaComorbidadesList: ['']
    };
    this.experienciaComorbidadesUsuarioList = [''];
  }

  adicionarUsuario(): void {
    this.errosUsuario = {};

    // Validações Comuns
    if (!this.novoUsuario.userName?.trim()) this.errosUsuario.userName = true;
    if (!this.novoUsuario.sobrenome?.trim()) this.errosUsuario.sobrenome = true;
    if (!this.novoUsuario.email?.trim()) this.errosUsuario.email = true;

    if (this.novoUsuario.tipoUsuario === 'cuidador') {
      if (!this.novoUsuario.dataNascimento) this.errosUsuario.dataNascimento = true;
      if (!this.novoUsuario.telefone?.trim()) this.errosUsuario.telefone = true;
      if (!this.novoUsuario.whatsapp?.trim()) this.errosUsuario.whatsapp = true;
      if (!this.novoUsuario.rua?.trim()) this.errosUsuario.rua = true;
      if (!this.novoUsuario.numero?.trim()) this.errosUsuario.numero = true;
      if (!this.novoUsuario.bairro?.trim()) this.errosUsuario.bairro = true;
      if (!this.novoUsuario.cidade?.trim()) this.errosUsuario.cidade = true;
      if (!this.novoUsuario.estado?.trim()) this.errosUsuario.estado = true;
      if (!this.novoUsuario.chavePix?.trim()) this.errosUsuario.chavePix = true;
      if (!this.novoUsuario.tempoExperiencia?.trim()) this.errosUsuario.tempoExperiencia = true;
    } else if (this.novoUsuario.tipoUsuario === 'medico') {
      if (!this.novoUsuario.whatsapp?.trim()) this.errosUsuario.whatsapp = true;
    } else if (this.novoUsuario.tipoUsuario === 'familiar') {
      if (!this.novoUsuario.dataNascimento) this.errosUsuario.dataNascimento = true;
      if (!this.novoUsuario.cpfPacienteResponsavel || this.novoUsuario.cpfPacienteResponsavel.length < 14) this.errosUsuario.cpfPacienteResponsavel = true;
      if (!this.novoUsuario.telefone?.trim()) this.errosUsuario.telefone = true;
      if (!this.novoUsuario.whatsapp?.trim()) this.errosUsuario.whatsapp = true;
      if (!this.novoUsuario.rua?.trim()) this.errosUsuario.rua = true;
      if (!this.novoUsuario.numero?.trim()) this.errosUsuario.numero = true;
      if (!this.novoUsuario.bairro?.trim()) this.errosUsuario.bairro = true;
      if (!this.novoUsuario.cidade?.trim()) this.errosUsuario.cidade = true;
      if (!this.novoUsuario.estado?.trim()) this.errosUsuario.estado = true;
    }

    if (Object.keys(this.errosUsuario).length > 0) return;

    if (this.novoUsuario.userName.trim() && this.novoUsuario.email.trim()) {
      // Validação de email
      if (!this.validarEmail(this.novoUsuario.email)) {
        this.emailInvalidoUsuario = true;
        return;
      }

      if (this.novoUsuario.dataNascimento && !this.validarData(this.novoUsuario.dataNascimento)) {
        alert('Data de nascimento inválida. O ano deve ter 4 dígitos e ser a partir de 1900.');
        return;
      }
      // Gerar endereço completo
      const enderecoCompleto = [
        this.novoUsuario.rua,
        this.novoUsuario.numero,
        this.novoUsuario.bairro,
        this.novoUsuario.cidade,
        this.novoUsuario.estado
      ].filter(part => part && part.trim()).join(', ');

      this.novoUsuario.endereco = enderecoCompleto;

      // Gerar string de comorbidades de experiência se for cuidador
      if (this.novoUsuario.tipoUsuario === 'cuidador') {
        const comorbidadesValidas = (this.novoUsuario.experienciaComorbidadesList || [''])
          .map(c => c.trim())
          .filter(c => c.length > 0);
        this.novoUsuario.experienciaComorbidades = comorbidadesValidas.join(', ');
        this.novoUsuario.experienciaComorbidadesList = comorbidadesValidas; // Salvar array também
      }

      // Mapear tipoUsuario para role
      if (this.novoUsuario.tipoUsuario === 'cuidador') {
        this.novoUsuario.role = 'Caregiver';
      } else if (this.novoUsuario.tipoUsuario === 'medico') {
        this.novoUsuario.role = 'Doctor';
      } else if (this.novoUsuario.tipoUsuario === 'familiar') {
        this.novoUsuario.role = 'Family Member';
      }

      this.usuarioService.adicionarUsuario({ ...this.novoUsuario });
      this.fecharModalUsuario();
      this.modalSucessoUsuarioAberto = true;
    }
  }

  fecharModalSucessoUsuario(): void {
    this.modalSucessoUsuarioAberto = false;
  }

  abrirModalLinkCadastro(): void {
    this.tipoUsuarioLink = '';
    this.modalLinkCadastroAberto = true;
  }

  fecharModalLinkCadastro(): void {
    this.modalLinkCadastroAberto = false;
    this.tipoUsuarioLink = '';
  }

  getLinkCadastro(): string {
    const baseUrl = window.location.origin;
    if (this.tipoUsuarioLink === 'cuidador') return `${baseUrl}/cadastro/cuidador`;
    if (this.tipoUsuarioLink === 'familiar') return `${baseUrl}/cadastro/familiar`;
    if (this.tipoUsuarioLink === 'medico') return `${baseUrl}/cadastro/medico`;
    return '';
  }

  copiarLinkCadastro(): void {
    const link = this.getLinkCadastro();
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        alert('Link copiado para a área de transferência!');
        this.fecharModalLinkCadastro();
      }).catch(err => {
        console.error('Erro ao copiar link: ', err);
        alert('Falha ao copiar o link.');
      });
    }
  }
}
