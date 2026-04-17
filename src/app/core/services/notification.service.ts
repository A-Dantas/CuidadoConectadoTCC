import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private menuDots = new BehaviorSubject<{ [menuName: string]: boolean }>({});
  public menuDots$: Observable<{ [menuName: string]: boolean }> = this.menuDots.asObservable();

  setDot(menuName: string, value: boolean) {
    const current = this.menuDots.value;
    if (current[menuName] !== value) {
      this.menuDots.next({ ...current, [menuName]: value });
    }
  }

  clearDot(menuName: string) {
    this.setDot(menuName, false);
  }
}
