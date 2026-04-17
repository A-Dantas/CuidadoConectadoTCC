import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_PACIENTES } from '../../../core/data/seed-data';

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
    endereco: string; // Mantido para compatibilidade, será gerado automaticamente
    comorbidades: string;
    cuidadorAtribuido: string;
    medicoAtribuido: string;
    contatoFamiliar: string;
    
    // Novos campos
    observacoes?: string;
    foto?: string; // Base64
}


@Injectable({
    providedIn: 'root'
})
export class PacienteService {
    private readonly STORAGE_KEY = 'pacientes_data';
    private pacientesSubject = new BehaviorSubject<Paciente[]>(this.carregarPacientes());
    public pacientes$: Observable<Paciente[]> = this.pacientesSubject.asObservable();

    constructor() { }

    private carregarPacientes(): Paciente[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            } else {
                // Se não houver dados, carregar seed data e salvar
                const seedData = INITIAL_PACIENTES;
                this.salvarPacientes(seedData);
                return seedData;
            }
        } catch (error) {
            console.error('Erro ao carregar pacientes do localStorage:', error);
            return [];
        }
    }

    private salvarPacientes(pacientes: Paciente[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pacientes));
        } catch (error) {
            console.error('Erro ao salvar pacientes no localStorage:', error);
        }
    }

    getPacientes(): Observable<Paciente[]> {
        return this.pacientes$;
    }

    adicionarPaciente(paciente: Paciente): void {
        const pacientesAtuais = this.pacientesSubject.value;
        const novosPacientes = [...pacientesAtuais, paciente];
        this.pacientesSubject.next(novosPacientes);
        this.salvarPacientes(novosPacientes);
    }

    editarPaciente(index: number, paciente: Paciente): void {
        const pacientesAtuais = this.pacientesSubject.value;
        if (index >= 0 && index < pacientesAtuais.length) {
            pacientesAtuais[index] = { ...paciente };
            const novosPacientes = [...pacientesAtuais];
            this.pacientesSubject.next(novosPacientes);
            this.salvarPacientes(novosPacientes);
        }
    }

    excluirPaciente(index: number): void {
        const pacientesAtuais = this.pacientesSubject.value;
        if (index >= 0 && index < pacientesAtuais.length) {
            pacientesAtuais.splice(index, 1);
            const novosPacientes = [...pacientesAtuais];
            this.pacientesSubject.next(novosPacientes);
            this.salvarPacientes(novosPacientes);
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
        const pacientes = this.pacientesSubject.value;
        const index = pacientes.findIndex(p => p.cpf === cpf);
        
        if (index !== -1) {
            const novosPacientes = [...pacientes];
            novosPacientes[index] = { ...novosPacientes[index], ...novosDados };
            
            // Recalcular endereço completo se necessário
            if (novosDados.rua || novosDados.numero || novosDados.bairro || novosDados.cidade) {
                const p = novosPacientes[index];
                novosPacientes[index].endereco = `${p.rua}, ${p.numero} - ${p.bairro}, ${p.cidade} - ${p.estado}`;
            }

            this.pacientesSubject.next(novosPacientes);
            this.salvarPacientes(novosPacientes);
        }
    }

    limparDados(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.pacientesSubject.next([]);
    }
}
