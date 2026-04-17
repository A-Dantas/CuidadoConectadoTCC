import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacienteService, Paciente } from '../paciente.service';
import { UsuarioService, Usuario } from '../usuario.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu2',
  imports: [CommonModule, FormsModule],
  templateUrl: './menu2.component.html',
  styleUrl: './menu2.component.css'
})
export class Menu2Component implements OnInit, OnDestroy {
  pacientes: Paciente[] = [];
  private subscription: Subscription = new Subscription();

  modalEdicaoAberto: boolean = false;
  modalSucessoEdicaoAberto: boolean = false;
  modalCadastroAberto: boolean = false;
  modalSucessoCadastroAberto: boolean = false;
  modalConfirmacaoExclusaoAberto: boolean = false;
  modalSucessoExclusaoAberto: boolean = false;

  // Double-click tracking
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

  pacienteEditando: Paciente = {
    nomePaciente: '',
    cpf: '',
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
    contatoFamiliar: '',
    observacoes: '',
    foto: ''
  };

  pacienteCadastro: Paciente = {
    nomePaciente: '',
    cpf: '',
    idade: null,
    dataNascimento: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    comorbidades: '',
    cuidadorAtribuido: '',
    medicoAtribuido: '',
    contatoFamiliar: '',
    observacoes: '',
    foto: ''
  };
  indiceEditando: number = -1;
  indiceExcluindo: number = -1;
  comorbidadesListEdicao: string[] = [''];
  comorbidadesListCadastro: string[] = [''];

  cuidadores: string[] = [];
  medicos: string[] = [];
  familiares: string[] = [];
  allUsuarios: Usuario[] = []; // Store all users for filtering

  // Store full objects for name lookup
  allCuidadores: Usuario[] = [];

  // Track which patients have expanded comorbidities
  comorbidadesExpandidas: Set<number> = new Set();

  // Store calendar data
  private calendarsData: { [cuidadorName: string]: any[] } = {};
  private readonly STORAGE_KEY = 'calendars_data';

  // Map shift codes to readable labels
  private shiftLabels: { [key: string]: string } = {
    'MT': 'MT (7h ~ 19h)',
    'SN': 'SN (19h ~ 7h)',
    '24H_7H': '24h (Início 7h)',
    '24H_19H': '24h (Início 19h)'
  };

  constructor(
    private pacienteService: PacienteService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this.pacienteService.getPacientes().subscribe(pacientes => {
        this.pacientes = pacientes;
      })
    );

    this.subscription.add(
      this.usuarioService.getUsuarios().subscribe(usuarios => {
        this.atualizarListasUsuarios(usuarios);
      })
    );

    this.loadCalendarsData();
  }

  loadCalendarsData(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.calendarsData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading calendars data:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  atualizarListasUsuarios(usuarios: Usuario[]): void {
    this.allUsuarios = usuarios;
    this.allCuidadores = usuarios.filter(u => u.role === 'Caregiver');

    this.cuidadores = this.allCuidadores.map(u => u.userName);

    this.medicos = usuarios
      .filter(u => u.role === 'Doctor')
      .map(u => u.userName);

    this.familiares = usuarios
      .filter(u => u.role === 'Family Member')
      .map(u => u.userName);
  }

  get familiaresFiltrados(): string[] {
    // Para edição
    if (this.modalEdicaoAberto) {
      return this.getFamiliaresPorCPF(this.pacienteEditando.cpf);
    }
    // Para cadastro
    if (this.modalCadastroAberto) {
      return this.getFamiliaresPorCPF(this.pacienteCadastro.cpf);
    }
    return this.familiares;
  }

  getFamiliaresPorCPF(cpf?: string): string[] {
    if (!cpf) return this.familiares;
    
    const filtrados = this.allUsuarios
      .filter(u => u.role === 'Family Member' && u.cpfPacienteResponsavel === cpf)
      .map(u => u.userName);
      
    // Se não encontrar vinculação, retorna todos para permitir escolha manual se necessário, 
    // mas prioriza os vinculados
    return filtrados.length > 0 ? filtrados : this.familiares;
  }

  handleOverlayClick(): void {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - this.lastClickTime;

    if (timeDiff < this.DOUBLE_CLICK_DELAY) {
      // Double-click detected
      if (this.modalEdicaoAberto) this.fecharModalEdicao();
      else if (this.modalConfirmacaoExclusaoAberto) this.fecharModalConfirmacaoExclusao();
      else if (this.modalSucessoEdicaoAberto) this.fecharModalSucessoEdicao();
      else if (this.modalSucessoExclusaoAberto) this.fecharModalSucessoExclusao();
    }

    this.lastClickTime = currentTime;
  }

  getComorbidadesArray(comorbidades: string): string[] {
    if (!comorbidades || comorbidades.trim() === '') {
      return [];
    }
    return comorbidades.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  toggleComorbidades(index: number): void {
    if (this.comorbidadesExpandidas.has(index)) {
      this.comorbidadesExpandidas.delete(index);
    } else {
      this.comorbidadesExpandidas.add(index);
    }
  }

  isComorbidadesExpandido(index: number): boolean {
    return this.comorbidadesExpandidas.has(index);
  }

  // Retorna a data de hoje formatada
  getDataHoje(): string {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  // Retorna os plantões do dia para um paciente
  getPlantoesDoDia(paciente: Paciente): Array<{ cuidador: string, horario: string, code: string, origin: 'today' | 'yesterday' }> {
    const todayDate = new Date();
    const today = todayDate.getDate();

    // Calculate yesterday
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(today - 1);
    const yesterday = yesterdayDate.getDate();

    const result: Array<{ cuidador: string, horario: string, code: string, origin: 'today' | 'yesterday' }> = [];

    // Helper to process a specific day
    const processDay = (dayNumber: number, origin: 'today' | 'yesterday') => {
      for (const cuidadorName in this.calendarsData) {
        const calendar = this.calendarsData[cuidadorName];
        const dayData = calendar.find((d: any) => d.number === dayNumber);

        if (dayData && dayData.selectedPatients) {
          dayData.selectedPatients.forEach((selectedPatientName: string, index: number) => {
            if (selectedPatientName === paciente.nomePaciente) {
              const shiftCode = dayData.selectedShifts[index];
              const shiftLabel = this.shiftLabels[shiftCode] || shiftCode || 'Turno não definido';

              // If looking at yesterday, only include shifts that span into today
              if (origin === 'yesterday') {
                if (!['24H_7H', '24H_19H', 'SN'].includes(shiftCode)) {
                  return;
                }
              }

              // Look up full name
              const cuidadorObj = this.allCuidadores.find(u => u.userName === cuidadorName);
              const displayName = cuidadorObj
                ? `${cuidadorObj.userName} ${cuidadorObj.sobrenome || ''}`.trim()
                : cuidadorName;

              result.push({
                cuidador: displayName,
                horario: shiftLabel,
                code: shiftCode,
                origin: origin
              });
            }
          });
        }
      }
    };

    // Process Today (priority)
    processDay(today, 'today');

    // Process Yesterday (for lingering shifts)
    processDay(yesterday, 'yesterday');

    return result;
  }

  getStatusPlantao(shiftCode: string, origin: 'today' | 'yesterday' = 'today'): 'ANDAMENTO' | 'FINALIZADO' | null {
    const now = new Date();
    const hour = now.getHours();

    if (origin === 'yesterday') {
      // Logic for shifts started yesterday
      switch (shiftCode) {
        case '24H_7H': // Started yest 7am, ends today 7am
          return hour < 7 ? 'ANDAMENTO' : 'FINALIZADO';
        case '24H_19H': // Started yest 19h, ends today 19h
          return hour < 19 ? 'ANDAMENTO' : 'FINALIZADO';
        case 'SN': // Started yest 19h, ends today 07h
          return hour < 7 ? 'ANDAMENTO' : 'FINALIZADO';
        default:
          return 'FINALIZADO';
      }
    }

    // Logic for shifts starting today
    switch (shiftCode) {
      case 'MT': // 07:00 - 19:00
        if (hour >= 7 && hour < 19) return 'ANDAMENTO';
        if (hour >= 19) return 'FINALIZADO';
        break;
      case 'SN': // 19:00 - 07:00 (next day)
        if (hour >= 19) return 'ANDAMENTO';
        break;
      case '24H_7H': // 07:00 - 07:00 (+1)
        if (hour >= 7) return 'ANDAMENTO';
        break;
      case '24H_19H': // 19:00 - 19:00 (+1)
        if (hour >= 19) return 'ANDAMENTO';
        break;
    }
    return null;
  }

  getTerminoPrevisto(shiftCode: string, origin: 'today' | 'yesterday' = 'today'): string {
    const now = new Date();
    const hour = now.getHours();

    if (origin === 'yesterday') {
      switch (shiftCode) {
        case '24H_7H':
          return hour < 7 ? 'Plantão iniciado ontem, termina hoje às 07h' : 'Plantão iniciado ontem, terminou hoje às 07h';
        case '24H_19H':
          return hour < 19 ? 'Plantão iniciado ontem, termina hoje às 19h' : 'Plantão iniciado ontem, terminou hoje às 19h';
        case 'SN':
          return hour < 7 ? 'Plantão iniciado ontem, termina hoje às 07h' : 'Plantão iniciado ontem, terminou hoje às 07h';
        default:
          return '';
      }
    }

    switch (shiftCode) {
      case '24H_7H':
        return 'Termina amanhã às 07h';
      case '24H_19H':
        return 'Termina amanhã às 19h';
      case 'SN':
        return 'Termina amanhã às 07h';
      default:
        return '';
    }
  }

  abrirModalCadastro(): void {
    this.resetarFormularioCadastro();
    this.modalCadastroAberto = true;
  }

  fecharModalCadastro(): void {
    this.modalCadastroAberto = false;
    this.resetarFormularioCadastro();
  }

  resetarFormularioCadastro(): void {
    this.pacienteCadastro = {
      nomePaciente: '',
      cpf: '',
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
    this.comorbidadesListCadastro = [''];
  }

  salvarCadastro(): void {
    if (this.pacienteCadastro.nomePaciente.trim()) {
      // Gerar endereço completo
      const enderecoCompleto = [
        this.pacienteCadastro.rua,
        this.pacienteCadastro.numero,
        this.pacienteCadastro.bairro,
        this.pacienteCadastro.cidade,
        this.pacienteCadastro.estado
      ].filter(part => part && part.trim()).join(', ');

      this.pacienteCadastro.endereco = enderecoCompleto;

      // Gerar string de comorbidades
      const comorbidadesValidas = this.comorbidadesListCadastro
        .map(c => c.trim())
        .filter(c => c.length > 0);
      this.pacienteCadastro.comorbidades = comorbidadesValidas.join(', ');

      this.pacienteService.adicionarPaciente({ ...this.pacienteCadastro });
      this.fecharModalCadastro();
      this.modalSucessoCadastroAberto = true;
    }
  }

  fecharModalSucessoCadastro(): void {
    this.modalSucessoCadastroAberto = false;
  }

  adicionarComorbidadeCadastro(): void {
    this.comorbidadesListCadastro.push('');
  }

  removerComorbidadeCadastro(index: number): void {
    if (this.comorbidadesListCadastro.length > 1) {
      this.comorbidadesListCadastro.splice(index, 1);
    }
  }

  abrirModalEdicao(paciente: Paciente, index: number): void {
    this.pacienteEditando = { ...paciente };
    this.indiceEditando = index;

    // Carregar comorbidades em array
    const comorbidades = this.getComorbidadesArray(paciente.comorbidades);
    this.comorbidadesListEdicao = comorbidades.length > 0 ? comorbidades : [''];

    this.modalEdicaoAberto = true;
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.resetarFormularioEdicao();
  }

  onFotoSelecionada(event: any, modo: 'cadastro' | 'edicao'): void {
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
        if (modo === 'cadastro') {
          this.pacienteCadastro.foto = reader.result as string;
        } else {
          this.pacienteEditando.foto = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  resetarFormularioEdicao(): void {
    this.pacienteEditando = {
      nomePaciente: '',
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
    this.indiceEditando = -1;
    this.comorbidadesListEdicao = [''];
  }

  adicionarComorbidadeEdicao(): void {
    this.comorbidadesListEdicao.push('');
  }

  removerComorbidadeEdicao(index: number): void {
    if (this.comorbidadesListEdicao.length > 1) {
      this.comorbidadesListEdicao.splice(index, 1);
    }
  }

  validarData(data: string | undefined): boolean {
    if (!data) return false;
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

  atualizarIdadePacienteEdicao(): void {
    this.pacienteEditando.idade = this.calcularIdade(this.pacienteEditando.dataNascimento) ?? null;
  }

  atualizarIdadePacienteCadastro(): void {
    this.pacienteCadastro.idade = this.calcularIdade(this.pacienteCadastro.dataNascimento) ?? null;
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

  formatarCPF(event: any, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = valor.substring(0, 3);
    if (valor.length >= 4) valorFormatado += '.' + valor.substring(3, 6);
    if (valor.length >= 7) valorFormatado += '.' + valor.substring(6, 9);
    if (valor.length >= 10) valorFormatado += '-' + valor.substring(9, 11);
    objeto.cpf = valorFormatado;
    event.target.value = valorFormatado;
  }

  salvarEdicao(): void {
    if (this.pacienteEditando.nomePaciente.trim() && this.indiceEditando >= 0) {
      // Gerar endereço completo
      const enderecoCompleto = [
        this.pacienteEditando.rua,
        this.pacienteEditando.numero,
        this.pacienteEditando.bairro,
        this.pacienteEditando.cidade,
        this.pacienteEditando.estado
      ].filter(part => part && part.trim()).join(', ');

      this.pacienteEditando.endereco = enderecoCompleto;

      // Gerar string de comorbidades
      const comorbidadesValidas = this.comorbidadesListEdicao
        .map(c => c.trim())
        .filter(c => c.length > 0);
      this.pacienteEditando.comorbidades = comorbidadesValidas.join(', ');

      this.pacienteService.editarPaciente(this.indiceEditando, { ...this.pacienteEditando });
      this.fecharModalEdicao();
      this.modalSucessoEdicaoAberto = true;
    }
  }

  abrirModalConfirmacaoExclusao(index: number): void {
    this.indiceExcluindo = index;
    this.modalConfirmacaoExclusaoAberto = true;
  }

  fecharModalConfirmacaoExclusao(): void {
    this.modalConfirmacaoExclusaoAberto = false;
    this.indiceExcluindo = -1;
  }

  confirmarExclusao(): void {
    if (this.indiceExcluindo >= 0) {
      this.pacienteService.excluirPaciente(this.indiceExcluindo);
      this.fecharModalConfirmacaoExclusao();
      this.modalSucessoExclusaoAberto = true;
    }
  }

  fecharModalSucessoExclusao(): void {
    this.modalSucessoExclusaoAberto = false;
  }

  fecharModalSucessoEdicao(): void {
    this.modalSucessoEdicaoAberto = false;
  }
}
