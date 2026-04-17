import { Component } from '@angular/core';
import { HeaderSystemComponent } from "../shared/header-system/header-system.component";
import { MenuLateralSystemComponent } from "../shared/menu-lateral-system/menu-lateral-system.component";
import { Menu1Component } from './menu1/menu1.component';
import { Menu2Component } from "./menu2/menu2.component";
import { Menu3Component } from "./menu3/menu3.component";
import { Menu4Component } from "./menu4/menu4.component";
import { Menu5Component } from "./menu5/menu5.component";
import { UsuarioService } from './usuario.service';
import { PacienteService } from './paciente.service';
import { ScheduleService } from '../../../../core/services/schedule.service';

@Component({
  selector: 'app-gestor',
  imports: [HeaderSystemComponent, MenuLateralSystemComponent, Menu1Component, Menu2Component, Menu3Component, Menu4Component, Menu5Component],
  templateUrl: './gestor.component.html',
  styleUrl: './gestor.component.css'
})
export class GestorComponent {
  menuAtivo: number = 1;

  constructor(
    private usuarioService: UsuarioService,
    private pacienteService: PacienteService,
    private scheduleService: ScheduleService
  ) {}

  onMenuChange(numeroMenu: number): void {
    this.menuAtivo = numeroMenu;

    // Limpar notificações e destaques ao visitar as abas
    if (numeroMenu === 2) {
      this.pacienteService.limparDestaques();
    } else if (numeroMenu === 3) {
      this.usuarioService.limparDestaques('active');
    } else if (numeroMenu === 4) {
      this.scheduleService.limparDestaques();
    } else if (numeroMenu === 5) {
      this.usuarioService.limparDestaques('pending');
    }
  }
}
