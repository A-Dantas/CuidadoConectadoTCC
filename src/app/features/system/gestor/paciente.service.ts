import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_PACIENTES } from '../../../core/data/seed-data';
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { NotificationService } from '../../../core/services/notification.service';

export interface Paciente {
    nomePaciente: string;
    cpf?: string;
    dataNascimento?: string;
    idade: number | null;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    endereco: string;
    comorbidades: string;
    cuidadorAtribuido: string;
    medicoAtribuido: string;
    contatoFamiliar: string;
    observacoes?: string;
    foto?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PacienteService {
    private pacientesSubject = new BehaviorSubject<Paciente[]>([]);
    public pacientes$: Observable<Paciente[]> = this.pacientesSubject.asObservable();
    private firestore = inject(Firestore);
    private pacientesCollection = collection(this.firestore, 'pacientes');
    private firstLoad = true;
    private notificationService = inject(NotificationService);

    constructor() {
        this.carregarPacientes();
    }

    private normalizarTexto(texto: string): string {
        return texto.normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/\s+/g, '') // remove espaços
                    .replace(/[^a-z0-9]/g, ''); // remove tudo que não for alfanumérico
    }

    private carregarPacientes(): void {
        collectionData(this.pacientesCollection, { idField: 'cpf_id' }).subscribe((pacientes: any[]) => {
            console.log('🔄 Sincronização Firestore (Pacientes):', pacientes.length, 'itens');
            
            if (pacientes.length === 0 && this.firstLoad) {
                this.firstLoad = false;
                console.log('🌱 Inicializando pacientes (Seed Data)...');
                
                // Emitir imediatamente para a UI
                this.pacientesSubject.next(INITIAL_PACIENTES as Paciente[]);

                INITIAL_PACIENTES.forEach(p => {
                    const cpfKey = p.cpf ? p.cpf.replace(/\D/g, '') : `paciente_${Date.now()}_${Math.random()}`;
                    this.adicionarPacienteComID(cpfKey, p);
                });
            } else {
                if (!this.firstLoad && pacientes.length > this.pacientesSubject.value.length) {
                    this.notificationService.setDot('Pacientes', true);
                    this.notificationService.setDot('Meus Pacientes', true);
                    this.notificationService.setDot('Meu Idoso', true);
                }
                this.firstLoad = false;
                this.pacientesSubject.next(pacientes as Paciente[]);
            }
        });
    }

    getPacientes(): Observable<Paciente[]> {
        return this.pacientes$;
    }

    private async adicionarPacienteComID(id: string, paciente: Paciente) {
        // Objeto limpando campos undefined
        const cleanPaciente = JSON.parse(JSON.stringify(paciente));

        const pacienteDoc = doc(this.firestore, `pacientes/${id}`);
        try {
            await setDoc(pacienteDoc, cleanPaciente);
            console.log(`Paciente ${id} salvo com sucesso no Firestore.`);
        } catch (error) {
            console.error(`Erro ao salvar paciente ${id} no Firestore:`, error);
        }
    }

    adicionarPaciente(paciente: Paciente): void {
        // Prio 1: CPF limpo | Prio 2: Nome normalizado + ID randômico
        const cpfLimpo = paciente.cpf ? paciente.cpf.replace(/\D/g, '') : '';
        const idSugerido = cpfLimpo || `${this.normalizarTexto(paciente.nomePaciente)}_${Date.now()}`;
        
        this.adicionarPacienteComID(idSugerido, paciente);
    }

    editarPaciente(index: number, paciente: Paciente): void {
        const pacientesAtuais = this.pacientesSubject.value;
        if (index >= 0 && index < pacientesAtuais.length) {
            const cpfKey = paciente.cpf ? paciente.cpf.replace(/\D/g, '') : pacientesAtuais[index].cpf?.replace(/\D/g, '');
            if (cpfKey) {
                this.adicionarPacienteComID(cpfKey, paciente);
            }
        }
    }

    excluirPaciente(index: number): void {
        const pacientesAtuais = this.pacientesSubject.value;
        if (index >= 0 && index < pacientesAtuais.length) {
            const p = pacientesAtuais[index];
            const cpfKey = p.cpf ? p.cpf.replace(/\D/g, '') : null;
            if (cpfKey) {
                const pacienteDoc = doc(this.firestore, `pacientes/${cpfKey}`);
                deleteDoc(pacienteDoc);
            }
        }
    }

    getPacienteByIndex(index: number): Paciente | null {
        const pacientesAtuais = this.pacientesSubject.value;
        if (index >= 0 && index < pacientesAtuais.length) {
            return { ...pacientesAtuais[index] };
        }
        return null;
    }

    getQuantidadePacientes(): number {
        return this.pacientesSubject.value.length;
    }

    getPacientesValue(): Paciente[] {
        return this.pacientesSubject.value;
    }

    getPacienteByCpf(cpf: string): Paciente | undefined {
        return this.pacientesSubject.value.find(p => p.cpf === cpf);
    }

    atualizarPacientePorCpf(cpf: string, novosDados: Partial<Paciente>): void {
        const pacienteAtual = this.getPacienteByCpf(cpf);
        if (pacienteAtual) {
            const cpfKey = cpf.replace(/\D/g, '');
            const pacienteAtualizado = { ...pacienteAtual, ...novosDados };
            
            if (novosDados.rua || novosDados.numero || novosDados.bairro || novosDados.cidade) {
                pacienteAtualizado.endereco = `${pacienteAtualizado.rua}, ${pacienteAtualizado.numero} - ${pacienteAtualizado.bairro}, ${pacienteAtualizado.cidade} - ${pacienteAtualizado.estado}`;
            }

            this.adicionarPacienteComID(cpfKey, pacienteAtualizado);
        }
    }

    limparDados(): void {
        // Caution! This isn't trivial with Firestore without a backend script, 
        // so we'll just leave it empty or delete locally for the demo.
        this.pacientesSubject.next([]);
    }
}
