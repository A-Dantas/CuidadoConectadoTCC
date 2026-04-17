import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { PacienteService, Paciente } from '../gestor/paciente.service';
import { EvolutionService, EvolutionEntry } from '../../../core/services/evolution.service';
import { UsuarioService, Usuario } from '../gestor/usuario.service';
import { HeaderSystemComponent } from '../shared/header-system/header-system.component';
import { MenuLateralSystemComponent } from '../shared/menu-lateral-system/menu-lateral-system.component';

@Component({
  selector: 'app-medico',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderSystemComponent, MenuLateralSystemComponent],
  templateUrl: './medico.component.html',
  styleUrl: './medico.component.css'
})
export class MedicoComponent implements OnInit {
  usuarioMedico: Usuario | null = null;
  pacientesSobAcompanhamento: Paciente[] = [];
  pacienteSelecionado: Paciente | null = null;
  evolutions: EvolutionEntry[] = [];
  
  menuAtivo: number = 1;
  sidebarAberta: boolean = true;

  constructor(
    private authService: AuthService,
    private pacienteService: PacienteService,
    private evolutionService: EvolutionService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const login = this.authService.getUsuarioAtualLogin();
    if (login) {
      const usuarios = this.usuarioService.getUsuariosAtuais();
      this.usuarioMedico = usuarios.find(u => u.login === login) || null;
      
      if (this.usuarioMedico) {
        this.carregarPacientes();
      }
    }
  }

  carregarPacientes(): void {
    const allPacientes = this.pacienteService.getPacientesValue();
    // Filtra pacientes onde o médico atribuído é o atual
    this.pacientesSobAcompanhamento = allPacientes.filter(p => 
      p.medicoAtribuido === this.usuarioMedico?.userName
    );
  }

  selecionarPaciente(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    this.evolutions = this.evolutionService.getEvolutionsByPatient(paciente.cpf!);
    this.menuAtivo = 2; // Muda para a vista de evolução
  }

  onMenuChange(index: number): void {
    this.menuAtivo = index;
    if (index === 1) this.pacienteSelecionado = null;
  }

  selecionarMenu(index: number): void {
    this.menuAtivo = index;
    if (index === 1) this.pacienteSelecionado = null;
  }

  logout(): void {
    this.authService.sair();
  }

  toggleSidebar(): void {
    this.sidebarAberta = !this.sidebarAberta;
  }
}
