import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EvolutionEntry {
  id?: string;
  patientCpf: string;
  cuidadorName: string;
  date: string; // DD/MM/AAAA
  time: string; // HH:mm
  note: string;
  category: 'Humor' | 'Alimentação' | 'Medicamento' | 'Higiene' | 'Outros';
  important: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EvolutionService {
  private readonly STORAGE_KEY = 'evolution_data';
  private evolutionSubject = new BehaviorSubject<EvolutionEntry[]>(this.loadEvolutionData());
  public evolutions$: Observable<EvolutionEntry[]> = this.evolutionSubject.asObservable();

  constructor() { }

  private loadEvolutionData(): EvolutionEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading evolution data:', error);
      return [];
    }
  }

  private saveEvolutionData(entries: EvolutionEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving evolution data:', error);
    }
  }

  getEvolutionsByPatient(patientCpf: string): EvolutionEntry[] {
    return this.evolutionSubject.value
      .filter(e => e.patientCpf === patientCpf)
      .sort((a, b) => {
        // Sort by date and time descending
        const dateA = this.parseDateTime(a.date, a.time);
        const dateB = this.parseDateTime(b.date, b.time);
        return dateB.getTime() - dateA.getTime();
      });
  }

  addEvolution(entry: EvolutionEntry): void {
    const current = this.evolutionSubject.value;
    const newEntry = { ...entry, id: Date.now().toString() };
    const updated = [newEntry, ...current];
    this.evolutionSubject.next(updated);
    this.saveEvolutionData(updated);
  }

  resetEvolutions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.evolutionSubject.next([]);
  }

  private parseDateTime(dateBR: string, time: string): Date {
    const [d, m, y] = dateBR.split('/').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  }
}
