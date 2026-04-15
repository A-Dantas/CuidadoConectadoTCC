import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCuidador4Component } from './menu-cuidador-4.component';

describe('MenuCuidador4Component', () => {
  let component: MenuCuidador4Component;
  let fixture: ComponentFixture<MenuCuidador4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCuidador4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuCuidador4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
