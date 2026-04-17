import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_SCHEDULES } from '../data/seed-data';
import { EvolutionService } from './evolution.service';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';

export interface ShiftEntry {
  day: number;
  patient: string;
  shift: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private calendarsData: { [cuidadorName: string]: any[] } = {};
  private schedulesSubject = new BehaviorSubject<{ [cuidadorName: string]: any[] }>({});
  private firestore = inject(Firestore);
  private schedulesDocRef = doc(this.firestore, 'schedules/calendarsData');
  private isSeeded = false;
  private notificationService = inject(NotificationService);

  constructor(private evolutionService: EvolutionService) {
    this.loadCalendarsData();
  }

  private loadCalendarsData(): void {
    docData(this.schedulesDocRef).subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        // Se já tínhamos dados previamente carregados, é uma notificação em tempo real
        if (Object.keys(this.calendarsData).length > 0) {
           this.notificationService.setDot('Agendar', true);
           this.notificationService.setDot('Meus Plantões', true);
           this.notificationService.setDot('Agenda', true);
        }
        this.calendarsData = data;
        this.schedulesSubject.next(this.calendarsData);
      } else {
        if (!this.isSeeded) {
          this.isSeeded = true;
          this.initializeWithSeedData();
        }
      }
    });
  }

  private initializeWithSeedData(): void {
    const seedData = INITIAL_SCHEDULES;
    const structure = this.createCalendarStructure();
    
    seedData.forEach((schedule: any) => {
      if (!this.calendarsData[schedule.cuidador]) {
        this.calendarsData[schedule.cuidador] = JSON.parse(JSON.stringify(structure));
      }

      const calendar = this.calendarsData[schedule.cuidador];
      const dayObj = calendar.find((d: any) => d.number === schedule.day);

      if (dayObj) {
        if (dayObj.selectedPatients[0] === '') {
          dayObj.selectedPatients[0] = schedule.patient;
          dayObj.selectedShifts[0] = schedule.shift;
        } else {
          dayObj.selectedPatients.push(schedule.patient);
          dayObj.selectedShifts.push(schedule.shift);
        }
      }
    });

    this.saveCalendarsData(this.calendarsData);
  }

  private createCalendarStructure(): any[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const offset = (firstDayIndex + 6) % 7;

    const calendarDays = [];
    for (let i = 0; i < offset; i++) {
        calendarDays.push({ number: null, events: [] });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            number: i,
            events: [],
            selectedPatients: [''],
            selectedShifts: [''],
            selectedStatuses: ['confirmed']
        });
    }
    return calendarDays;
  }

  getSchedules(): Observable<{ [cuidadorName: string]: any[] }> {
    return this.schedulesSubject.asObservable();
  }

  getSchedulesValue(): { [cuidadorName: string]: any[] } {
    return this.schedulesSubject.value;
  }

  getSchedulesByCuidador(cuidadorName: string): any[] {
    return this.schedulesSubject.value[cuidadorName] || [];
  }

  async saveCalendarsData(data: { [cuidadorName: string]: any[] }): Promise<void> {
    const cleanData = JSON.parse(JSON.stringify(data));
    this.calendarsData = cleanData;
    this.schedulesSubject.next(cleanData);
    await setDoc(this.schedulesDocRef, cleanData);
  }

  resetSchedules(): void {
    this.calendarsData = {};
    this.initializeWithSeedData();
  }

  updateAppointmentStatus(cuidadorName: string, day: number, patientName: string, status: string): void {
    const calendar = this.calendarsData[cuidadorName];
    if (!calendar) return;

    const dayObj = calendar.find((d: any) => d.number === day);
    if (dayObj) {
      const index = dayObj.selectedPatients.indexOf(patientName);
      if (index !== -1) {
        if (!dayObj.selectedStatuses) dayObj.selectedStatuses = [];
        if (!dayObj.selectedArrivedAt) dayObj.selectedArrivedAt = []; 

        dayObj.selectedStatuses[index] = status;
        
        if (status === 'arrived' && !dayObj.selectedArrivedAt[index]) {
            dayObj.selectedArrivedAt[index] = new Date().toISOString();
        } else if (status !== 'arrived' && status !== 'completed') {
            dayObj.selectedArrivedAt[index] = null;
        }

        this.saveCalendarsData(this.calendarsData);
      }
    }
  }
}
