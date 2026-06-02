import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CoexistenceCase, Student, Staff, Activity, PsychosocialCase, ClinicalSession } from '../types';

// Helper to draw header
const drawHeader = (doc: jsPDF, school: string, title: string, color: [number, number, number]) => {
  // Top accent bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(0, 0, 210, 15, 'F');

  // Institution title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(school.toUpperCase(), 15, 10);

  // Connection branding
  doc.setFont('helvetica', 'normal');
  doc.text('CONEXIA - Plataforma de Gestión', 150, 10);

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(title, 15, 30);

  // Date of generation
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, 15, 36);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 40, 195, 40);
};

// Helper to draw signature lines
const drawSignatures = (doc: jsPDF, names: string[], roles: string[], yPosition: number) => {
  const currentY = yPosition > 250 ? 250 : yPosition;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const colWidth = 180 / names.length;

  names.forEach((name, index) => {
    const x = 15 + index * colWidth + colWidth / 4;
    doc.line(x, currentY + 20, x + colWidth / 2, currentY + 20);
    doc.setFont('helvetica', 'bold');
    doc.text(name, x + colWidth / 4, currentY + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(roles[index], x + colWidth / 4, currentY + 30, { align: 'center' });
  });
};

export const exportCoexistenceCasePDF = (
  c: CoexistenceCase,
  student: Student,
  reporter: Staff
) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = 
    c.type === 'Gravísima' ? [220, 38, 38] : // red-600
    c.type === 'Grave' ? [217, 119, 6] : // amber-600
    c.type === 'Positiva' ? [5, 150, 105] : // emerald-600
    [79, 70, 229]; // indigo-600 (Leve)

  drawHeader(doc, c.school, 'ACTA DE INCIDENCIA Y PROTOCOLO', themeColor);

  // Student Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('1. INFORMACIÓN DEL ESTUDIANTE', 15, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Nombre Completo', 'RUT', 'Curso', 'Colegio']],
    body: [[
      `${student.firstName} ${student.lastName}`,
      student.rut,
      student.grade,
      student.school
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  // Incident Details Section
  const nextY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('2. DETALLES DE LA INCIDENCIA', 15, nextY1);

  autoTable(doc, {
    startY: nextY1 + 4,
    head: [['Fecha', 'Tipo de Caso', 'Reportado por', 'Rol Reportante']],
    body: [[
      c.date,
      c.type,
      `${reporter.firstName} ${reporter.lastName}`,
      reporter.role
    ]],
    theme: 'plain',
    margin: { left: 15, right: 15 }
  });

  // Description
  const nextY2 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción de los Hechos:', 15, nextY2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const splitDescription = doc.splitTextToSize(c.description, 180);
  doc.text(splitDescription, 15, nextY2 + 6);

  // Protocols & Derivations
  const nextY3 = nextY2 + 10 + (splitDescription.length * 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. PROTOCOLOS Y DERIVACIONES', 15, nextY3);

  const protocolText = c.protocolActivated 
    ? `Protocolo Activado: ${c.protocolName || 'Reglamento de Convivencia Escolar'}`
    : 'No se activaron protocolos de convivencia formal.';
  const referralText = c.referredToPsychosocial
    ? 'Derivado a: Dupla Psicosocial (Área de Apoyo)'
    : 'No requiere derivación inmediata a Dupla Psicosocial.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`• ${protocolText}`, 15, nextY3 + 6);
  doc.text(`• ${referralText}`, 15, nextY3 + 12);

  // Action Plan & Commitments
  const nextY4 = nextY3 + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. PLAN DE ACCIÓN Y COMPROMISOS', 15, nextY4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const actionPlanText = c.actionPlan || 'Pendiente de definición.';
  const commitmentsText = c.commitments || 'Ninguno registrado.';

  doc.setFont('helvetica', 'bold');
  doc.text('Plan de Acción:', 15, nextY4 + 6);
  doc.setFont('helvetica', 'normal');
  const splitAction = doc.splitTextToSize(actionPlanText, 180);
  doc.text(splitAction, 15, nextY4 + 11);

  const nextY5 = nextY4 + 16 + (splitAction.length * 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Compromisos Establecidos:', 15, nextY5);
  doc.setFont('helvetica', 'normal');
  const splitCommitments = doc.splitTextToSize(commitmentsText, 180);
  doc.text(splitCommitments, 15, nextY5 + 5);

  // Signatures
  const nextY6 = nextY5 + 15 + (splitCommitments.length * 5);
  drawSignatures(
    doc,
    [`${reporter.firstName} ${reporter.lastName}`, 'Encargado(a) Convivencia', 'Apoderado / Estudiante'],
    [reporter.role, 'Convivencia Escolar', 'Firma de Aceptación'],
    nextY6
  );

  doc.save(`conexia_caso_${c.id}.pdf`);
};

export const exportActivityPDF = (activity: Activity, students: Student[]) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600

  drawHeader(doc, activity.school, 'ACTA DE TALLER / ACTIVIDAD PREVENTIVA', themeColor);

  // Activity Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. DETALLES DE LA ACTIVIDAD', 15, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Título de la Actividad', 'Fecha', 'Expositor(a)', 'Lugar / Plataforma']],
    body: [[
      activity.title,
      activity.date,
      activity.speaker,
      activity.location
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  // Audience and Execution
  const nextY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('2. AUDIENCIA Y PARTICIPACIÓN', 15, nextY1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const audienceDetails = activity.audienceType === 'Masiva'
    ? `Tipo: Masiva dirigida a cursos: ${activity.targetGrades?.join(', ') || 'N/A'}`
    : `Tipo: Focalizada a estudiantes específicos (${students.length} matriculados seleccionados).`;

  doc.text(audienceDetails, 15, nextY1 + 6);
  doc.text(`Estado actual de la actividad: ${activity.status}`, 15, nextY1 + 12);

  // Summary / Bitacora
  const nextY2 = nextY1 + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. RESUMEN DE EJECUCIÓN Y BITÁCORA', 15, nextY2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryText = activity.summary || 'No se ha ingresado un resumen o bitácora de la actividad.';
  const splitSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(splitSummary, 15, nextY2 + 6);

  // List of focalized students if applicable
  let nextY3 = nextY2 + 10 + (splitSummary.length * 5);
  if (activity.audienceType === 'Focalizada' && students.length > 0) {
    if (nextY3 > 220) {
      doc.addPage();
      nextY3 = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. LISTADO DE ESTUDIANTES FOCALIZADOS CONVOCADOS', 15, nextY3);

    autoTable(doc, {
      startY: nextY3 + 4,
      head: [['N°', 'Estudiante (RUT)', 'Curso', 'Asistencia']],
      body: students.map((std, idx) => [
        (idx + 1).toString(),
        `${std.firstName} ${std.lastName} (${std.rut})`,
        std.grade,
        'Presente'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139] },
      margin: { left: 15, right: 15 }
    });
    nextY3 = (doc as any).lastAutoTable.finalY + 15;
  } else {
    nextY3 = nextY3 + 10;
  }

  // Signatures
  if (nextY3 > 250) {
    doc.addPage();
    nextY3 = 20;
  }
  drawSignatures(
    doc,
    [activity.speaker, 'Coordinador(a) de Apoyo', 'Dirección del Colegio'],
    ['Expositor / Facilitador', 'Vínculo Escolar', 'Validación del Establecimiento'],
    nextY3
  );

  doc.save(`conexia_actividad_${activity.id}.pdf`);
};

export const exportPsychosocialReportPDF = (
  c: PsychosocialCase,
  student: Student,
  sessions: ClinicalSession[]
) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = [124, 58, 237]; // violet-600

  // Header with Confidentiality notice
  drawHeader(doc, c.school, 'EXPEDIENTE PSICOSOCIAL CONFIDENCIAL', themeColor);

  // Watermark text for confidentiality
  doc.setFontSize(36);
  doc.setTextColor(254, 242, 242); // very light red-50
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL', 40, 140, { angle: 45 });

  // Reset text styles
  doc.setTextColor(30, 41, 59);

  // Student details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. ANTECEDENTES GENERALES DEL ALUMNO', 15, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Estudiante', 'RUT', 'Curso', 'Nivel de Riesgo']],
    body: [[
      `${student.firstName} ${student.lastName}`,
      student.rut,
      student.grade,
      c.riskLevel.toUpperCase()
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  // Case details
  const nextY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('2. DIAGNÓSTICO E INGRESO A DUPLA PSICOSOCIAL', 15, nextY1);

  autoTable(doc, {
    startY: nextY1 + 4,
    head: [['Fecha de Ingreso', 'Estado Intervención', 'Derivación Original']],
    body: [[
      c.referredDate,
      c.status,
      c.reason
    ]],
    theme: 'plain',
    margin: { left: 15, right: 15 }
  });

  // Clinical history table
  const nextY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('3. BITÁCORA DE INTERVENCIONES Y SESIONES CLÍNICAS', 15, nextY2);

  if (sessions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No se registran sesiones de intervención clínica aún en esta ficha.', 15, nextY2 + 8);
  } else {
    const stripHtml = (html: string) => {
      if (!html) return '';
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
    };

    autoTable(doc, {
      startY: nextY2 + 4,
      head: [['Fecha', 'Tipo', 'Profesional', 'Notas Clínicas', 'Compromisos / Acuerdos']],
      body: sessions.map(s => [
        s.date,
        s.contactType,
        s.professionalName,
        stripHtml(s.notes),
        s.agreements || 'Ninguno'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }, // violet-500
      columnStyles: {
        0: { cellWidth: 20 }, // Fecha
        1: { cellWidth: 23 }, // Tipo
        2: { cellWidth: 27 }, // Profesional
        3: { cellWidth: 75 }, // Notas Clínicas
        4: { cellWidth: 35 }  // Compromisos
      },
      styles: { fontSize: 8.5, overflow: 'linebreak' },
      margin: { left: 15, right: 15 }
    });
  }

  // Warning text
  const lastY = sessions.length === 0 ? nextY2 + 20 : (doc as any).lastAutoTable.finalY + 15;
  
  if (lastY > 230) {
    doc.addPage();
  }
  
  const currentY = doc.internal.pageSize.height - 70;

  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(248, 113, 113); // red-400
  doc.rect(15, currentY, 180, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('ADVERTENCIA DE CONFIDENCIALIDAD (Ley N° 19.628 de Protección de la Vida Privada):', 20, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento contiene información reservada de carácter clínico y psicosocial. Su divulgación no autorizada está sancionada por la ley.', 20, currentY + 12);

  // Signatures
  drawSignatures(
    doc,
    [sessions[0]?.professionalName || 'Dupla Psicosocial', 'Dirección / Jefatura UTP'],
    ['Psicólogo(a) / Trabajador(a) Social', 'Validación del Establecimiento'],
    currentY + 25
  );

  doc.save(`conexia_clinico_${student.rut}.pdf`);
};

export const exportAllActivitiesReportPDF = (activities: Activity[]) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600

  // Header
  doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CONEXIA - SISTEMA DE CONVIVENCIA ESCOLAR', 15, 10);

  doc.setFontSize(16);
  doc.setTextColor(51, 65, 85);
  doc.text('REPORTE GENERAL DE ACTIVIDADES Y TALLERES PREVENTIVOS', 15, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Total de actividades registradas: ${activities.length} | Generado el ${new Date().toLocaleDateString()}`, 15, 36);

  autoTable(doc, {
    startY: 45,
    head: [['Título', 'Establecimiento', 'Fecha', 'Expositor(a)', 'Audiencia', 'Estado']],
    body: activities.map(act => [
      act.title,
      act.school,
      act.date,
      act.speaker,
      act.audienceType === 'Masiva' ? 'Masiva (Cursos)' : 'Focalizada',
      act.status
    ]),
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  doc.save('conexia_reporte_actividades_general.pdf');
};
