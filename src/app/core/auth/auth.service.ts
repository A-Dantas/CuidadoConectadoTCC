import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService, Usuario } from '../../features/system/gestor/usuario.service';

export interface DadosGestor {
  nome: string;
  email: string;
  telefone: string;
  fotoPerfil?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _estaLogado = signal<boolean>(false);
  estaLogado = this._estaLogado.asReadonly();

  private _perfil = signal<string | null>(null);
  perfil = this._perfil.asReadonly();

  private usuarioAtualLogin: string | null = null;

  private senhaGestor = '123'; // Senha padrão inicial (Sincronizado com seed-data)

  private dadosGestor: DadosGestor = {
    nome: 'Administrador',
    email: 'admin@cuidado.com',
    telefone: '(11) 99999-9999',
    fotoPerfil: ''
  };

  private usuarioService = inject(UsuarioService);

  constructor(private router: Router) {
    if (sessionStorage.getItem('estaLogado') === 'true') {
      this._estaLogado.set(true);
      this._perfil.set(sessionStorage.getItem('perfil'));
      this.usuarioAtualLogin = sessionStorage.getItem('usuarioAtualLogin');
    }

    // Carrega senha personalizada se existir
    const senhaSalva = localStorage.getItem('senhaGestor');
    if (senhaSalva) {
      this.senhaGestor = senhaSalva;
    }

    // Carrega dados do perfil se existirem
    const dadosSalvos = localStorage.getItem('dadosGestor');
    if (dadosSalvos) {
      this.dadosGestor = JSON.parse(dadosSalvos);
    }
  }


  entrar(usuario: string, senha: string): boolean {
    // Login Gestor
    if (usuario === 'gestor' && senha === this.senhaGestor) {
      this.realizarLogin('gestor', 'gestor', '/gestor');
      return true;
    }

    // Login Usuários
    const usuarios = this.usuarioService.getUsuariosAtuais();
    const user = usuarios.find(u => u.login === usuario && u.password === senha);

    if (user) {
      let rota = '/home';
      if (user.role === 'Caregiver') rota = '/cuidador';
      else if (user.role === 'Doctor') rota = '/medico';
      else if (user.role === 'Family Member') rota = '/familiar';

      this.realizarLogin(user.login!, user.role, rota);
      return true;
    }

    this.logoutClean();
    return false;
  }

  private realizarLogin(login: string, role: string, rota: string) {
    this._estaLogado.set(true);
    this._perfil.set(role);
    this.usuarioAtualLogin = login;

    sessionStorage.setItem('estaLogado', 'true');
    sessionStorage.setItem('perfil', role);
    sessionStorage.setItem('usuarioAtualLogin', login);

    this.router.navigate([rota]);
  }

  private logoutClean() {
    this._estaLogado.set(false);
    this._perfil.set(null);
    this.usuarioAtualLogin = null;
    sessionStorage.removeItem('estaLogado');
    sessionStorage.removeItem('perfil');
    sessionStorage.removeItem('usuarioAtualLogin');
  }

  sair(): void {
    this.logoutClean();
    this.router.navigate(['/login']);
  }

  precisaTrocarSenha(): boolean {
    if (this.usuarioAtualLogin === 'gestor') {
      // Se quiser forçar pro gestor também se a senha for 123456
      return false; // Gestor update logic is separate currently
    }

    const usuarios = this.usuarioService.getUsuariosAtuais();
    const user = usuarios.find(u => u.login === this.usuarioAtualLogin);
    return user?.password === '123456';
  }

  atualizarSenhaUsuario(novaSenha: string): boolean {
    if (this.usuarioAtualLogin && this.usuarioAtualLogin !== 'gestor') {
      return this.usuarioService.atualizarSenha(this.usuarioAtualLogin, novaSenha);
    }
    return false;
  }

  atualizarSenhaGestor(novaSenha: string): void {
    this.senhaGestor = novaSenha;
    localStorage.setItem('senhaGestor', novaSenha);
  }

  getUsuarioAtualLogin(): string | null {
    return this.usuarioAtualLogin;
  }

  getDadosGestor(): DadosGestor {
    return { ...this.dadosGestor };
  }

  atualizarDadosGestor(novosDados: DadosGestor): void {
    this.dadosGestor = { ...this.dadosGestor, ...novosDados };
    localStorage.setItem('dadosGestor', JSON.stringify(this.dadosGestor));
  }

  getUsuarioLogadoCompleto(): Usuario | null {
    if (!this.usuarioAtualLogin || this.usuarioAtualLogin === 'gestor') {
      return null;
    }
    const usuarios = this.usuarioService.getUsuariosAtuais();
    return usuarios.find(u => u.login === this.usuarioAtualLogin) || null;
  }
}