import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';

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
    private mensagensGeraisSubject = new BehaviorSubject<MensagemGeral[]>([]);
    public mensagensGerais$: Observable<MensagemGeral[]> = this.mensagensGeraisSubject.asObservable();

    private mensagensDiretasSubject = new BehaviorSubject<MapaMensagensDiretas>({});
    public mensagensDiretas$: Observable<MapaMensagensDiretas> = this.mensagensDiretasSubject.asObservable();

    private firestore = inject(Firestore);
    private chatGeralDocRef = doc(this.firestore, 'chats/geral');
    private chatDiretasDocRef = doc(this.firestore, 'chats/diretas');

    constructor() { 
        this.carregarMensagens();
    }

    private carregarMensagens() {
        docData(this.chatGeralDocRef).subscribe((data: any) => {
            if (data && data.messages) {
                this.mensagensGeraisSubject.next(data.messages);
            }
        });

        docData(this.chatDiretasDocRef).subscribe((data: any) => {
            if (data && data.mapa) {
                this.mensagensDiretasSubject.next(data.mapa);
            }
        });
    }

    getMensagensGerais(): MensagemGeral[] {
        return this.mensagensGeraisSubject.value;
    }

    async adicionarMensagemGeral(mensagem: MensagemGeral): Promise<void> {
        const mensagensAtuais = this.mensagensGeraisSubject.value;
        const novasMensagens = [...mensagensAtuais, mensagem];
        this.mensagensGeraisSubject.next(novasMensagens);
        await setDoc(this.chatGeralDocRef, { messages: novasMensagens });
    }

    getUltimasMensagens(quantidade: number = 3): MensagemGeral[] {
        const mensagens = this.mensagensGeraisSubject.value;
        return mensagens.slice(-quantidade);
    }

    getMensagensDiretas(usuarioId: string): MensagemDireta[] {
        return this.mensagensDiretasSubject.value[usuarioId] || [];
    }

    async adicionarMensagemDireta(usuarioId: string, mensagem: MensagemDireta): Promise<void> {
        const mapaAtual = this.mensagensDiretasSubject.value;
        const mensagensUsuario = mapaAtual[usuarioId] || [];

        const novoMapa = {
            ...mapaAtual,
            [usuarioId]: [...mensagensUsuario, mensagem]
        };

        this.mensagensDiretasSubject.next(novoMapa);
        await setDoc(this.chatDiretasDocRef, { mapa: novoMapa });
    }

    async marcarComoLidas(usuarioId: string): Promise<void> {
        const mapaAtual = this.mensagensDiretasSubject.value;
        if (!mapaAtual[usuarioId]) return;

        const mensagensAtualizadas = mapaAtual[usuarioId].map(msg => ({ ...msg, lida: true }));

        const novoMapa = {
            ...mapaAtual,
            [usuarioId]: mensagensAtualizadas
        };

        this.mensagensDiretasSubject.next(novoMapa);
        await setDoc(this.chatDiretasDocRef, { mapa: novoMapa });
    }
}
