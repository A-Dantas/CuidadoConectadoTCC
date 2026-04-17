import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MensagemGeral {
    texto: string;
    autor: string;
    hora: string;
    data?: string; // Format: DD/MM/YYYY
}

export interface MensagemDireta {
    texto: string;
    autor: string;
    hora: string;
    data?: string;
    lida: boolean;
}

export interface MapaMensagensDiretas {
    [usuarioId: string]: MensagemDireta[];
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private readonly STORAGE_KEY_GERAL = 'chat_mensagens_gerais';
    private readonly STORAGE_KEY_DIRETAS = 'chat_mensagens_diretas';

    private mensagensGeraisSubject = new BehaviorSubject<MensagemGeral[]>(this.carregarMensagensGerais());
    public mensagensGerais$: Observable<MensagemGeral[]> = this.mensagensGeraisSubject.asObservable();

    private mensagensDiretasSubject = new BehaviorSubject<MapaMensagensDiretas>(this.carregarMensagensDiretas());
    public mensagensDiretas$: Observable<MapaMensagensDiretas> = this.mensagensDiretasSubject.asObservable();

    constructor() { }

    // --- Mensagens Gerais ---

    private carregarMensagensGerais(): MensagemGeral[] {
        const stored = sessionStorage.getItem(this.STORAGE_KEY_GERAL);
        return stored ? JSON.parse(stored) : [];
    }

    getMensagensGerais(): MensagemGeral[] {
        return this.mensagensGeraisSubject.value;
    }

    adicionarMensagemGeral(mensagem: MensagemGeral): void {
        const mensagensAtuais = this.mensagensGeraisSubject.value;
        const novasMensagens = [...mensagensAtuais, mensagem];
        this.mensagensGeraisSubject.next(novasMensagens);
        sessionStorage.setItem(this.STORAGE_KEY_GERAL, JSON.stringify(novasMensagens));
    }

    getUltimasMensagens(quantidade: number = 3): MensagemGeral[] {
        const mensagens = this.mensagensGeraisSubject.value;
        return mensagens.slice(-quantidade);
    }

    // --- Mensagens Diretas ---

    private carregarMensagensDiretas(): MapaMensagensDiretas {
        const stored = sessionStorage.getItem(this.STORAGE_KEY_DIRETAS);
        return stored ? JSON.parse(stored) : {};
    }

    getMensagensDiretas(usuarioId: string): MensagemDireta[] {
        return this.mensagensDiretasSubject.value[usuarioId] || [];
    }

    adicionarMensagemDireta(usuarioId: string, mensagem: MensagemDireta): void {
        const mapaAtual = this.mensagensDiretasSubject.value;
        const mensagensUsuario = mapaAtual[usuarioId] || [];

        const novoMapa = {
            ...mapaAtual,
            [usuarioId]: [...mensagensUsuario, mensagem]
        };

        this.mensagensDiretasSubject.next(novoMapa);
        sessionStorage.setItem(this.STORAGE_KEY_DIRETAS, JSON.stringify(novoMapa));
    }

    marcarComoLidas(usuarioId: string): void {
        const mapaAtual = this.mensagensDiretasSubject.value;
        if (!mapaAtual[usuarioId]) return;

        const mensagensAtualizadas = mapaAtual[usuarioId].map(msg => ({ ...msg, lida: true }));

        const novoMapa = {
            ...mapaAtual,
            [usuarioId]: mensagensAtualizadas
        };

        this.mensagensDiretasSubject.next(novoMapa);
        sessionStorage.setItem(this.STORAGE_KEY_DIRETAS, JSON.stringify(novoMapa));
    }
}
