import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CoexistenceCase, Student, Staff, Activity, PsychosocialCase, ClinicalSession, RiceProtocol, ManagementObjective, ExternalReferral } from '../types';

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

export const exportRiceProtocolPDF = (
  p: RiceProtocol,
  student: Student,
  responsible: Staff | undefined
) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = p.status === 'Abierto' ? [30, 41, 59] : [15, 118, 110]; // slate-800 or teal-700

  // Draw Header
  drawHeader(doc, p.school, 'EXPEDIENTE DE PROTOCOLO DE ACTUACIÓN RICE', themeColor);

  // Student & Protocol details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('1. ANTECEDENTES GENERALES', 15, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Estudiante', 'RUT', 'Curso', 'Protocolo Tipo', 'Estado']],
    body: [[
      `${student.firstName} ${student.lastName}`,
      student.rut,
      student.grade,
      p.protocolType,
      p.status.toUpperCase()
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  const nextY1 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Fechas y Plazos del Proceso:', 15, nextY1);

  autoTable(doc, {
    startY: nextY1 + 4,
    head: [['Fecha de Inicio', 'Plazo Límite (15 Días Hábiles)', 'Fecha de Cierre']],
    body: [[
      p.startedAt,
      p.dueDate,
      p.closedAt || 'EN PROCESO / ABIERTO'
    ]],
    theme: 'plain',
    margin: { left: 15, right: 15 }
  });

  // Stage Summary Table
  const nextY2 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('2. RESUMEN DE ETAPAS CUMPLIDAS', 15, nextY2);

  autoTable(doc, {
    startY: nextY2 + 4,
    head: [['Etapa RICE', 'Estado', 'Completado por', 'Fecha']],
    body: p.steps.map(step => [
      step.name,
      step.status,
      step.completedBy || 'Pendiente',
      step.completedAt || 'N/A'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] }, // slate-600
    margin: { left: 15, right: 15 }
  });

  // Bitacora Details
  let nextY3 = (doc as any).lastAutoTable.finalY + 10;
  if (nextY3 > 210) {
    doc.addPage();
    nextY3 = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('3. BITÁCORA Y DETALLE POR ETAPA', 15, nextY3);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  let currentY = nextY3 + 6;

  p.steps.forEach((step) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${step.name} - [${step.status}]`, 15, currentY);
    doc.setFont('helvetica', 'normal');
    
    // Notes text
    const notesText = step.notes ? `Observaciones: ${step.notes}` : 'Sin observaciones registradas.';
    const splitNotes = doc.splitTextToSize(notesText, 180);
    doc.text(splitNotes, 15, currentY + 5);
    
    let offset = 6 + (splitNotes.length * 4.5);

    // Custom fields printing based on step
    if (step.id === '1_detection' && step.fields?.initialMeasures) {
      const fieldText = `Medidas inmediatas de resguardo: ${step.fields.initialMeasures}`;
      const splitField = doc.splitTextToSize(fieldText, 180);
      doc.setFont('helvetica', 'italic');
      doc.text(splitField, 15, currentY + offset);
      doc.setFont('helvetica', 'normal');
      offset += (splitField.length * 4.5);
    } 
    else if (step.id === '2_notification' && step.fields) {
      const fieldText = `Citación Apoderado Víctima: ${step.fields.victimParentNotifiedDate || 'N/A'} | Citación Apoderado Denunciado: ${step.fields.aggressorParentNotifiedDate || 'N/A'}\nMedio de Notificación: ${step.fields.communicationType || 'N/A'}`;
      const splitField = doc.splitTextToSize(fieldText, 180);
      doc.setFont('helvetica', 'italic');
      doc.text(splitField, 15, currentY + offset);
      doc.setFont('helvetica', 'normal');
      offset += (splitField.length * 4.5) + 2;
    }
    else if (step.id === '3_investigation' && step.fields) {
      const fieldText = `Testigos/Entrevistados: ${Array.isArray(step.fields.interviews) ? step.fields.interviews.join(', ') : 'Ninguno'}\nConclusiones de la Investigación: ${step.fields.findings || 'N/A'}`;
      const splitField = doc.splitTextToSize(fieldText, 180);
      doc.setFont('helvetica', 'italic');
      doc.text(splitField, 15, currentY + offset);
      doc.setFont('helvetica', 'normal');
      offset += (splitField.length * 4.5) + 2;
    }
    else if (step.id === '4_resolution' && step.fields) {
      const fieldText = `Tipo de Medida/Sanción: ${step.fields.measureType || 'N/A'}\nDescripción de la Medida: ${step.fields.resolutionDescription || 'N/A'}\n¿Firma de Compromiso?: ${step.fields.commitmentsSigned ? 'SÍ' : 'NO'}`;
      const splitField = doc.splitTextToSize(fieldText, 180);
      doc.setFont('helvetica', 'italic');
      doc.text(splitField, 15, currentY + offset);
      doc.setFont('helvetica', 'normal');
      offset += (splitField.length * 4.5) + 2;
    }
    else if (step.id === '5_followup' && step.fields) {
      const fieldText = `¿Derivado a Dupla Psicosocial?: ${step.fields.referredToDupla ? 'SÍ' : 'NO'} | Próximo Seguimiento: ${step.fields.followupDate || 'N/A'}\nResumen de Cierre: ${step.fields.finalReportSummary || 'N/A'}`;
      const splitField = doc.splitTextToSize(fieldText, 180);
      doc.setFont('helvetica', 'italic');
      doc.text(splitField, 15, currentY + offset);
      doc.setFont('helvetica', 'normal');
      offset += (splitField.length * 4.5) + 2;
    }

    doc.setDrawColor(241, 245, 249); // slate-100 divider
    doc.line(15, currentY + offset, 195, currentY + offset);
    currentY += offset + 6;
  });

  // Confidentiality warning
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  const warnY = doc.internal.pageSize.height - 70;
  
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(248, 113, 113); // red-400
  doc.rect(15, warnY, 180, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('ADVERTENCIA DE CONFIDENCIALIDAD (Ley N° 19.628 de Protección de la Vida Privada):', 20, warnY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('Este documento contiene información privada de un proceso disciplinario escolar. Su divulgación a terceros ajenos', 20, warnY + 12);
  doc.text('al caso está estrictamente prohibida y sancionada por la legislación vigente.', 20, warnY + 16);

  // Signatures
  const names = [
    `${responsible?.firstName || ''} ${responsible?.lastName || 'Encargado(a)'}`,
    'Dirección del Establecimiento',
    'Apoderado / Tutor'
  ];
  const roles = [
    responsible?.role || 'Encargado(a) Convivencia',
    'Representante Legal / Director(a)',
    'Firma Conforme'
  ];
  
  drawSignatures(doc, names, roles, warnY + 25);

  doc.save(`conexia_protocolo_${p.id}.pdf`);
};

export const exportManagementObjectivesReportPDF = (
  objectives: ManagementObjective[],
  activities: Activity[],
  school: string
) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600

  drawHeader(doc, school, 'INFORME DE CUMPLIMIENTO: PLAN DE GESTIÓN', themeColor);

  // Objectives List Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('RESUMEN DE OBJETIVOS E HITOS DEL PLAN ANUAL', 15, 48);

  const tableBody = objectives.map((o) => {
    const count = o.associatedActivityIds.length;
    return [
      o.title,
      o.category,
      o.target,
      o.status,
      `${count} taller(es) preventivos`
    ];
  });

  autoTable(doc, {
    startY: 52,
    head: [['Objetivo / Meta', 'Categoría', 'Alcance', 'Estado', 'Actividades Vinculadas']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DETALLE DE ACTIVIDADES Y PREVENCIÓN VINCULADAS', 15, nextY);

  const activitiesBody: any[] = [];
  objectives.forEach(o => {
    const objsActs = activities.filter(a => o.associatedActivityIds.includes(a.id));
    objsActs.forEach(act => {
      activitiesBody.push([
        o.title,
        act.title,
        act.date,
        act.speaker,
        act.status
      ]);
    });
  });

  if (activitiesBody.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No existen actividades o talleres vinculados a los objetivos del plan aún.', 15, nextY + 6);
  } else {
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Objetivo del Plan', 'Taller Preventivo Realizado', 'Fecha', 'Responsable', 'Estado']],
      body: activitiesBody,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
      margin: { left: 15, right: 15 }
    });
  }

  doc.save(`conexia_plan_gestion_${school.replace(/\s+/g, '_')}.pdf`);
};

export const exportExternalReferralPDF = (
  referral: ExternalReferral,
  student: Student,
  professional: Staff
) => {
  const doc = new jsPDF();
  const themeColor: [number, number, number] = [124, 58, 237]; // violet-600

  drawHeader(doc, referral.school, 'FICHA DE DERIVACIÓN INTERSECTORIAL', themeColor);

  // Institution details & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DE LA INSTITUCIÓN RECEPTORA', 15, 48);

  autoTable(doc, {
    startY: 52,
    head: [['Institución de Destino', 'Estado Derivación', 'Fecha de Envío', 'Oficio / Folio N°']],
    body: [[
      referral.institution,
      referral.status,
      referral.sentDate || 'Pendiente',
      referral.folioNumber || 'Pendiente'
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  // Student Section
  const nextY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('ANTECEDENTES PERSONALES DEL ESTUDIANTE', 15, nextY1);

  autoTable(doc, {
    startY: nextY1 + 4,
    head: [['Nombre Completo', 'RUT', 'Curso', 'Apoderado / Tutor']],
    body: [[
      `${student.firstName} ${student.lastName}`,
      student.rut,
      student.grade,
      student.parentName || 'No Registrado'
    ]],
    theme: 'striped',
    headStyles: { fillColor: themeColor },
    margin: { left: 15, right: 15 }
  });

  // Technical Details
  const nextY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('MOTIVO TÉCNICO DE DERIVACIÓN Y ANTECEDENTES', 15, nextY2);

  // Split long texts for multiline support
  const reasonLines = doc.splitTextToSize(referral.reason, 180);
  const measuresLines = doc.splitTextToSize(referral.previousMeasures, 180);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Síntesis diagnóstica / Motivos detectados:', 15, nextY2 + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  let textY = nextY2 + 11;
  doc.text(reasonLines, 15, textY);
  textY += reasonLines.length * 5 + 5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('2. Acciones y medidas adoptadas por el establecimiento:', 15, textY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(measuresLines, 15, textY + 5);
  textY += measuresLines.length * 5 + 10;

  if (referral.observations) {
    const obsLines = doc.splitTextToSize(referral.observations, 180);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('3. Observaciones / Comentarios adicionales:', 15, textY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(obsLines, 15, textY + 5);
    textY += obsLines.length * 5 + 10;
  }

  // Signatures
  const names = [
    `${professional.firstName} ${professional.lastName}`,
    'Dirección del Establecimiento'
  ];
  const roles = [
    professional.role || 'Profesional Dupla Psicosocial',
    'Firma y Timbre Director(a)'
  ];

  drawSignatures(doc, names, roles, textY + 10);

  doc.save(`conexia_derivacion_${student.rut}.pdf`);
};

