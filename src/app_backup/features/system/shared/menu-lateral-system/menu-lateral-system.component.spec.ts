import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuLateralSystemComponent } from './menu-lateral-system.component';

describe('MenuLateralSystemComponent', () => {
  let component: MenuLateralSystemComponent;
  let fixture: ComponentFixture<MenuLateralSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateralSystemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuLateralSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
