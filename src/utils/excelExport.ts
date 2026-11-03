import * as XLSX from 'xlsx';
import { Survey, SurveyResponse } from '../types.ts';

export function exportSurveyToExcel(survey: Survey, responses: SurveyResponse[]) {
  const wb = XLSX.utils.book_new();

  // SHEET 1: Respuestas Detalladas
  const detailedData: Array<Record<string, string | number>> = [];

  responses.forEach((resp, index) => {
    const row: Record<string, string | number> = {
      '#': index + 1,
      'ID de Respuesta': resp.id,
      'Fecha y Hora': new Date(resp.submittedAt).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
    };

    if (resp.respondentName) {
      row['Nombre del Encuestado'] = resp.respondentName;
    }

    survey.questions.forEach((q) => {
      const val = resp.answers[q.id];
      if (val === undefined || val === null || val === '') {
        row[q.text] = '(Sin respuesta)';
      } else if (Array.isArray(val)) {
        row[q.text] = val.join(', ');
      } else {
        row[q.text] = val;
      }
    });

    detailedData.push(row);
  });

  const wsDetailed = XLSX.utils.json_to_sheet(
    detailedData.length > 0
      ? detailedData
      : [
          {
            '#': 0,
            'ID de Respuesta': 'Sin respuestas aún',
            'Fecha y Hora': '-',
            ...Object.fromEntries(survey.questions.map((q) => [q.text, '-'])),
          },
        ]
  );

  // Set column widths
  const colWidths: { wch: number }[] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 22 },
  ];
  survey.questions.forEach((q) => {
    colWidths.push({ wch: Math.max(q.text.length + 4, 25) });
  });
  wsDetailed['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Respuestas Detalladas');

  // SHEET 2: Resumen y Estadísticas Agrupadas
  const summaryRows: Array<Array<string | number>> = [
    ['REPORTE EJECUTIVO DE ENCUESTA'],
    ['Título:', survey.title],
    ['Descripción:', survey.description || 'Sin descripción'],
    ['Fecha de Creación:', new Date(survey.createdAt).toLocaleDateString('es-ES')],
    ['Fecha de Generación del Reporte:', new Date().toLocaleString('es-ES')],
    ['Total de Respuestas Recibidas:', responses.length],
    ['Estado:', survey.active ? 'Activa' : 'Pausada'],
    [''],
    ['-----------------------------------------------------------'],
    ['RESUMEN AGRUPADO POR PREGUNTA'],
    ['-----------------------------------------------------------'],
    [''],
  ];

  survey.questions.forEach((q, qIndex) => {
    summaryRows.push([`Pregunta ${qIndex + 1}: ${q.text}`]);
    summaryRows.push([`Tipo: ${getQuestionTypeLabel(q.type)}`, `Obligatoria: ${q.required ? 'Sí' : 'No'}`]);

    if (q.type === 'radio' || q.type === 'checkbox' || q.type === 'yesno') {
      const options =
        q.type === 'yesno'
          ? ['Sí', 'No']
          : q.options && q.options.length > 0
          ? q.options
          : [];

      const counts: Record<string, number> = {};
      options.forEach((opt) => (counts[opt] = 0));

      let totalAnswersForQ = 0;
      responses.forEach((r) => {
        const ans = r.answers[q.id];
        if (ans) {
          totalAnswersForQ++;
          if (Array.isArray(ans)) {
            ans.forEach((item) => {
              counts[item] = (counts[item] || 0) + 1;
            });
          } else {
            counts[String(ans)] = (counts[String(ans)] || 0) + 1;
          }
        }
      });

      summaryRows.push(['Opción', 'Votos / Frecuencia', 'Porcentaje (%)']);
      options.forEach((opt) => {
        const count = counts[opt] || 0;
        const pct =
          totalAnswersForQ > 0
            ? Math.round((count / (q.type === 'checkbox' ? responses.length : totalAnswersForQ)) * 100)
            : 0;
        summaryRows.push([opt, count, `${pct}%`]);
      });
      summaryRows.push(['Total de personas que respondieron esta pregunta:', totalAnswersForQ]);
    } else if (q.type === 'rating') {
      let sum = 0;
      let count = 0;
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      responses.forEach((r) => {
        const val = Number(r.answers[q.id]);
        if (!isNaN(val) && val > 0) {
          sum += val;
          count++;
          dist[val] = (dist[val] || 0) + 1;
        }
      });

      const avg = count > 0 ? (sum / count).toFixed(2) : 'N/A';
      summaryRows.push(['Promedio General de Calificación:', avg, 'Escala: 1 a 5']);
      summaryRows.push(['Total de Evaluaciones:', count]);
      summaryRows.push(['Desglose de Calificaciones:']);
      [5, 4, 3, 2, 1].forEach((star) => {
        const c = dist[star] || 0;
        const p = count > 0 ? Math.round((c / count) * 100) : 0;
        summaryRows.push([`${star} Estrellas`, c, `${p}%`]);
      });
    } else {
      // Text questions
      const answeredCount = responses.filter(
        (r) => r.answers[q.id] && String(r.answers[q.id]).trim().length > 0
      ).length;
      summaryRows.push([
        'Respuestas registradas:',
        answeredCount,
        `Tasa de respuesta: ${
          responses.length > 0 ? Math.round((answeredCount / responses.length) * 100) : 0
        }%`,
      ]);
    }

    summaryRows.push(['']); // Empty spacer line
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Estadísticas y Agrupación');

  // Generate file name
  const safeTitle = survey.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_').substring(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Encuesta_${safeTitle}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export function exportSurveyToCSV(survey: Survey, responses: SurveyResponse[]) {
  const headers = ['ID Respuesta', 'Fecha y Hora', ...survey.questions.map((q) => q.text)];
  const rows = responses.map((resp) => {
    return [
      resp.id,
      new Date(resp.submittedAt).toLocaleString('es-ES'),
      ...survey.questions.map((q) => {
        const val = resp.answers[q.id];
        if (val === undefined || val === null) return '';
        if (Array.isArray(val)) return `"${val.join(', ')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      }),
    ];
  });

  const csvContent =
    '\uFEFF' + [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows.map((r) => r.join(','))].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeTitle = survey.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_').substring(0, 30);
  link.setAttribute('download', `Encuesta_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'radio':
      return 'Opción Única';
    case 'checkbox':
      return 'Múltiple Selección';
    case 'rating':
      return 'Calificación (1-5)';
    case 'yesno':
      return 'Sí / No';
    case 'textarea':
      return 'Texto Largo';
    case 'text':
    default:
      return 'Texto Corto';
  }
}
