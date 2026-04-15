import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer_home/footer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forms',
  imports: [HeaderComponent, FooterComponent, RouterModule, CommonModule, FormsModule],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.css'
})

export class FormsComponent {
  formData = {
    nomeEmpresa: '',
    cnpj: '',
    nomeResponsavel: '',
    email: '',
    telefone: '',
    comoConheceu: '',
    mensagem: ''
  };

  errors = {
    nomeEmpresa: '',
    cnpj: '',
    nomeResponsavel: '',
    email: '',
    telefone: '',
    comoConheceu: ''
  };

  formSubmitted = false;
  privacyPolicyAccepted = false;


  validarCampo(campo: string): void {
    switch (campo) {
      case 'nomeEmpresa':
        this.errors.nomeEmpresa = this.formData.nomeEmpresa.trim() ? '' : 'Nome da instituição é obrigatório.';
        break;
      case 'nomeResponsavel':
        this.errors.nomeResponsavel = this.formData.nomeResponsavel.trim() ? '' : 'Nome do responsável é obrigatório.';
        break;
      case 'comoConheceu':
        this.errors.comoConheceu = this.formData.comoConheceu ? '' : 'Selecione uma opção.';
        break;
      case 'email':
        this.validarEmail();
        break;
      case 'telefone':
        this.validarTelefone();
        break;
      case 'cnpj':
        this.validarCNPJ();
        break;
    }
  }

  validarEmail(): void {
    if (!this.formData.email) {
      this.errors.email = 'Email é obrigatório.';
      return;
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.errors.email = emailPattern.test(this.formData.email) ? '' : 'Email inválido.';
  }

  validarTelefone(): void {
    if (!this.formData.telefone) {
      this.errors.telefone = 'Telefone é obrigatório.';
      return;
    }
    // Remove caracteres não numéricos
    const telefoneNumerico = this.formData.telefone.replace(/\D/g, '');
    if (telefoneNumerico.length < 10 || telefoneNumerico.length > 11) {
      this.errors.telefone = 'Telefone deve ter 10 ou 11 dígitos (com DDD).';
    } else {
      this.errors.telefone = '';
      // Formatação simples visual (opcional, mas boa prática)
      if (telefoneNumerico.length === 11) {
        this.formData.telefone = `(${telefoneNumerico.substring(0, 2)}) ${telefoneNumerico.substring(2, 7)}-${telefoneNumerico.substring(7)}`;
      } else {
        this.formData.telefone = `(${telefoneNumerico.substring(0, 2)}) ${telefoneNumerico.substring(2, 6)}-${telefoneNumerico.substring(6)}`;
      }
    }
  }

  validarCNPJ(): void {
    if (!this.formData.cnpj) {
      this.errors.cnpj = 'CNPJ é obrigatório.';
      return;
    }

    // Remove caracteres não numéricos
    const cnpj = this.formData.cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      this.errors.cnpj = 'CNPJ deve ter 14 dígitos.';
      return;
    }

    // Validação básica de dígitos repetidos
    if (/^(\d)\1+$/.test(cnpj)) {
      this.errors.cnpj = 'CNPJ inválido.';
      return;
    }

    // Validação dos dígitos verificadores
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) {
      this.errors.cnpj = 'CNPJ inválido.';
      return;
    }

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) {
      this.errors.cnpj = 'CNPJ inválido.';
      return;
    }

    this.errors.cnpj = '';
    // Formatando CNPJ
    this.formData.cnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  onSubmit(): void {
    this.formSubmitted = true;

    // Valida todos os campos
    this.validarCampo('nomeEmpresa');
    this.validarCampo('nomeResponsavel');
    this.validarCampo('email');
    this.validarCampo('telefone');
    this.validarCampo('cnpj');
    this.validarCampo('comoConheceu');

    // Verifica se há erros
    const hasErrors = Object.values(this.errors).some(error => error !== '');

    if (!hasErrors) {
      console.log('Formulário enviado com sucesso:', this.formData);
      alert('Formulário enviado com sucesso!');
      // Resetar form ou redirecionar
    } else {
      alert('Por favor, corrija os erros no formulário.');
    }
  }
}
