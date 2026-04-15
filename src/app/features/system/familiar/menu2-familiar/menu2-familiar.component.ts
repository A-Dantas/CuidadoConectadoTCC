import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu2-familiar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu2-familiar.component.html',
  styleUrl: './menu2-familiar.component.css'
})
export class Menu2FamiliarComponent {
  @Input() plantoes: any[] = [];
  @Input() loading: boolean = false;
  @Output() irParaLinhaDoTempo = new EventEmitter<void>();

  modalAvisoAberto: boolean = false;

  getDataHoje(): string {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  getHorarioCompleto(horario: string): string {
    if (!horario) return '';
    const h = horario.toUpperCase();

    if (h.includes('24H')) {
      const partes = h.split('_');
      let horaInicio = '07:00';
      if (partes.length > 1) {
        const hFormatada = partes[1].replace('H', '').padStart(2, '0');
        horaInicio = `${hFormatada}:00`;
      }
      return `24h (${horaInicio} - ${horaInicio})`;
    }

    const ranges: { [key: string]: string } = {
      'MT': '(07:00 - 19:00)',
      'SN': '(19:00 - 07:00)'
    };
    return `${horario} ${ranges[h] || ''}`;
  }

  // ── Core: calculates the exact dates of a shift ─────────────────────────
  private getShiftDates(plantao: any): { start: Date, end: Date, half: Date, addDay: number } | null {
    if (!plantao?.horario || !plantao?.dia) return null;

    const h = plantao.horario.toUpperCase();
    const now = new Date();
    // Assume same month/year as today — adequate for near-term agenda
    const shiftStart = new Date(now.getFullYear(), now.getMonth(), plantao.dia);
    
    let startHour = 7;
    let endHour = 19;
    let addDay = 0;

    if (h === 'MT') {
      startHour = 7;
      endHour = 19;
      addDay = 0;
    } else if (h === 'SN') {
      startHour = 19;
      endHour = 7;
      addDay = 1;
    } else if (h.includes('24H')) {
      const partes = h.split('_');
      startHour = 7;
      if (partes.length > 1) {
        startHour = parseInt(partes[1].replace('H', ''), 10);
      }
      endHour = startHour;
      addDay = 1;
    } else {
      return null;
    }

    shiftStart.setHours(startHour, 0, 0, 0);
    
    const shiftEnd = new Date(shiftStart.getTime());
    shiftEnd.setDate(shiftEnd.getDate() + addDay);
    shiftEnd.setHours(endHour, 0, 0, 0);

    const shiftHalf = new Date(shiftStart.getTime() + (shiftEnd.getTime() - shiftStart.getTime()) / 2);

    return { start: shiftStart, end: shiftEnd, half: shiftHalf, addDay };
  }

  // Label and styling tag for shifts based on progress
  getShiftTag(plantao: any): { text: string, class: string } | null {
    const dates = this.getShiftDates(plantao);
    if (!dates) return null;

    const now = new Date();
    const horaMsg = dates.end.getHours().toString().padStart(2, '0') + ':00';
    const diaMsg = dates.end.getDate().toString().padStart(2, '0');

    // Aguardando confirmação (não chegou nem finalizou)
    if (plantao.status !== 'arrived' && plantao.status !== 'completed') {
      return {
        text: 'Aguardando confirmação do cuidador',
        class: 'tag_cinza_suave'
      };
    }

    // Finalizado
    if (now >= dates.end || plantao.status === 'completed') {
      return {
        text: `Finalizado às ${horaMsg} dia ${diaMsg}`,
        class: 'tag_verde_suave'
      };
    }

    // Em andamento
    if (dates.addDay > 0) {
      if (now < dates.half) {
        // Primeira metade de um plantão que vira o dia
        return {
          text: `Em andamento. Termino às ${horaMsg} do dia ${diaMsg}`,
          class: 'tag_laranja_suave'
        };
      } else {
        // Segunda metade do plantão
        return {
          text: `Em andamento. Termino às ${horaMsg}, hoje.`,
          class: 'tag_amarelo_suave'
        };
      }
    } else {
      // Termina no mesmo dia
      return {
        text: `Em andamento. Termino às ${horaMsg}, hoje.`,
        class: 'tag_amarelo_suave'
      };
    }
  }

  // ── Status dot helpers ──────────────────────────────────────────────────────
  getStatusColor(status: string): string {
    switch (status) {
      case 'arrived':
      case 'completed':
        return '#0d9488';
      default:
        return '#94a3b8';
    }
  }

  getStatusLabel(plantao: any): string {
    switch (plantao.status) {
      case 'arrived':
        // Verifica se existe o horário em que o cuidador confirmou a chegada
        if (plantao.arrivedAt) {
          const arrivedTime = new Date(plantao.arrivedAt).getTime();
          const now = new Date().getTime();
          const diffMinutes = (now - arrivedTime) / (1000 * 60);
          
          if (diffMinutes >= 1) {
            return 'Assistência em andamento';
          }
        }
        return 'Chegou na residência';
      case 'completed':
        return 'Assistência concluída';
      default:
        return 'Confirmado';
    }
  }

  abrirRelatorio(plantao: any): void {
    if (plantao.status !== 'completed') {
      this.modalAvisoAberto = true;
      return;
    }
    alert(`Visualizando relatório de cuidados para o plantão de ${plantao.cuidador} no dia ${plantao.dia}.`);
  }

  fecharModalAviso(): void {
    this.modalAvisoAberto = false;
  }

  redirecionarLinhaTempo(): void {
    this.modalAvisoAberto = false;
    this.irParaLinhaDoTempo.emit();
  }
}
