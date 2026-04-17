import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioService, Usuario } from '../gestor/usuario.service';
import { PacienteService, Paciente } from '../gestor/paciente.service';
import { EvolutionService, EvolutionEntry } from '../../../core/services/evolution.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { HeaderSystemComponent } from '../shared/header-system/header-system.component';
import { MenuLateralSystemComponent } from '../shared/menu-lateral-system/menu-lateral-system.component';
import { Menu1FamiliarComponent } from './menu1-familiar/menu1-familiar.component';
import { Menu2FamiliarComponent } from './menu2-familiar/menu2-familiar.component';
import { Menu3FamiliarComponent } from './menu3-familiar/menu3-familiar.component';

@Component({
  selector: 'app-familiar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HeaderSystemComponent, 
    MenuLateralSystemComponent,
    Menu1FamiliarComponent,
    Menu2FamiliarComponent,
    Menu3FamiliarComponent
  ],
  templateUrl: './familiar.component.html',
  styleUrl: './familiar.component.css'
})
export class FamiliarComponent implements OnInit {
  usuarioFamiliar: Usuario | null = null;
  pacienteVinculado: Paciente | null = null;
  evolutions: EvolutionEntry[] = [];
  proximosPlantoes: any[] = [];
  
  menuAtivo: number = 1;
  sidebarAberta: boolean = true;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private pacienteService: PacienteService,
    private evolutionService: EvolutionService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    const login = this.authService.getUsuarioAtualLogin();
    if (login) {
      const usuarios = this.usuarioService.getUsuariosAtuais();
      this.usuarioFamiliar = usuarios.find(u => u.login === login) || null;
      
      if (this.usuarioFamiliar?.cpfPacienteResponsavel) {
        this.isLoading = true;
        
        // Subscribe to patient changes to keep the dashboard updated reactively
        this.pacienteService.pacientes$.subscribe(pacientes => {
          this.pacienteVinculado = pacientes.find(p => p.cpf === this.usuarioFamiliar!.cpfPacienteResponsavel) || null;
          
          if (this.pacienteVinculado) {
            this.carregarDadosPaciente();
          } else {
            this.isLoading = false;
          }
        });
      }
    }
  }

  carregarDadosPaciente(): void {
    if (!this.pacienteVinculado) return;

    // Carregar Evoluções
    this.evolutions = this.evolutionService.getEvolutionsByPatient(this.pacienteVinculado.cpf!);

    // Carregar Agenda do Idoso
    this.scheduleService.getSchedules().subscribe(allSchedules => {
      this.proximosPlantoes = [];
      const todayDate = new Date();
      const today = todayDate.getDate();
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(today - 1);
      const yesterday = yesterdayDate.getDate();
      
      const usuarios = this.usuarioService.getUsuariosAtuais();
      
      for (const cuidadorName in allSchedules) {
        const calendar = allSchedules[cuidadorName];
        const cuidadorInfo = usuarios.find(u => u.userName === cuidadorName);
        const cuidadorFoto = cuidadorInfo?.fotoPerfil || '';
        
        calendar.forEach((dia: any) => {
          if (!dia.number || !dia.selectedPatients) return;
          
          // Se for dia anterior, só nos interessa se o plantão cruza a meia-noite
          const isYesterday = dia.number === yesterday;
          const isTodayOrFuture = dia.number >= today;
          
          if (!isYesterday && !isTodayOrFuture) return;

          dia.selectedPatients.forEach((nome: string, index: number) => {
            if (nome === this.pacienteVinculado!.nomePaciente) {
              const shiftCode = dia.selectedShifts[index];
              
              // Filtro para ontem: só turnos SN ou 24H
              if (isYesterday && !['SN', '24H_7H', '24H_19H'].includes(shiftCode)) {
                return;
              }

              this.proximosPlantoes.push({
                dia: dia.number,
                cuidador: cuidadorName,
                cuidadorFoto: cuidadorFoto,
                horario: shiftCode,
                status: (dia.selectedStatuses && dia.selectedStatuses[index]) || 'confirmed',
                arrivedAt: (dia.selectedArrivedAt && dia.selectedArrivedAt[index]) || null,
                isStartedYesterday: isYesterday
              });
            }
          });
        });
      }
      
      // Ordenar por dia (considerando virada de mês/dia de forma simples aqui, já que dia é apenas number)
      // Nota: Em um sistema real usaríamos timestamps completos.
      this.proximosPlantoes.sort((a, b) => {
        if (a.isStartedYesterday && !b.isStartedYesterday) return -1;
        if (!a.isStartedYesterday && b.isStartedYesterday) return 1;
        return a.dia - b.dia;
      });
      this.isLoading = false;
    });
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
}
