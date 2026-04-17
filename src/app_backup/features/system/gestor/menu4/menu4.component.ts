import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacienteService, Paciente } from '../paciente.service';
import { UsuarioService, Usuario } from '../usuario.service';
import { ScheduleService } from '../../../../core/services/schedule.service';

@Component({
  selector: 'app-menu4',
  imports: [CommonModule, FormsModule],
  templateUrl: './menu4.component.html',
  styleUrl: './menu4.component.css'
})
export class Menu4Component implements OnInit {
  weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  calendarDays: any[] = [];
  pacientes: Paciente[] = [];
  cuidadores: Usuario[] = [];
  filtroCuidador: string = '';

  // Store calendar data for each caregiver
  private calendarsData: { [cuidadorName: string]: any[] } = {};
  private readonly STORAGE_KEY = 'calendars_data';

  // Conflict modal
  modalConflictOpen: boolean = false;
  conflictMessage: string = '';
  conflictCuidador: string = '';

  // Observations modal
  modalObsOpen: boolean = false;
  modalHistoryOpen: boolean = false;
  currentObsText: string = '';
  currentObsDay: any = null;
  currentObsIndex: number = -1;
  currentObsHistory: any[] = [];

  constructor(
    private pacienteService: PacienteService,
    private usuarioService: UsuarioService,
    private scheduleService: ScheduleService
  ) { }

  ngOnInit(): void {
    this.pacienteService.getPacientes().subscribe(data => {
      this.pacientes = data;
    });

    this.usuarioService.getUsuarios().subscribe(usuarios => {
      this.cuidadores = usuarios.filter(u => u.role === 'Caregiver');

      this.scheduleService.getSchedules().subscribe(data => {
        this.calendarsData = data;
        
        if (this.filtroCuidador) {
          this.loadCalendarForCuidador(this.filtroCuidador);
        } else if (this.cuidadores.length > 0) {
          this.filtroCuidador = this.cuidadores[0].userName;
          this.loadCalendarForCuidador(this.filtroCuidador);
        }
      });
    });
  }

  onCuidadorChange(): void {
    if (this.filtroCuidador) {
      this.loadCalendarForCuidador(this.filtroCuidador);
    }
  }

  loadCalendarForCuidador(cuidadorName: string): void {
    if (this.calendarsData[cuidadorName]) {
      this.calendarDays = this.calendarsData[cuidadorName];
    } else {
      this.generateCalendar();
      this.calendarsData[cuidadorName] = this.calendarDays;
      this.saveCalendarsData();
    }
  }

  saveCalendarsData(): void {
    this.scheduleService.saveCalendarsData(this.calendarsData);
  }

  generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get number of days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get the weekday of the 1st of the month (0=Sunday, 1=Monday, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Adjust because our week starts on Monday (index 0) but Date.getDay() returns 0 for Sunday
    // Mon(1)->0, Tue(2)->1 ... Sun(0)->6
    const offset = (firstDayIndex + 6) % 7;

    this.calendarDays = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < offset; i++) {
      this.calendarDays.push({ number: null, events: [] });
    }

    // Add actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      let events: string[] = [];
      this.calendarDays.push({
        number: i,
        events: events,
        selectedPatients: [''], // Initialize with one empty selection
        selectedShifts: [''] // Initialize shift selection for each patient
      });
    }
  }

  addSelection(day: any) {
    day.selectedPatients.push('');
    day.selectedShifts.push('');
    if (!day.selectedNotesHistory) day.selectedNotesHistory = [];
    day.selectedNotesHistory[day.selectedPatients.length - 1] = [];

    // Save after adding selection
    if (this.filtroCuidador) {
      this.calendarsData[this.filtroCuidador] = [...this.calendarDays];
      this.saveCalendarsData();
    }
  }

  removeSelection(day: any, index: number) {
    day.selectedPatients.splice(index, 1);
    day.selectedShifts.splice(index, 1);
    
    if (day.selectedNotesHistory && day.selectedNotesHistory.length > index) {
        day.selectedNotesHistory.splice(index, 1);
    }
    if (day.selectedStatuses && day.selectedStatuses.length > index) {
        day.selectedStatuses.splice(index, 1);
    }
    if (day.selectedArrivedAt && day.selectedArrivedAt.length > index) {
        day.selectedArrivedAt.splice(index, 1);
    }

    if (this.filtroCuidador) {
      this.calendarsData[this.filtroCuidador] = [...this.calendarDays];
      this.saveCalendarsData();
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  isPatientSelected(day: any, patientName: string, currentIndex: number): boolean {
    return day.selectedPatients.some((selectedName: string, index: number) =>
      selectedName === patientName && index !== currentIndex
    );
  }

  onSelectionChange(): void {
    // Save calendar data whenever a selection changes
    if (this.filtroCuidador) {
      this.calendarsData[this.filtroCuidador] = [...this.calendarDays];
      this.saveCalendarsData();
    }
  }

  // Check if two shifts overlap
  shiftsOverlap(shift1: string, shift2: string): boolean {
    if (!shift1 || !shift2) return false;

    // Same shift always overlaps
    if (shift1 === shift2) return true;

    // Different 24h shifts don't overlap (one starts at 7h, other at 19h)
    if (shift1.startsWith('24H') && shift2.startsWith('24H')) {
      return false; // 24H_7H and 24H_19H are different shifts
    }

    // 24H_7H overlaps with MT (7h-19h) but not with SN (19h-7h)
    if (shift1 === '24H_7H' && shift2 === 'MT') return true;
    if (shift1 === 'MT' && shift2 === '24H_7H') return true;

    if (shift1 === '24H_7H' && shift2 === 'SN') return false;
    if (shift1 === 'SN' && shift2 === '24H_7H') return false;

    // 24H_19H overlaps with SN (19h-7h) but not with MT (7h-19h)
    if (shift1 === '24H_19H' && shift2 === 'SN') return true;
    if (shift1 === 'SN' && shift2 === '24H_19H') return true;

    if (shift1 === '24H_19H' && shift2 === 'MT') return false;
    if (shift1 === 'MT' && shift2 === '24H_19H') return false;

    // MT and SN don't overlap
    if ((shift1 === 'MT' && shift2 === 'SN') || (shift1 === 'SN' && shift2 === 'MT')) {
      return false;
    }

    return false;
  }

  // Check if a patient is already assigned to another caregiver at the same time
  // Returns the name of the conflicting caregiver or null if available
  getConflictingCuidador(dayNumber: number, patientName: string, shift: string, currentCuidador: string): string | null {
    if (!patientName || !shift || !dayNumber) return null;

    // Check all other caregivers' calendars
    for (const cuidadorName in this.calendarsData) {
      // Skip current caregiver
      if (cuidadorName === currentCuidador) continue;

      const calendar = this.calendarsData[cuidadorName];
      const day = calendar.find(d => d.number === dayNumber);

      if (day) {
        // Check all selections in this day
        for (let i = 0; i < day.selectedPatients.length; i++) {
          const selectedPatient = day.selectedPatients[i];
          const selectedShift = day.selectedShifts[i];

          // If same patient and shifts overlap, there's a conflict
          if (selectedPatient === patientName && this.shiftsOverlap(shift, selectedShift)) {
            return cuidadorName;
          }
        }
      }
    }

    return null;
  }

  // Validate selection and show modal if conflict exists
  validateSelection(dayNumber: number, patientName: string, shift: string): boolean {
    const conflictingCuidador = this.getConflictingCuidador(dayNumber, patientName, shift, this.filtroCuidador);

    if (conflictingCuidador) {
      // Find the full caregiver object to get both name and surname
      const cuidador = this.cuidadores.find(c => c.userName === conflictingCuidador);
      const fullName = cuidador
        ? `${cuidador.userName} ${cuidador.sobrenome || ''}`.trim()
        : conflictingCuidador;

      this.conflictCuidador = fullName;
      this.conflictMessage = `O paciente "${patientName}" já está agendado com o cuidador "${fullName}" neste horário.`;
      this.modalConflictOpen = true;
      return false;
    }
    return true;
  }

  // Validate consecutive days conflicts
  validateConsecutiveShifts(currentDay: any, shift: string): boolean {
    const dayIndex = this.calendarDays.indexOf(currentDay);
    if (dayIndex === -1) return true;

    // 1. Check Previous Day (Backward Look)
    if (dayIndex > 0) {
      const prevDay = this.calendarDays[dayIndex - 1];
      if (prevDay && prevDay.number) {
        const hasLateShift = prevDay.selectedShifts.some((s: string) => s === '24H_19H');

        if (hasLateShift && (shift === 'MT' || shift === '24H_7H')) {
          this.conflictMessage = `Conflito com o dia anterior! O plantão de ontem (24H Início 19h) termina hoje às 19h.`;
          this.modalConflictOpen = true;
          return false;
        }
      }
    }

    // 2. Check Next Day (Forward Look)
    if (dayIndex < this.calendarDays.length - 1) {
      const nextDay = this.calendarDays[dayIndex + 1];
      if (nextDay && nextDay.number) {
        if (shift === '24H_19H') {
          const hasEarlyShift = nextDay.selectedShifts.some((s: string) => s === 'MT' || s === '24H_7H');
          if (hasEarlyShift) {
            this.conflictMessage = `Conflito com o dia seguinte! Este plantão termina amanhã às 19h, mas já existe um plantão iniciando às 07h.`;
            this.modalConflictOpen = true;
            return false;
          }
        }
      }
    }

    return true;
  }

  // Called when patient or shift changes
  onPatientOrShiftChange(day: any, index: number): void {
    const patient = day.selectedPatients[index];
    const shift = day.selectedShifts[index];

    // Check if the caregiver already has an overlapping shift on this day (Intra-day check)
    if (shift) {
      // 1. Check internal overlap
      for (let i = 0; i < day.selectedShifts.length; i++) {
        if (i === index) continue; // Skip current row
        const otherShift = day.selectedShifts[i];

        if (otherShift && this.shiftsOverlap(shift, otherShift)) {
          const conflictingPatient = day.selectedPatients[i] ? ` com o paciente "${day.selectedPatients[i]}"` : '';
          this.conflictMessage = `Conflito de horário! O cuidador já possui um agendamento${conflictingPatient} neste período (${otherShift}) no dia ${day.number}.`;
          this.modalConflictOpen = true;

          // Clear the invalid shift but keep the patient if selected
          setTimeout(() => {
            day.selectedShifts[index] = '';
            this.onSelectionChange();
          });
          return;
        }
      }

      // 2. Check consecutive days overlap (Inter-day check)
      if (!this.validateConsecutiveShifts(day, shift)) {
        setTimeout(() => {
          day.selectedShifts[index] = '';
          this.onSelectionChange();
        });
        return;
      }
    }

    // Only validate against other caregivers if both patient and shift are selected
    if (patient && shift) {
      if (!this.validateSelection(day.number, patient, shift)) {
        // Clear the conflicting selection
        setTimeout(() => {
          day.selectedPatients[index] = '';
          day.selectedShifts[index] = '';
          this.onSelectionChange();
        });
        return;
      }
    }

    this.onSelectionChange();
  }

  closeConflictModal(): void {
    this.modalConflictOpen = false;
    this.conflictMessage = '';
    this.conflictCuidador = '';
  }

  openObsModal(day: any, index: number) {
      this.currentObsDay = day;
      this.currentObsIndex = index;
      
      if (!day.selectedNotesHistory) day.selectedNotesHistory = [];
      if (!day.selectedNotesHistory[index]) {
          day.selectedNotesHistory[index] = [];
          
          // Migrate old string-based note if exists
          if (day.selectedNotes && day.selectedNotes[index]) {
              day.selectedNotesHistory[index].push({
                  time: "Registro Anterior",
                  text: day.selectedNotes[index]
              });
              day.selectedNotes[index] = ''; // clear old format
          }
      }
      
      this.currentObsHistory = day.selectedNotesHistory[index];
      this.currentObsText = ''; // start always empty for new entries
      this.modalObsOpen = true;
  }

  openHistoryModal() {
      this.modalObsOpen = false;
      this.modalHistoryOpen = true;
  }

  closeHistoryModal() {
      this.modalHistoryOpen = false;
      this.modalObsOpen = true;
  }

  closeObsModal() {
      this.modalObsOpen = false;
      this.currentObsText = '';
      this.currentObsDay = null;
      this.currentObsIndex = -1;
      this.currentObsHistory = [];
  }

  saveObs() {
      if (this.currentObsDay && this.currentObsIndex !== -1 && this.currentObsText.trim() !== '') {
          if (!this.currentObsDay.selectedNotesHistory) this.currentObsDay.selectedNotesHistory = [];
          if (!this.currentObsDay.selectedNotesHistory[this.currentObsIndex]) {
              this.currentObsDay.selectedNotesHistory[this.currentObsIndex] = [];
          }
          
          const now = new Date();
          const p = (n: number) => n.toString().padStart(2, '0');
          const timestamp = `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} às ${p(now.getHours())}:${p(now.getMinutes())}`;
          
          this.currentObsDay.selectedNotesHistory[this.currentObsIndex].push({
              time: timestamp,
              text: this.currentObsText.trim()
          });
          
          if (this.filtroCuidador) {
            this.calendarsData[this.filtroCuidador] = [...this.calendarDays];
            this.saveCalendarsData();
          }
      }
      this.closeObsModal();
  }

  isShiftLocked(day: any, index: number): boolean {
    if (this.isDayPast(day.number)) return true;
    
    // Verifica pelo status
    if (day.selectedStatuses && day.selectedStatuses[index]) {
      const status = day.selectedStatuses[index];
      if (status === 'arrived' || status === 'completed') {
        return true;
      }
    }
    return false;
  }

  isDayPast(dayNumber: number): boolean {
    if (!dayNumber) return false;
    const now = new Date();
    // Assuming the calendar is always for the current month/year as implemented in generateCalendar
    return dayNumber < now.getDate();
  }
}
