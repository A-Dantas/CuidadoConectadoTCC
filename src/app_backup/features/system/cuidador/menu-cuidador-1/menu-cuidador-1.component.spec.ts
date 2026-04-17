import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCuidador1Component } from './menu-cuidador-1.component';

describe('MenuCuidador1Component', () => {
  let component: MenuCuidador1Component;
  let fixture: ComponentFixture<MenuCuidador1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCuidador1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuCuidador1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
