import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_USUARIOS } from '../../../core/data/seed-data';

export interface Usuario {
    userName: string;
    email: string;
    role: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    endereco: string;

    // Campos específicos de cuidador
    sobrenome?: string;
    dataNascimento?: string;
    idade?: number;
    telefone?: string;
    chavePix?: string;
    whatsapp?: string;
    tempoExperiencia?: string;
    experienciaComorbidades?: string;
    tipoUsuario?: string; // Tipo de usuário: cuidador, medico, familiar
    experienciaComorbidadesList?: string[]; // Lista de comorbidades
    login?: string;
    password?: string;
    cpfPacienteResponsavel?: string;

    // Novos campos para currículo e ativação
    status?: 'pending' | 'active';
    curriculoPdf?: string; // Base64 do PDF
    isCurriculo?: boolean;
    fotoPerfil?: string;
}


@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private readonly STORAGE_KEY = 'usuarios_data';
    private usuariosSubject = new BehaviorSubject<Usuario[]>(this.carregarUsuarios());
    public usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();

    constructor() { }

    private carregarUsuarios(): Usuario[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            let usuarios: Usuario[] = [];

            if (data) {
                usuarios = JSON.parse(data);

                // Forçar reset para os novos usuários solicitados pelo usuário
                const nomesSeed = INITIAL_USUARIOS.map(u => u.userName);
                const todosNomesMatch = INITIAL_USUARIOS.every(u => usuarios.some(existente => existente.userName === u.userName));

                if (!todosNomesMatch || usuarios.length > INITIAL_USUARIOS.length + 5) {
                    console.log('Resetando banco de dados de usuários para novos padrões...');
                    usuarios = [...INITIAL_USUARIOS];
                    this.salvarUsuarios(usuarios);
                }
            } else {
                usuarios = [...INITIAL_USUARIOS];
                this.salvarUsuarios(usuarios);
            }
            return usuarios;
        } catch (error) {
            console.error('Erro ao carregar usuários do localStorage:', error);
            return [];
        }
    }

    private salvarUsuarios(usuarios: Usuario[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuarios));
        } catch (error) {
            console.error('Erro ao salvar usuários no localStorage:', error);
        }
    }

    getUsuarios(): Observable<Usuario[]> {
        return this.usuarios$;
    }

    getUsuariosAtuais(): Usuario[] {
        return this.usuariosSubject.value;
    }

    adicionarUsuario(usuario: Usuario): void {
        const usuariosAtuais = this.usuariosSubject.value;

        // Se não vier com status, assume active (cadastro manual pelo gestor)
        if (!usuario.status) {
            usuario.status = 'active';
        }

        // Se o status for active, gera as credenciais
        if (usuario.status === 'active' && !usuario.login) {
            let login = '';
            if (usuario.userName) {
                const primeiroNome = usuario.userName.trim().split(' ')[0].toLowerCase();
                const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
                const ultimosQuatro = telefoneNumeros.slice(-4);
                const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : '0000';
                login = `${primeiroNome}${sufixo}`;
            }
            usuario.login = login;
            usuario.password = '123456';
        }

        const novosUsuarios = [...usuariosAtuais, usuario];
        this.usuariosSubject.next(novosUsuarios);
        this.salvarUsuarios(novosUsuarios);
    }

    ativarUsuario(index: number): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
            const nuevosUsuarios = [...usuariosAtuais];
            const usuario = { ...nuevosUsuarios[index] };
            
            usuario.status = 'active';
            
            // Gerar login e senha se ainda não tiver
            if (!usuario.login) {
                const primeiroNome = usuario.userName.trim().split(' ')[0].toLowerCase();
                const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
                const ultimosQuatro = telefoneNumeros.slice(-4);
                const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : '0000';
                usuario.login = `${primeiroNome}${sufixo}`;
                usuario.password = '123456';
            }

            nuevosUsuarios[index] = usuario;
            this.usuariosSubject.next(nuevosUsuarios);
            this.salvarUsuarios(nuevosUsuarios);
        }
    }

    atualizarSenha(login: string, novaSenha: string): boolean {
        const usuariosAtuais = this.usuariosSubject.value;
        const index = usuariosAtuais.findIndex(u => u.login === login);

        if (index !== -1) {
            const usuario = { ...usuariosAtuais[index] };
            usuario.password = novaSenha;

            const novosUsuarios = [...usuariosAtuais];
            novosUsuarios[index] = usuario;

            this.usuariosSubject.next(novosUsuarios);
            this.salvarUsuarios(novosUsuarios);
            return true;
        }
        return false;
    }

    atualizarUsuario(index: number, usuarioAtualizado: Usuario): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
            const novosUsuarios = [...usuariosAtuais];
            // Preservar login e senha se não vierem no atualizado
            const credenciaisAntigas = {
                login: usuariosAtuais[index].login,
                password: usuariosAtuais[index].password
            };

            novosUsuarios[index] = { ...credenciaisAntigas, ...usuarioAtualizado };
            this.usuariosSubject.next(novosUsuarios);
            this.salvarUsuarios(novosUsuarios);
        }
    }

    atualizarPerfilPorLogin(login: string, novosDados: Partial<Usuario>): void {
        const usuarios = this.usuariosSubject.value;
        const index = usuarios.findIndex(u => u.login === login);
        
        if (index !== -1) {
            const novosUsuarios = [...usuarios];
            novosUsuarios[index] = { ...novosUsuarios[index], ...novosDados };
            this.usuariosSubject.next(novosUsuarios);
            this.salvarUsuarios(novosUsuarios);
        }
    }

    removerUsuario(index: number): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
            const novosUsuarios = usuariosAtuais.filter((_, i) => i !== index);
            this.usuariosSubject.next(novosUsuarios);
            this.salvarUsuarios(novosUsuarios);
        }
    }

    getQuantidadeUsuarios(): number {
        return this.usuariosSubject.value.length;
    }

    limparDados(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.usuariosSubject.next([]);
    }
}
