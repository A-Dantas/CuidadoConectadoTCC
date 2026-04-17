import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { INITIAL_SCHEDULES } from '../data/seed-data';
import { EvolutionService } from './evolution.service';

export interface ShiftEntry {
  day: number;
  patient: string;
  shift: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly STORAGE_KEY = 'calendars_data';
  private calendarsData: { [cuidadorName: string]: any[] } = {};
  private schedulesSubject = new BehaviorSubject<{ [cuidadorName: string]: any[] }>({});

  constructor(private evolutionService: EvolutionService) {
    this.loadCalendarsData();
  }

  private loadCalendarsData(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.calendarsData = JSON.parse(data);
        this.schedulesSubject.next(this.calendarsData);
      } else {
        // Apply seed data if no records exist
        this.initializeWithSeedData();
      }
    } catch (error) {
      console.error('Error loading calendars data:', error);
    }
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

  saveCalendarsData(data: { [cuidadorName: string]: any[] }): void {
    this.calendarsData = data;
    this.schedulesSubject.next(data);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  resetSchedules(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.calendarsData = {};
    this.initializeWithSeedData();
    // After re-initializing, manually trigger subjects again to be sure
    this.schedulesSubject.next(this.calendarsData);
  }

  updateAppointmentStatus(cuidadorName: string, day: number, patientName: string, status: string): void {
    const calendar = this.calendarsData[cuidadorName];
    if (!calendar) return;

    const dayObj = calendar.find((d: any) => d.number === day);
    if (dayObj) {
      const index = dayObj.selectedPatients.indexOf(patientName);
      if (index !== -1) {
        if (!dayObj.selectedStatuses) dayObj.selectedStatuses = [];
        if (!dayObj.selectedArrivedAt) dayObj.selectedArrivedAt = []; // Store arrival timestamps

        dayObj.selectedStatuses[index] = status;
        
        // Record timestamp specifically if they just arrived and we don't have one
        if (status === 'arrived' && !dayObj.selectedArrivedAt[index]) {
            // Se for pra testar mais rápido na apresentação, você pode colocar "new Date().getTime() - (30 * 60000)" pra adiantar
            dayObj.selectedArrivedAt[index] = new Date().toISOString();
        } else if (status !== 'arrived' && status !== 'completed') {
            // Reset if they cancel the arrival
            dayObj.selectedArrivedAt[index] = null;
        }

        this.saveCalendarsData(this.calendarsData);
      }
    }
  }
}
