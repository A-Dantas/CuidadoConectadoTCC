import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCuidador2Component } from './menu-cuidador-2.component';

describe('MenuCuidador2Component', () => {
  let component: MenuCuidador2Component;
  let fixture: ComponentFixture<MenuCuidador2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCuidador2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuCuidador2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
