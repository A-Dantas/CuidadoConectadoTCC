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
    tipoChavePix?: string;
    firestore_id?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private usuariosSubject = new BehaviorSubject<Usuario[]>(INITIAL_USUARIOS as Usuario[]);
    public usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();
    private firestore = inject(Firestore);
    private usuariosCollection = collection(this.firestore, 'usuarios');
    private firstLoad = true;
    private notificationService = inject(NotificationService);

    // Rastreamento de novidades
    private vistosIds = new Set<string>();
    private novosIds = new Set<string>();

    constructor() { 
        this.carregarUsuarios();
    }

    private normalizarTexto(texto: string): string {
        return texto.normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/\s+/g, '') // remove espaços
                    .replace(/[^a-z0-9]/g, ''); // remove tudo que não for alfanumérico
    }

    private carregarUsuarios(): void {
        collectionData(this.usuariosCollection, { idField: 'firestore_id' }).subscribe({
            next: (usuarios: any[]) => {
                console.log('🔄 Firestore Sync (Usuários):', usuarios.length, 'registros recebidos do servidor.');
                
                if (usuarios.length === 0 && this.firstLoad) {
                    this.firstLoad = false;
                    console.log('🌱 Banco remoto vazio. Semeando dados iniciais no Firestore...');
                    // Nota: O Subject já contém INITIAL_USUARIOS por conta da inicialização otimista.

                    INITIAL_USUARIOS.forEach(u => {
                        const loginRef = u.login || `user_${Date.now()}_${Math.random()}`;
                        this.salvarUsuarioFirestore(loginRef, u);
                    });
                } else {
                    // Detecção Inteligente de Novidades
                    const novosItensEncontrados: any[] = [];
                    
                    usuarios.forEach(u => {
                        const id = u.firestore_id || u.login;
                        if (!this.vistosIds.has(id)) {
                            if (!this.firstLoad) {
                                this.novosIds.add(id);
                                novosItensEncontrados.push(u);
                            }
                            this.vistosIds.add(id);
                        }
                    });

                    if (novosItensEncontrados.length > 0) {
                        const temNovosPendentes = novosItensEncontrados.some(u => u.status === 'pending');
                        const temNovosAtivos = novosItensEncontrados.some(u => u.status === 'active');

                        if (temNovosAtivos) this.notificationService.setDot('Usuários', true);
                        if (temNovosPendentes) this.notificationService.setDot('Currículos', true); 
                    }

                    this.firstLoad = false;
                    // Atualiza o subject com os dados reais do Firestore (sobrescreve os dados otimistas se necessário)
                    this.usuariosSubject.next(usuarios as Usuario[]);
                }
            },
            error: (err) => {
                console.error('❌ Erro na subscrição do Firestore (Usuários):', err);
            }
        });
    }

    private async salvarUsuarioFirestore(id: string, usuario: Usuario) {
        if (!usuario.login) {
             const primeiroNome = this.normalizarTexto(usuario.userName?.trim().split(' ')[0] || 'user');
             const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
             const ultimosQuatro = telefoneNumeros.slice(-4);
             const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : Math.floor(1000 + Math.random() * 9000).toString();
             usuario.login = `${primeiroNome}${sufixo}`;
        }
        
        // Deep clean undefined fields that Firestore rejects
        const cleanUsuario = JSON.parse(JSON.stringify(usuario));

        // Prio 1: login normalizado | Prio 2: ID sugerido normalizado | Prio 3: id randômico
        const docId = cleanUsuario.login ? this.normalizarTexto(cleanUsuario.login) : this.normalizarTexto(id);

        console.log(`💾 Tentando salvar usuário no Firestore. ID: ${docId}`, cleanUsuario);

        const usuarioDoc = doc(this.firestore, `usuarios/${docId}`);
        try {
            await setDoc(usuarioDoc, cleanUsuario);
            console.log(`✅ Usuário ${docId} salvo com sucesso no Firestore.`);
        } catch (error) {
            console.error(`❌ Erro ao salvar usuário ${docId} no Firestore:`, error);
        }
    }

    getUsuarios(): Observable<Usuario[]> {
        return this.usuarios$;
    }

    getUsuariosAtuais(): Usuario[] {
        return this.usuariosSubject.value;
    }

    isNovo(usuario: Usuario): boolean {
        const id = usuario.firestore_id || usuario.login;
        return id ? this.novosIds.has(id) : false;
    }

    limparDestaques(status?: 'pending' | 'active'): void {
        // Limpar os pontos de notificação IMEDIATAMENTE
        if (status === 'active') this.notificationService.clearDot('Usuários');
        if (status === 'pending') this.notificationService.clearDot('Currículos');
        if (!status) {
            this.notificationService.clearDot('Usuários');
            this.notificationService.clearDot('Currículos');
        }

        // Aguardar 5 segundos antes de limpar os IDs de destaque para dar tempo da animação rodar
        setTimeout(() => {
            const usuariosParaLimpar = this.usuariosSubject.value.filter(u => !status || u.status === status);
            usuariosParaLimpar.forEach(u => {
                const id = u.firestore_id || u.login;
                if (id) this.novosIds.delete(id);
            });
        }, 5000);
    }

    adicionarUsuario(usuario: Usuario): void {
        if (!usuario.status) {
            usuario.status = 'active';
        }
        if (usuario.status === 'active' && !usuario.login) {
            const nomeBase = usuario.userName ? usuario.userName.trim().split(' ')[0] : 'user';
            const primeiroNome = this.normalizarTexto(nomeBase);
            const telefoneNumeros = usuario.telefone ? usuario.telefone.replace(/\D/g, '') : '';
            const ultimosQuatro = telefoneNumeros.slice(-4);
            const sufixo = ultimosQuatro.length === 4 ? ultimosQuatro : Math.floor(1000 + Math.random() * 9000).toString();
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
