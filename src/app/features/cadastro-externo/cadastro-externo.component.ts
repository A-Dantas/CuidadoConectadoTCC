import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService, Usuario } from '../system/gestor/usuario.service';
import { PacienteService, Paciente } from '../system/gestor/paciente.service';

@Component({
  selector: 'app-cadastro-externo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-externo.component.html',
  styleUrl: './cadastro-externo.component.css'
})
export class CadastroExternoComponent implements OnInit {
  tipoUsuario: string = '';
  cadastroConcluido: boolean = false;
  cadastrarIdoso: boolean = false;
  modalCpfExistente: boolean = false;
  animarGradient: boolean = false;
  fileName: string = '';
  pdfBase64: string = '';
  carregando: boolean = false; // Novo estado de carregamento

  novoUsuario: Usuario = {
    userName: '',
    sobrenome: '',
    email: '',
    role: '',
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
    experienciaComorbidadesList: [''],
    cpfPacienteResponsavel: '',
    tipoChavePix: 'CPF'
  };

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

  errosUsuario: any = {};
  errosPaciente: any = {};
  emailInvalidoUsuario: boolean = false;
  comorbidadesList: string[] = [''];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tipoUsuario = (params.get('tipo') || '').toLowerCase();
      this.novoUsuario.tipoUsuario = this.tipoUsuario;
      
      if (this.tipoUsuario !== 'cuidador' && this.tipoUsuario !== 'medico' && this.tipoUsuario !== 'familiar') {
        this.router.navigate(['/home']);
      }
    });
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

  atualizarIdadeUsuario(): void {
    this.novoUsuario.idade = this.calcularIdade(this.novoUsuario.dataNascimento);
  }

  atualizarIdadePaciente(): void {
    this.novoPaciente.idade = this.calcularIdade(this.novoPaciente.dataNascimento) ?? null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      if (file.size > 500 * 1024) {
        alert('O currículo é muito grande. Para garantir o salvamento no banco de dados, o limite é de 500KB. Tente um arquivo PDF mais leve ou compactado.');
        return;
      }
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.pdfBase64 = reader.result as string;
        this.novoUsuario.curriculoPdf = this.pdfBase64;
      };
      reader.readAsDataURL(file);
    }
  }

  validarNome(event: any, campo: string, objeto: any): void {
    const valor = event.target.value;
    const valorSemNumeros = valor.replace(/[0-9]/g, '');
    objeto[campo] = valorSemNumeros;
    event.target.value = valorSemNumeros;
  }

  validarNomePaciente(event: any, campo: string, objeto: any): void {
    this.validarNome(event, campo, objeto);
  }

  validarEmail(email: string): boolean {
    return email.includes('@');
  }

  validarEmailUsuario(valor?: string): void {
    const emailToCheck = valor !== undefined ? valor : this.novoUsuario?.email;

    if (!this.novoUsuario || !emailToCheck) {
      this.emailInvalidoUsuario = false;
      return;
    }

    const email = emailToCheck.trim();
    if (email.length > 0) {
      this.emailInvalidoUsuario = !email.includes('@');
      this.errosUsuario.email = false;
    } else {
      this.emailInvalidoUsuario = false;
    }
  }

  formatarTelefone(event: any, campo: string, objeto: any): void {
    let valor = event.target.value.replace(/\D/g, '');

    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }

    let valorFormatado = '';
    if (valor.length > 0) valorFormatado = '(' + valor.substring(0, 2);
    if (valor.length >= 3) valorFormatado += ') ' + valor.substring(2, 7);
    if (valor.length >= 8) valorFormatado += '-' + valor.substring(7, 11);

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

  adicionarComorbidade(): void {
    this.comorbidadesList.push('');
  }

  removerComorbidade(index: number): void {
    if (this.comorbidadesList.length > 1) {
      this.comorbidadesList.splice(index, 1);
    }
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
    
    // Se o objeto tiver a propriedade cpf, salva nela (para Pacientes)
    // Se for usado via formatarChavePix, ele lidará com o salvamento em chavePix
    if ('cpf' in objeto) {
      objeto.cpf = valorFormatado;
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

  verificarCpfExistente(): void {
    if (!this.novoPaciente.cpf || this.novoPaciente.cpf.length < 14) return;
    
    const pacientes = this.pacienteService.getPacientesValue();
    const existe = pacientes.some(p => p.cpf === this.novoPaciente.cpf);
    
    if (existe) {
      this.errosPaciente.cpf = true;
      this.modalCpfExistente = true;
    } else {
      this.errosPaciente.cpf = false;
    }
  }

  fecharModalCpfEAnimar(): void {
    this.modalCpfExistente = false;
    
    setTimeout(() => {
      const checkboxElement = document.getElementById('labelCheckboxIdoso');
      if (checkboxElement) {
        checkboxElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      this.animarGradient = true;
      
      // Remover a animação após ela terminar para poder rodar de novo se necessário
      setTimeout(() => {
        this.animarGradient = false;
      }, 3000);
    }, 100);
  }

  async adicionarUsuario(): Promise<void> {
    this.errosUsuario = {};
    this.errosPaciente = {};

    if (!this.novoUsuario.userName?.trim()) this.errosUsuario.userName = true;
    if (!this.novoUsuario.sobrenome?.trim()) this.errosUsuario.sobrenome = true;
    if (!this.novoUsuario.email?.trim()) this.errosUsuario.email = true;

    if (this.tipoUsuario === 'cuidador') {
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
      if (!this.novoUsuario.curriculoPdf) this.errosUsuario.curriculoPdf = true;
    } else if (this.tipoUsuario === 'medico') {
      if (!this.novoUsuario.whatsapp?.trim()) this.errosUsuario.whatsapp = true;
    } else if (this.tipoUsuario === 'familiar') {
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

    if (this.cadastrarIdoso && this.tipoUsuario === 'familiar') {
      if (!this.novoPaciente.nomePaciente.trim()) this.errosPaciente.nomePaciente = true;
      if (!this.novoPaciente.cpf || this.novoPaciente.cpf.length < 14) this.errosPaciente.cpf = true;
      if (!this.novoPaciente.dataNascimento || !this.validarData(this.novoPaciente.dataNascimento)) this.errosPaciente.dataNascimento = true;
      if (this.novoPaciente.idade === undefined || this.novoPaciente.idade === null) this.errosPaciente.idade = true;
      if (!this.novoPaciente.rua.trim()) this.errosPaciente.rua = true;
      if (!this.novoPaciente.numero.trim()) this.errosPaciente.numero = true;
      if (!this.novoPaciente.bairro.trim()) this.errosPaciente.bairro = true;
      if (!this.novoPaciente.cidade.trim()) this.errosPaciente.cidade = true;
      if (!this.novoPaciente.estado.trim()) this.errosPaciente.estado = true;
    }

    // Validação específica da Chave PIX baseada no tipo
    if (this.tipoUsuario === 'cuidador' && this.novoUsuario.chavePix) {
      const tipo = this.novoUsuario.tipoChavePix;
      const valor = this.novoUsuario.chavePix;
      
      if (tipo === 'CPF' && valor.length < 14) this.errosUsuario.chavePix = true;
      if (tipo === 'Telefone' && valor.length < 14) this.errosUsuario.chavePix = true;
      if (tipo === 'Email' && !valor.includes('@')) this.errosUsuario.chavePix = true;
    }

    if (Object.keys(this.errosUsuario).length > 0 || Object.keys(this.errosPaciente).length > 0) return;

    if (this.cadastrarIdoso && this.tipoUsuario === 'familiar') {
      const pacientes = this.pacienteService.getPacientesValue();
      if (pacientes.some(p => p.cpf === this.novoPaciente.cpf)) {
        this.modalCpfExistente = true;
        return;
      }
    }

    if (this.novoUsuario.userName.trim() && this.novoUsuario.email.trim()) {
      if (!this.validarEmail(this.novoUsuario.email)) {
        this.emailInvalidoUsuario = true;
        return;
      }

      if (this.novoUsuario.dataNascimento && !this.validarData(this.novoUsuario.dataNascimento)) {
        alert('Data de nascimento inválida. O ano deve ter 4 dígitos e ser a partir de 1900.');
        return;
      }
      
      const enderecoCompleto = [
        this.novoUsuario.rua,
        this.novoUsuario.numero,
        this.novoUsuario.bairro,
        this.novoUsuario.cidade,
        this.novoUsuario.estado
      ].filter(part => part && part.trim()).join(', ');

      this.novoUsuario.endereco = enderecoCompleto;

      if (this.tipoUsuario === 'cuidador') {
        const comorbidadesValidas = (this.novoUsuario.experienciaComorbidadesList || [''])
          .map(c => c.trim())
          .filter(c => c.length > 0);
        this.novoUsuario.experienciaComorbidades = comorbidadesValidas.join(', ');
        this.novoUsuario.experienciaComorbidadesList = comorbidadesValidas; 
      }

      // Preparar payload explícito para evitar perda de estado
      const payload: Usuario = {
        ...this.novoUsuario,
        role: this.tipoUsuario === 'cuidador' ? 'Caregiver' : (this.tipoUsuario === 'medico' ? 'Doctor' : 'Family Member'),
        isCurriculo: this.tipoUsuario === 'cuidador',
        status: this.tipoUsuario === 'cuidador' ? 'pending' : 'active'
      };

      this.carregando = true; // Iniciar carregamento

      try {
        console.log('📤 Enviando cadastro externo:', payload);
        await this.usuarioService.adicionarUsuario(payload);

        if (this.cadastrarIdoso && this.tipoUsuario === 'familiar') {
          const enderecoCompletoPaciente = [
            this.novoPaciente.rua,
            this.novoPaciente.numero,
            this.novoPaciente.bairro,
            this.novoPaciente.cidade,
            this.novoPaciente.estado
          ].filter(part => part && part.trim()).join(', ');

          this.novoPaciente.endereco = enderecoCompletoPaciente;
          this.novoPaciente.contatoFamiliar = this.novoUsuario.userName;

          const comorbidadesValidas = this.comorbidadesList
            .map(c => c.trim())
            .filter(c => c.length > 0);
          this.novoPaciente.comorbidades = comorbidadesValidas.join(', ');

          await this.pacienteService.adicionarPaciente({ ...this.novoPaciente });
        }

        this.cadastroConcluido = true;
        console.log('✅ Cadastro externo concluído com sucesso.');
      } catch (error) {
        console.error('❌ Falha crítica no cadastro externo:', error);
        alert('Ocorreu um erro ao salvar seu cadastro. Por favor, verifique sua conexão ou se o arquivo PDF é muito pesado (limite 500KB) e tente novamente.');
      } finally {
        this.carregando = false; // Finalizar carregamento
      }
    }
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}
