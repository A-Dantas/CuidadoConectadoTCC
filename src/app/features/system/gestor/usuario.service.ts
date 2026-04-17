import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_USUARIOS } from '../../../core/data/seed-data';
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { NotificationService } from '../../../core/services/notification.service';

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
    sobrenome?: string;
    dataNascimento?: string;
    idade?: number;
    telefone?: string;
    chavePix?: string;
    whatsapp?: string;
    tempoExperiencia?: string;
    experienciaComorbidades?: string;
    tipoUsuario?: string; 
    experienciaComorbidadesList?: string[];
    login?: string;
    password?: string;
    cpfPacienteResponsavel?: string;
    status?: 'pending' | 'active';
    curriculoPdf?: string; 
    isCurriculo?: boolean;
    fotoPerfil?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
    public usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();
    private firestore = inject(Firestore);
    private usuariosCollection = collection(this.firestore, 'usuarios');
    private firstLoad = true;
    private notificationService = inject(NotificationService);

    constructor() { 
        this.carregarUsuarios();
    }

    private carregarUsuarios(): void {
        collectionData(this.usuariosCollection, { idField: 'firestore_id' }).subscribe((usuarios: any[]) => {
            if (usuarios.length === 0 && this.firstLoad) {
                this.firstLoad = false;
                INITIAL_USUARIOS.forEach(u => {
                    const loginRef = u.login || `user_${Date.now()}_${Math.random()}`;
                    this.salvarUsuarioFirestore(loginRef, u);
                });
            } else {
                if (!this.firstLoad) {
                    this.notificationService.setDot('Usuários', true);
                    this.notificationService.setDot('Currículos', true); 
                }
                this.firstLoad = false;
                this.usuariosSubject.next(usuarios as Usuario[]);
            }
        });
    }

    private async salvarUsuarioFirestore(id: string, usuario: Usuario) {
        if (!usuario.login) {
             const primeiroNome = usuario.userName?.trim().split(' ')[0].toLowerCase() || 'user';
             const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
             const ultimosQuatro = telefoneNumeros.slice(-4);
             const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : '0000';
             usuario.login = `${primeiroNome}${sufixo}`;
        }
        
        const docId = usuario.login || id;
        const usuarioDoc = doc(this.firestore, `usuarios/${docId}`);
        await setDoc(usuarioDoc, usuario);
    }

    getUsuarios(): Observable<Usuario[]> {
        return this.usuarios$;
    }

    getUsuariosAtuais(): Usuario[] {
        return this.usuariosSubject.value;
    }

    adicionarUsuario(usuario: Usuario): void {
        if (!usuario.status) {
            usuario.status = 'active';
        }
        if (usuario.status === 'active' && !usuario.login) {
            const primeiroNome = usuario.userName.trim().split(' ')[0].toLowerCase();
            const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
            const ultimosQuatro = telefoneNumeros.slice(-4);
            const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : '0000';
            usuario.login = `${primeiroNome}${sufixo}`;
            usuario.password = '123456';
        }

        const fallbackId = `user_${Date.now()}`;
        this.salvarUsuarioFirestore(fallbackId, usuario);
    }

    ativarUsuario(index: number): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
            const usuario = { ...usuariosAtuais[index] };
            usuario.status = 'active';
            
            if (!usuario.login) {
                const primeiroNome = usuario.userName.trim().split(' ')[0].toLowerCase();
                const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
                const ultimosQuatro = telefoneNumeros.slice(-4);
                const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : '0000';
                usuario.login = `${primeiroNome}${sufixo}`;
                usuario.password = '123456';
            }

            const docId = usuario.login || `temp_${index}`;
            this.salvarUsuarioFirestore(docId, usuario);
        }
    }

    atualizarSenha(login: string, novaSenha: string): boolean {
        const usuariosAtuais = this.usuariosSubject.value;
        const index = usuariosAtuais.findIndex(u => u.login === login);
        if (index !== -1) {
            const usuario = { ...usuariosAtuais[index] };
            usuario.password = novaSenha;
            this.salvarUsuarioFirestore(usuario.login!, usuario);
            return true;
        }
        return false;
    }

    atualizarUsuario(index: number, usuarioAtualizado: Usuario): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
            const credenciaisAntigas = {
                login: usuariosAtuais[index].login,
                password: usuariosAtuais[index].password
            };
            const merged = { ...credenciaisAntigas, ...usuarioAtualizado };
            this.salvarUsuarioFirestore(merged.login!, merged);
        }
    }

    atualizarPerfilPorLogin(login: string, novosDados: Partial<Usuario>): void {
        const usuarios = this.usuariosSubject.value;
        const index = usuarios.findIndex(u => u.login === login);
        if (index !== -1) {
            const merged = { ...usuarios[index], ...novosDados };
            this.salvarUsuarioFirestore(login, merged);
        }
    }

    removerUsuario(index: number): void {
        const usuariosAtuais = this.usuariosSubject.value;
        if (index >= 0 && index < usuariosAtuais.length) {
             const userToDelete = usuariosAtuais[index];
             if (userToDelete.login) {
                 const usuarioDoc = doc(this.firestore, `usuarios/${userToDelete.login}`);
                 deleteDoc(usuarioDoc);
             }
        }
    }

    getQuantidadeUsuarios(): number {
        return this.usuariosSubject.value.length;
    }

    limparDados(): void {
        this.usuariosSubject.next([]);
    }
}
