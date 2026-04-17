import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvolutionEntry } from '../../../../core/services/evolution.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface RelatorioDia {
  data: string;
  registros: EvolutionEntry[];
}

@Component({
  selector: 'app-menu3-familiar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu3-familiar.component.html',
  styleUrl: './menu3-familiar.component.css'
})
export class Menu3FamiliarComponent implements OnChanges {
  @Input() evolutions: EvolutionEntry[] = [];
  @Input() loading: boolean = false;

  evolutionsHoje: EvolutionEntry[] = [];
  relatoriosPassados: RelatorioDia[] = [];

  // Variável para a tela que será convertida em PDF e botão de carregamento
  gerandoPdfParaData: string | null = null;
  registrosParaPdf: EvolutionEntry[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evolutions']) {
      this.processarEvolucoes();
    }
  }

  processarEvolucoes(): void {
    const hojeObj = new Date();
    const diaHojeStr = hojeObj.getDate().toString().padStart(2, '0') + '/' + 
                       (hojeObj.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                       hojeObj.getFullYear();

    this.evolutionsHoje = [];
    const mapaAntigos = new Map<string, EvolutionEntry[]>();

    for (const ev of this.evolutions) {
      if (ev.date === diaHojeStr) {
        this.evolutionsHoje.push(ev);
      } else {
        if (!mapaAntigos.has(ev.date)) {
          mapaAntigos.set(ev.date, []);
        }
        mapaAntigos.get(ev.date)!.push(ev);
      }
    }

    // Converter mapa para array e ordenar (do mais recente para o mais antigo)
    this.relatoriosPassados = Array.from(mapaAntigos.entries()).map(([data, regs]) => ({
      data,
      registros: regs
    })).sort((a, b) => {
      // Basic DD/MM/YYYY sort desc
      const pA = a.data.split('/');
      const pB = b.data.split('/');
      const dA = new Date(parseInt(pA[2]), parseInt(pA[1]) - 1, parseInt(pA[0]));
      const dB = new Date(parseInt(pB[2]), parseInt(pB[1]) - 1, parseInt(pB[0]));
      return dB.getTime() - dA.getTime();
    });
  }

  baixarPdf(relatorio: RelatorioDia): void {
    this.gerandoPdfParaData = relatorio.data;
    this.registrosParaPdf = relatorio.registros;

    // Aguardar o ciclo do Angular renderizar a DOM escondida
    setTimeout(() => {
      const element = document.getElementById('impressao-pdf');
      if (element) {
        html2canvas(element, { scale: 2 }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Relatorio_Plantao_${relatorio.data.replace(/\//g, '_')}.pdf`);
          
          this.gerandoPdfParaData = null;
        }).catch(err => {
          console.error('Erro ao gerar PDF', err);
          this.gerandoPdfParaData = null;
          alert('Não foi possível gerar o PDF. Tente novamente mais tarde.');
        });
      } else {
        this.gerandoPdfParaData = null;
      }
    }, 100);
  }
}

