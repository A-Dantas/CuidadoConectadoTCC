import { Component, EventEmitter, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../services/sidebar.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu-lateral-system',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-lateral-system.component.html',
  styleUrl: './menu-lateral-system.component.css'
})
export class MenuLateralSystemComponent implements OnInit, OnDestroy {
  menuSelecionado: number = 1;
  userRole: string | null = null;
  isOpen: boolean = false;
  
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private sub?: Subscription;

  @Output() menuSelecionadoChange = new EventEmitter<number>();

  ngOnInit() {
    this.userRole = this.authService.perfil();
    
    this.sub = this.sidebarService.sidebarOpen$.subscribe(open => {
      this.isOpen = open;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  selecionarMenu(numeroMenu: number): void {
    this.menuSelecionado = numeroMenu;
    this.menuSelecionadoChange.emit(numeroMenu);
    
    if (window.innerWidth <= 768) {
      this.sidebarService.setSidebarState(false);
    }
  }

  closeSidebar(): void {
    this.sidebarService.setSidebarState(false);
  }
}
