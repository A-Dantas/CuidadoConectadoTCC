import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer_home/footer.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    CommonModule,
    FooterComponent,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  pictures: string[] = [
    'img/carrosel/foto_carrosel_4.jpg',
    'img/carrosel/foto_carrosel_3.jpg',
    'img/carrosel/foto_carrosel_1.jpg',
    'img/carrosel/foto_carrosel_5.jpg',
    'img/carrosel/foto_carrosel_2.jpg',
  ];

  position: number = 0;
  private autoSlideTimeout: any;
  private timerStart: number = 0;
  private remainingTime: number = 4000;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get currentImage(): string {
    return this.pictures[this.position];
  }

  moveRight(): void {
    if (this.position >= this.pictures.length - 1) {
      this.position = 0;
    } else {
      this.position++;
    }
    this.resetTimer();
  }

  moveLeft(): void {
    if (this.position < 1) {
      this.position = this.pictures.length - 1;
    } else {
      this.position--;
    }
    this.resetTimer();
  }

  startAutoSlide(): void {
    this.clearTimer();
    this.timerStart = Date.now();

    this.autoSlideTimeout = setTimeout(() => {
      // Auto move logic
      if (this.position >= this.pictures.length - 1) {
        this.position = 0;
      } else {
        this.position++;
      }

      // After auto move, reset time to full 4s for next slide
      this.remainingTime = 4000;
      this.startAutoSlide();
    }, this.remainingTime);
  }

  pauseAutoSlide(): void {
    if (this.autoSlideTimeout) {
      clearTimeout(this.autoSlideTimeout);
      this.autoSlideTimeout = null;
      // Calculate remaining time
      this.remainingTime -= Date.now() - this.timerStart;
    }
  }

  clearTimer(): void {
    if (this.autoSlideTimeout) {
      clearTimeout(this.autoSlideTimeout);
      this.autoSlideTimeout = null;
    }
  }

  resetTimer(): void {
    this.clearTimer();
    this.remainingTime = 4000;
    this.startAutoSlide();
  }
}
