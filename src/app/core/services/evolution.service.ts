import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';

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
  private evolutionSubject = new BehaviorSubject<EvolutionEntry[]>([]);
  public evolutions$: Observable<EvolutionEntry[]> = this.evolutionSubject.asObservable();
  private firestore = inject(Firestore);
  private evolutionCollection = collection(this.firestore, 'evolutions');
  private firstLoad = true;
  private notificationService = inject(NotificationService);

  constructor() {
    this.carregarEvolutions();
  }

  private carregarEvolutions(): void {
    collectionData(this.evolutionCollection, { idField: 'id' }).subscribe((entries: any[]) => {
       if (!this.firstLoad) {
           this.notificationService.setDot('Prontuários', true);
           this.notificationService.setDot('Linha do Tempo', true);
       }
       this.firstLoad = false;
       this.evolutionSubject.next(entries as EvolutionEntry[]);
    });
  }

  getEvolutionsByPatient(patientCpf: string): EvolutionEntry[] {
    return this.evolutionSubject.value
      .filter(e => e.patientCpf === patientCpf)
      .sort((a, b) => {
        const dateA = this.parseDateTime(a.date, a.time);
        const dateB = this.parseDateTime(b.date, b.time);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async addEvolution(entry: EvolutionEntry): Promise<void> {
    const id = Date.now().toString() + '_' + Math.floor(Math.random()*1000);
    const newEntry = { ...entry, id };
    const cleanEntry = JSON.parse(JSON.stringify(newEntry));
    const evolutionDoc = doc(this.firestore, `evolutions/${id}`);
    await setDoc(evolutionDoc, cleanEntry);
  }

  resetEvolutions(): void {
    this.evolutionSubject.next([]);
  }

  private parseDateTime(dateBR: string, time: string): Date {
    const [d, m, y] = dateBR.split('/').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  }
}
