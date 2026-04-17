import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCuidador3Component } from './menu-cuidador-3.component';

describe('MenuCuidador3Component', () => {
  let component: MenuCuidador3Component;
  let fixture: ComponentFixture<MenuCuidador3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCuidador3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuCuidador3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
