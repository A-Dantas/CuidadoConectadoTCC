import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [RouterModule, RouterLink, NgIf],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  menuBranco = false;
  isHome = false;
  mobileMenuOpen = false;

  constructor(private router: Router) {
    // Check initial route
    this.checkRoute();

    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkRoute();
      this.mobileMenuOpen = false; // Close mobile menu on route change
    });
  }

  ngOnInit() {
    this.checkRoute();
  }

  private checkRoute() {
    this.isHome = this.router.url === '/' || this.router.url === '/home' || this.router.url.startsWith('/home#');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.menuBranco = window.scrollY > 80;
  }
}
