import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioService, Usuario } from '../gestor/usuario.service';
import { EvolutionService, EvolutionEntry } from '../../../core/services/evolution.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { PacienteService, Paciente } from '../gestor/paciente.service';
import { HeaderSystemComponent } from '../shared/header-system/header-system.component';
import { MenuLateralSystemComponent } from '../shared/menu-lateral-system/menu-lateral-system.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cuidador',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderSystemComponent, MenuLateralSystemComponent],
  templateUrl: './cuidador.component.html',
  styleUrl: './cuidador.component.css'
})
export class CuidadorComponent implements OnInit, OnDestroy {
  usuarioCuidador: Usuario | null = null;
  meusPlantoes: any[] = [];
  plantaoAtual: any = null;
  pacientesList: Paciente[] = [];
  private scheduleSub: Subscription | null = null;
  
  // Form Evolution
  novaEvolucao: EvolutionEntry = {
    patientCpf: '',
    cuidadorName: '',
    date: '',
    time: '',
    note: '',
    category: 'Outros',
    important: false
  };

  menuAtivo: number = 1;
  sidebarAberta: boolean = true;
  modalEvolucaoAberto: boolean = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private scheduleService: ScheduleService,
    private evolutionService: EvolutionService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    const login = this.authService.getUsuarioAtualLogin();
    if (login) {
      const usuarios = this.usuarioService.getUsuariosAtuais();
      this.usuarioCuidador = usuarios.find(u => u.login === login) || null;
      this.pacientesList = this.pacienteService.getPacientesValue();
      
      if (this.usuarioCuidador) {
        // Real-time synchronization subscription
        this.scheduleSub = this.scheduleService.getSchedules().subscribe(allSchedules => {
           this.carregarMeusPlantoes(allSchedules);
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.scheduleSub) {
      this.scheduleSub.unsubscribe();
    }
  }

  carregarMeusPlantoes(allSchedules: { [key: string]: any[] }): void {
    const calendar = allSchedules[this.usuarioCuidador!.userName] || [];
    const hoje = new Date().getDate();

    this.meusPlantoes = [];
    calendar.filter((d: any) => d.number !== null && d.selectedPatients && d.selectedPatients.some((p: string) => p !== '')).forEach((dia: any) => {
      dia.selectedPatients.forEach((paciente: string, index: number) => {
        if (paciente) {
          const entry = {
            dia: dia.number,
            paciente: paciente,
            horario: dia.selectedShifts ? dia.selectedShifts[index] : 'N/A',
            status: (dia.selectedStatuses && dia.selectedStatuses[index]) || 'confirmed'
          };
          this.meusPlantoes.push(entry);
          if (dia.number === hoje) {
            this.plantaoAtual = entry;
          }
        }
      });
    });

    this.meusPlantoes.sort((a, b) => a.dia - b.dia);
  }

  abrirModalEvolucao(plantao: any): void {
    const pacienteObj = this.pacientesList.find(p => p.nomePaciente === plantao.paciente);
    
    this.novaEvolucao = {
      patientCpf: pacienteObj?.cpf || '',
      cuidadorName: this.usuarioCuidador?.userName || '',
      date: this.getDataHojeBR(),
      time: this.getHoraAtual(),
      note: '',
      category: 'Outros',
      important: false
    };
    this.modalEvolucaoAberto = true;
  }

  salvarEvolucao(): void {
    if (this.novaEvolucao.note.trim()) {
      this.evolutionService.addEvolution(this.novaEvolucao);
      this.modalEvolucaoAberto = false;
      alert('Evolução registrada com sucesso!');
    }
  }

  getDataHojeBR(): string {
    const hoje = new Date();
    const d = hoje.getDate().toString().padStart(2, '0');
    const m = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const y = hoje.getFullYear();
    return `${d}/${m}/${y}`;
  }

  getHoraAtual(): string {
    const hoje = new Date();
    const h = hoje.getHours().toString().padStart(2, '0');
    const m = hoje.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  onMenuChange(index: number): void {
    this.menuAtivo = index;
  }

  selecionarMenu(index: number): void {
    this.menuAtivo = index;
  }

  logout(): void {
    this.authService.sair();
  }

  toggleSidebar(): void {
    this.sidebarAberta = !this.sidebarAberta;
  }

  confirmarChegada(plantao: any): void {
    if (this.usuarioCuidador) {
      this.scheduleService.updateAppointmentStatus(
        this.usuarioCuidador.userName, 
        plantao.dia, 
        plantao.paciente, 
        'arrived'
      );
      this.carregarMeusPlantoes(this.scheduleService.getSchedulesValue());
    }
  }

  finalizarPlantao(plantao: any): void {
    if (this.usuarioCuidador) {
      this.scheduleService.updateAppointmentStatus(
        this.usuarioCuidador.userName, 
        plantao.dia, 
        plantao.paciente, 
        'completed'
      );
      this.carregarMeusPlantoes(this.scheduleService.getSchedulesValue());
    }
  }
}
