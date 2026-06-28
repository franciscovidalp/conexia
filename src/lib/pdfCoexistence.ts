import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CoexistenceCase, Student, Staff, Activity, PsychosocialCase, ClinicalSession, RiceProtocol, ManagementObjective, ExternalReferral, ParentSummons } from '../types';

// Helper to load Colegio BioBío logo asynchronously if applicable
const loadBioBioLogo = (school: string): Promise<HTMLImageElement | undefined> => {
  return new Promise((resolve) => {
    const isBioBio = school.toLowerCase().includes('biobío') || school.toLowerCase().includes('biobio');
    if (!isBioBio) {
      resolve(undefined);
      return;
    }
    const img = new Image();
    img.src = '/colegio-biobio-logo.png';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("No se pudo cargar la insignia del Colegio BioBío");
      resolve(undefined);
    };
  });
};

// Helper to draw header
const drawHeader = (
  doc: jsPDF, 
  school: string, 
  title: string, 
  color: [number, number, number],
  logoImg?: HTMLImageElement
) => {
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

  let textX = 15;
  if (logoImg) {
    // Add logo at x=15, y=18, width=22, height=22
    doc.addImage(logoImg, 'PNG', 15, 18, 22, 22);
    textX = 42;
  }

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(title, textX, 30);

  // Date of generation
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, textX, 36);

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, logoImg ? 44 : 40, 195, logoImg ? 44 : 40);
};

// Helper to check page overflow and add a new page if necessary
const checkPageOverflow = (
  doc: jsPDF,
  y: number,
  requiredSpace: number,
  school: string,
  title: string,
  themeColor: [number, number, number],
  logoImg?: HTMLImageElement
): number => {
  if (y + requiredSpace > 257) {
    doc.addPage();
    drawHeader(doc, school, title, themeColor, logoImg);
    return logoImg ? 53 : 50;
  }
  return y;
};

// Helper to draw wrapped paragraph text line-by-line with page breaking and header replication
const drawParagraph = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  school: string,
  title: string,
  themeColor: [number, number, number],
  options: {
    fontSize?: number;
    isBold?: boolean;
    isItalic?: boolean;
    lineHeight?: number;
    textColor?: [number, number, number];
    logoImg?: HTMLImageElement;
  } = {}
): number => {
  const {
    fontSize = 10,
    isBold = false,
    isItalic = false,
    lineHeight = 5,
    textColor = [51, 65, 85],
    logoImg
  } = options;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : isItalic ? 'italic' : 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Split by manual newlines
  const paragraphs = (text || '').split('\n');
  let currentY = y;

  paragraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, width);
    lines.forEach((line: string) => {
      // Check if page needs to be added (leaving ~40mm at the bottom, page height is 297)
      if (currentY > 257) {
        doc.addPage();
        drawHeader(doc, school, title, themeColor, logoImg);
        // Restore font size and style on new page
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : isItalic ? 'italic' : 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        currentY = logoImg ? 53 : 50;
      }
      doc.text(line, x, currentY);
      currentY += lineHeight;
    });
  });

  return currentY;
};

// Helper to draw signature lines with safe page break
const drawSignatures = (
  doc: jsPDF,
  names: string[],
  roles: string[],
  yPosition: number,
  school: string,
  title: string,
  themeColor: [number, number, number],
  logoImg?: HTMLImageElement
) => {
  let currentY = yPosition;
  if (currentY > 230) {
    doc.addPage();
    drawHeader(doc, school, title, themeColor, logoImg);
    currentY = logoImg ? 53 : 50;
  }
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
): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(c.school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'ACTA DE INCIDENCIA Y PROTOCOLO';
      const themeColor: [number, number, number] = 
        c.type === 'Gravísima' ? [220, 38, 38] : // red-600
        c.type === 'Grave' ? [217, 119, 6] : // amber-600
        c.type === 'Positiva' ? [5, 150, 105] : // emerald-600
        [79, 70, 229]; // indigo-600 (Leve)

      drawHeader(doc, c.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // Student Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('1. INFORMACIÓN DEL ESTUDIANTE', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
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
      let nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('2. DETALLES DE LA INCIDENCIA', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
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
      nextY = (doc as any).lastAutoTable.finalY + 8;
      nextY = checkPageOverflow(doc, nextY, 15, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Descripción de los Hechos:', 15, nextY);
      
      nextY = drawParagraph(doc, c.description, 15, nextY + 6, 180, c.school, title, themeColor, {
        fontSize: 10,
        lineHeight: 5,
        textColor: [51, 65, 85],
        logoImg
      });

      // Protocols & Derivations
      nextY = checkPageOverflow(doc, nextY + 5, 20, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('3. PROTOCOLOS Y DERIVACIONES', 15, nextY);

      const protocolText = c.protocolActivated 
        ? `Protocolo Activado: ${c.protocolName || 'Reglamento de Convivencia Escolar'}`
        : 'No se activaron protocolos de convivencia formal.';
      const referralText = c.referredToPsychosocial
        ? 'Derivado a: Dupla Psicosocial (Área de Apoyo)'
        : 'No requiere derivación inmediata a Dupla Psicosocial.';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${protocolText}`, 15, nextY + 6);
      doc.text(`• ${referralText}`, 15, nextY + 12);

      // Action Plan & Commitments
      nextY = checkPageOverflow(doc, nextY + 18, 25, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('4. PLAN DE ACCIÓN Y COMPROMISOS', 15, nextY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Plan de Acción:', 15, nextY + 6);
      
      const actionPlanText = c.actionPlan || 'Pendiente de definición.';
      nextY = drawParagraph(doc, actionPlanText, 15, nextY + 11, 180, c.school, title, themeColor, {
        fontSize: 10,
        lineHeight: 5,
        textColor: [51, 65, 85],
        logoImg
      });

      nextY = checkPageOverflow(doc, nextY + 5, 12, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Compromisos Establecidos:', 15, nextY);
      
      const commitmentsText = c.commitments || 'Ninguno registrado.';
      nextY = drawParagraph(doc, commitmentsText, 15, nextY + 5, 180, c.school, title, themeColor, {
        fontSize: 10,
        lineHeight: 5,
        textColor: [51, 65, 85],
        logoImg
      });

      // Signatures
      drawSignatures(
        doc,
        [`${reporter.firstName} ${reporter.lastName}`, 'Encargado(a) Convivencia', 'Apoderado / Estudiante'],
        [reporter.role, 'Convivencia Escolar', 'Firma de Aceptación'],
        nextY + 5,
        c.school,
        title,
        themeColor,
        logoImg
      );

      doc.save(`conexia_caso_${c.id}.pdf`);
      resolve();
    });
  });
};

export const exportActivityPDF = (activity: Activity, students: Student[]): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(activity.school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'ACTA DE TALLER / ACTIVIDAD PREVENTIVA';
      const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600

      drawHeader(doc, activity.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // Activity Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('1. DETALLES DE LA ACTIVIDAD', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
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
      let nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, activity.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('2. AUDIENCIA Y PARTICIPACIÓN', 15, nextY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const audienceDetails = activity.audienceType === 'Masiva'
        ? `Tipo: Masiva dirigida a cursos: ${activity.targetGrades?.join(', ') || 'N/A'}`
        : `Tipo: Focalizada a estudiantes específicos (${students.length} matriculados seleccionados).`;

      doc.text(audienceDetails, 15, nextY + 6);
      doc.text(`Estado actual de la actividad: ${activity.status}`, 15, nextY + 12);

      // Summary / Bitacora
      nextY = checkPageOverflow(doc, nextY + 18, 15, activity.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('3. RESUMEN DE EJECUCIÓN Y BITÁCORA', 15, nextY);

      const summaryText = activity.summary || 'No se ha ingresado un resumen o bitácora de la actividad.';
      nextY = drawParagraph(doc, summaryText, 15, nextY + 6, 180, activity.school, title, themeColor, {
        fontSize: 10,
        lineHeight: 5,
        textColor: [51, 65, 85],
        logoImg
      });

      // List of focalized students if applicable
      nextY = nextY + 5;
      if (activity.audienceType === 'Focalizada' && students.length > 0) {
        nextY = checkPageOverflow(doc, nextY, 20, activity.school, title, themeColor, logoImg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('4. LISTADO DE ESTUDIANTES FOCALIZADOS CONVOCADOS', 15, nextY);

        autoTable(doc, {
          startY: nextY + 4,
          head: [['N°', 'Estudiante (RUT)', 'Curso', 'Asistencia']],
          body: students.map((std, idx) => [
            (idx + 1).toString(),
            `${std.firstName} ${std.lastName} (${std.rut})`,
            std.grade,
            'Presente'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [100, 116, 139] },
          margin: { top: 50, left: 15, right: 15 },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
              drawHeader(doc, activity.school, title, themeColor, logoImg);
            }
          }
        });
        nextY = (doc as any).lastAutoTable.finalY + 5;
      }

      // Signatures
      drawSignatures(
        doc,
        [activity.speaker, 'Coordinador(a) de Apoyo', 'Dirección del Colegio'],
        ['Expositor / Facilitador', 'Vínculo Escolar', 'Validación del Establecimiento'],
        nextY,
        activity.school,
        title,
        themeColor,
        logoImg
      );

      doc.save(`conexia_actividad_${activity.id}.pdf`);
      resolve();
    });
  });
};

export const exportPsychosocialReportPDF = (
  c: PsychosocialCase,
  student: Student,
  sessions: ClinicalSession[]
): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(c.school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'EXPEDIENTE PSICOSOCIAL CONFIDENCIAL';
      const themeColor: [number, number, number] = [124, 58, 237]; // violet-600

      // Header with Confidentiality notice
      drawHeader(doc, c.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

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
      doc.text('1. ANTECEDENTES GENERALES DEL ALUMNO', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
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
      let nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.text('2. DIAGNÓSTICO E INGRESO A DUPLA PSICOSOCIAL', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
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
      nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, c.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.text('3. BITÁCORA DE INTERVENCIONES Y SESIONES CLÍNICAS', 15, nextY);

      if (sessions.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('No se registran sesiones de intervención clínica aún en esta ficha.', 15, nextY + 8);
        nextY = nextY + 15;
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
          startY: nextY + 4,
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
          margin: { top: 50, left: 15, right: 15 },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
              drawHeader(doc, c.school, title, themeColor, logoImg);
            }
          }
        });
        nextY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Warning text
      nextY = checkPageOverflow(doc, nextY, 25, c.school, title, themeColor, logoImg);
      
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(248, 113, 113); // red-400
      doc.rect(15, nextY, 180, 20, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text('ADVERTENCIA DE CONFIDENCIALIDAD (Ley N° 19.628 de Protección de la Vida Privada):', 20, nextY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text('Este documento contiene información reservada de carácter clínico y psicosocial. Su divulgación no autorizada está sancionada por la ley.', 20, nextY + 12);

      // Signatures
      drawSignatures(
        doc,
        [sessions[0]?.professionalName || 'Dupla Psicosocial', 'Dirección / Jefatura UTP'],
        ['Psicólogo(a) / Trabajador(a) Social', 'Validación del Establecimiento'],
        nextY + 25,
        c.school,
        title,
        themeColor,
        logoImg
      );

      doc.save(`conexia_clinico_${student.rut}.pdf`);
      resolve();
    });
  });
};

export const exportAllActivitiesReportPDF = (activities: Activity[]): Promise<void> => {
  return new Promise((resolve) => {
    const schoolName = activities[0]?.school || '';
    loadBioBioLogo(schoolName).then((logoImg) => {
      const doc = new jsPDF();
      const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600
      const title = 'REPORTE GENERAL DE ACTIVIDADES Y TALLERES PREVENTIVOS';

      // Header
      doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('CONEXIA - SISTEMA DE CONVIVENCIA ESCOLAR', 15, 10);

      let textX = 15;
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 15, 18, 22, 22);
        textX = 42;
      }

      doc.setFontSize(16);
      doc.setTextColor(51, 65, 85);
      doc.text(title, textX, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Total de actividades registradas: ${activities.length} | Generado el ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, textX, 36);

      autoTable(doc, {
        startY: logoImg ? 48 : 45,
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
        margin: { top: 50, left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
            doc.rect(0, 0, 210, 15, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text('CONEXIA - SISTEMA DE CONVIVENCIA ESCOLAR', 15, 10);
          }
        }
      });

      doc.save('conexia_reporte_actividades_general.pdf');
      resolve();
    });
  });
};

export const exportRiceProtocolPDF = (
  p: RiceProtocol,
  student: Student,
  responsible: Staff | undefined
): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(p.school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'EXPEDIENTE DE PROTOCOLO DE ACTUACIÓN RICE';
      const themeColor: [number, number, number] = p.status === 'Abierto' ? [30, 41, 59] : [15, 118, 110]; // slate-800 or teal-700

      // Draw Header
      drawHeader(doc, p.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // Student & Protocol details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('1. ANTECEDENTES GENERALES', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
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

      let nextY = (doc as any).lastAutoTable.finalY + 8;
      nextY = checkPageOverflow(doc, nextY, 20, p.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('Fechas y Plazos del Proceso:', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
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
      nextY = (doc as any).lastAutoTable.finalY + 8;
      nextY = checkPageOverflow(doc, nextY, 20, p.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('2. RESUMEN DE ETAPAS CUMPLIDAS', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
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
      nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('3. BITÁCORA Y DETALLE POR ETAPA', 15, nextY);

      nextY = nextY + 6;

      p.steps.forEach((step) => {
        nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(`${step.name} - [${step.status}]`, 15, nextY);
        
        // Notes text
        const notesText = step.notes ? `Observaciones: ${step.notes}` : 'Sin observaciones registradas.';
        nextY = drawParagraph(doc, notesText, 15, nextY + 5, 180, p.school, title, themeColor, {
          fontSize: 9,
          lineHeight: 4.5,
          textColor: [71, 85, 105],
          logoImg
        });

        // Custom fields printing based on step
        if (step.id === '1_detection' && step.fields?.initialMeasures) {
          nextY = checkPageOverflow(doc, nextY, 10, p.school, title, themeColor, logoImg);
          const fieldText = `Medidas inmediatas de resguardo: ${step.fields.initialMeasures}`;
          nextY = drawParagraph(doc, fieldText, 15, nextY, 180, p.school, title, themeColor, {
            fontSize: 9,
            lineHeight: 4.5,
            textColor: [71, 85, 105],
            isItalic: true,
            logoImg
          });
        } 
        else if (step.id === '2_notification' && step.fields) {
          nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
          const fieldText = `Citación Apoderado Víctima: ${step.fields.victimParentNotifiedDate || 'N/A'} | Citación Apoderado Denunciado: ${step.fields.aggressorParentNotifiedDate || 'N/A'}\nMedio de Notificación: ${step.fields.communicationType || 'N/A'}`;
          nextY = drawParagraph(doc, fieldText, 15, nextY, 180, p.school, title, themeColor, {
            fontSize: 9,
            lineHeight: 4.5,
            textColor: [71, 85, 105],
            isItalic: true,
            logoImg
          });
        }
        else if (step.id === '3_investigation' && step.fields) {
          nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
          const fieldText = `Testigos/Entrevistados: ${Array.isArray(step.fields.interviews) ? step.fields.interviews.join(', ') : 'Ninguno'}\nConclusiones de la Investigación: ${step.fields.findings || 'N/A'}`;
          nextY = drawParagraph(doc, fieldText, 15, nextY, 180, p.school, title, themeColor, {
            fontSize: 9,
            lineHeight: 4.5,
            textColor: [71, 85, 105],
            isItalic: true,
            logoImg
          });
        }
        else if (step.id === '4_resolution' && step.fields) {
          nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
          const fieldText = `Tipo de Medida/Sanción: ${step.fields.measureType || 'N/A'}\nDescripción de la Medida: ${step.fields.resolutionDescription || 'N/A'}\n¿Firma de Compromiso?: ${step.fields.commitmentsSigned ? 'SÍ' : 'NO'}`;
          nextY = drawParagraph(doc, fieldText, 15, nextY, 180, p.school, title, themeColor, {
            fontSize: 9,
            lineHeight: 4.5,
            textColor: [71, 85, 105],
            isItalic: true,
            logoImg
          });
        }
        else if (step.id === '5_followup' && step.fields) {
          nextY = checkPageOverflow(doc, nextY, 15, p.school, title, themeColor, logoImg);
          const fieldText = `¿Derivado a Dupla Psicosocial?: ${step.fields.referredToDupla ? 'SÍ' : 'NO'} | Próximo Seguimiento: ${step.fields.followupDate || 'N/A'}\nResumen de Cierre: ${step.fields.finalReportSummary || 'N/A'}`;
          nextY = drawParagraph(doc, fieldText, 15, nextY, 180, p.school, title, themeColor, {
            fontSize: 9,
            lineHeight: 4.5,
            textColor: [71, 85, 105],
            isItalic: true,
            logoImg
          });
        }

        nextY = checkPageOverflow(doc, nextY, 5, p.school, title, themeColor, logoImg);
        doc.setDrawColor(241, 245, 249); // slate-100 divider
        doc.line(15, nextY, 195, nextY);
        nextY += 6;
      });

      // 4. MEDIDAS DE RESGUARDO (COMPLIANCE MINEDUC)
      if (p.measures && p.measures.length > 0) {
        nextY = checkPageOverflow(doc, nextY, 20, p.school, title, themeColor, logoImg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('4. MEDIDAS DE RESGUARDO (COMPLIANCE MINEDUC)', 15, nextY);

        const measuresBody = p.measures.map((m) => {
          const totalDays = Object.keys(m.complianceLog || {}).length;
          const compliedDays = Object.values(m.complianceLog || {}).filter(Boolean).length;
          const compliancePercent = totalDays > 0 ? Math.round((compliedDays / totalDays) * 100) : 100;
          return [
            m.description,
            m.responsibleName,
            `${m.startDate} al ${m.endDate}`,
            `${compliancePercent}% (${compliedDays}/${totalDays} d)`
          ];
        });

        autoTable(doc, {
          startY: nextY + 4,
          head: [['Medida Decretada', 'Responsable', 'Vigencia', 'Cumplimiento']],
          body: measuresBody,
          theme: 'grid',
          headStyles: { fillColor: [51, 65, 85] }, // slate-700
          margin: { left: 15, right: 15 }
        });

        nextY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Confidentiality warning
      nextY = checkPageOverflow(doc, nextY, 25, p.school, title, themeColor, logoImg);
      
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(248, 113, 113); // red-400
      doc.rect(15, nextY, 180, 20, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text('ADVERTENCIA DE CONFIDENCIALIDAD (Ley N° 19.628 de Protección de la Vida Privada):', 20, nextY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text('Este documento contiene información privada de un proceso disciplinario escolar. Su divulgación a terceros ajenos', 20, nextY + 12);
      doc.text('al caso está estrictamente prohibida y sancionada por la legislación vigente.', 20, nextY + 16);

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
      
      drawSignatures(doc, names, roles, nextY + 25, p.school, title, themeColor, logoImg);

      doc.save(`conexia_protocolo_${p.id}.pdf`);
      resolve();
    });
  });
};

export const exportManagementObjectivesReportPDF = (
  objectives: ManagementObjective[],
  activities: Activity[],
  school: string
): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'INFORME DE CUMPLIMIENTO: PLAN DE GESTIÓN';
      const themeColor: [number, number, number] = [79, 70, 229]; // indigo-600

      drawHeader(doc, school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // Objectives List Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('RESUMEN DE OBJETIVOS E HITOS DEL PLAN ANUAL', 15, startY);

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
        startY: startY + 4,
        head: [['Objetivo / Meta', 'Categoría', 'Alcance', 'Estado', 'Actividades Vinculadas']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        margin: { top: 50, left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawHeader(doc, school, title, themeColor, logoImg);
          }
        }
      });

      let nextY = (doc as any).lastAutoTable.finalY + 15;
      nextY = checkPageOverflow(doc, nextY, 20, school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
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
        nextY = checkPageOverflow(doc, nextY, 15, school, title, themeColor, logoImg);
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
          headStyles: { fillColor: [5, 150, 105] }, // emerald-650 -> emerald-600
          margin: { top: 50, left: 15, right: 15 },
          didDrawPage: (data) => {
            if (data.pageNumber > 1) {
              drawHeader(doc, school, title, themeColor, logoImg);
            }
          }
        });
      }

      doc.save(`conexia_plan_gestion_${school.replace(/\s+/g, '_')}.pdf`);
      resolve();
    });
  });
};

export const exportExternalReferralPDF = (
  referral: ExternalReferral,
  student: Student,
  professional: Staff
): Promise<void> => {
  return new Promise((resolve) => {
    loadBioBioLogo(referral.school).then((logoImg) => {
      const doc = new jsPDF();
      const title = 'FICHA DE DERIVACIÓN INTERSECTORIAL';
      const themeColor: [number, number, number] = [124, 58, 237]; // violet-600

      drawHeader(doc, referral.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // Institution details & Metadata
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('DATOS DE LA INSTITUCIÓN RECEPTORA', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Institución de Destino', 'Estado Derivación', 'Fecha de Envío', 'Oficio / Folio N°']],
        body: [[
          referral.institution,
          referral.status,
          referral.sentDate || 'Pendiente',
          referral.folioNumber || 'Pendiente'
        ]],
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        margin: { top: 50, left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawHeader(doc, referral.school, title, themeColor, logoImg);
          }
        }
      });

      // Student Section
      let nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, referral.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('ANTECEDENTES PERSONALES DEL ESTUDIANTE', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Nombre Completo', 'RUT', 'Curso', 'Apoderado / Tutor']],
        body: [[
          `${student.firstName} ${student.lastName}`,
          student.rut,
          student.grade,
          student.parentName || 'No Registrado'
        ]],
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        margin: { top: 50, left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawHeader(doc, referral.school, title, themeColor, logoImg);
          }
        }
      });

      // Technical Details
      nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, referral.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('MOTIVO TÉCNICO DE DERIVACIÓN Y ANTECEDENTES', 15, nextY);

      nextY = checkPageOverflow(doc, nextY + 6, 12, referral.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('1. Síntesis diagnóstica / Motivos detectados:', 15, nextY);
      
      nextY = drawParagraph(doc, referral.reason, 15, nextY + 5, 180, referral.school, title, themeColor, {
        fontSize: 9.5,
        lineHeight: 5,
        textColor: [30, 41, 59],
        logoImg
      });

      nextY = checkPageOverflow(doc, nextY + 5, 12, referral.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('2. Acciones y medidas adoptadas por el establecimiento:', 15, nextY);
      
      nextY = drawParagraph(doc, referral.previousMeasures, 15, nextY + 5, 180, referral.school, title, themeColor, {
        fontSize: 9.5,
        lineHeight: 5,
        textColor: [30, 41, 59],
        logoImg
      });

      if (referral.observations) {
        nextY = checkPageOverflow(doc, nextY + 5, 12, referral.school, title, themeColor, logoImg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('3. Observaciones / Comentarios adicionales:', 15, nextY);
        
        nextY = drawParagraph(doc, referral.observations, 15, nextY + 5, 180, referral.school, title, themeColor, {
          fontSize: 9.5,
          lineHeight: 5,
          textColor: [30, 41, 59],
          logoImg
        });
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

      drawSignatures(doc, names, roles, nextY + 10, referral.school, title, themeColor, logoImg);

      doc.save(`conexia_derivacion_${student.rut}.pdf`);
      resolve();
    });
  });
};

export const exportParentSummonsPDF = (
  summons: ParentSummons,
  student: Student,
  interviewer: Staff
): Promise<void> => {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    const title = 'CITACIÓN OFICIAL DE APODERADO';
    const themeColor: [number, number, number] = [30, 41, 59]; // slate-800

    const executeGeneration = (logoImg?: HTMLImageElement) => {
      // Draw Header
      drawHeader(doc, summons.school, title, themeColor, logoImg);

      const startY = logoImg ? 52 : 48;

      // 1. Antecedentes Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('1. ANTECEDENTES DE LA CITACIÓN', 15, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Estudiante', 'RUT', 'Curso', 'Apoderado Citado']],
        body: [[
          `${student.firstName} ${student.lastName}`,
          student.rut,
          student.grade,
          summons.apoderadoName
        ]],
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        margin: { left: 15, right: 15 }
      });

      // 2. Detalles de la Cita
      let nextY = (doc as any).lastAutoTable.finalY + 10;
      nextY = checkPageOverflow(doc, nextY, 20, summons.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. DETALLES Y LOGÍSTICA DE LA REUNIÓN', 15, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Fecha de Citación', 'Hora', 'Lugar', 'Entrevistador / Responsable']],
        body: [[
          summons.date,
          summons.time,
          summons.location,
          `${interviewer.firstName} ${interviewer.lastName} (${interviewer.role})`
        ]],
        theme: 'plain',
        margin: { left: 15, right: 15 }
      });

      // 3. Motivo de la Citación
      nextY = (doc as any).lastAutoTable.finalY + 8;
      nextY = checkPageOverflow(doc, nextY, 15, summons.school, title, themeColor, logoImg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Objetivo y Motivo de la Citación:', 15, nextY);
      
      nextY = drawParagraph(doc, summons.reason, 15, nextY + 6, 180, summons.school, title, themeColor, {
        fontSize: 10,
        lineHeight: 5,
        textColor: [51, 65, 85],
        logoImg
      });

      // 4. Bitácora de Acuerdos (solo si el estado es 'Asistió')
      if (summons.status === 'Asistió' && summons.notes) {
        nextY = checkPageOverflow(doc, nextY + 8, 15, summons.school, title, themeColor, logoImg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Acuerdos y Compromisos Alcanzados:', 15, nextY);
        
        nextY = drawParagraph(doc, summons.notes, 15, nextY + 6, 180, summons.school, title, themeColor, {
          fontSize: 10,
          lineHeight: 5,
          textColor: [51, 65, 85],
          logoImg
        });
      } else if (summons.status === 'No asistió') {
        nextY = checkPageOverflow(doc, nextY + 8, 15, summons.school, title, themeColor, logoImg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28); // red-700
        doc.text('REGISTRO DE INASISTENCIA:', 15, nextY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text('El apoderado citado NO se presentó a la entrevista en la fecha y hora señalada. Se procederá a re-citar.', 15, nextY + 5);
        nextY = nextY + 12;
      }

      // Signatures
      drawSignatures(
        doc,
        [`${interviewer.firstName} ${interviewer.lastName}`, 'Firma del Apoderado'],
        [interviewer.role, 'Aceptación y Compromiso'],
        nextY + 12,
        summons.school,
        title,
        themeColor,
        logoImg
      );

      doc.save(`conexia_citacion_${student.lastName.replace(/\s+/g, '_')}_${summons.date}.pdf`);
      resolve();
    };

    // Load insignia for Colegio BioBío
    const isBioBio = summons.school.toLowerCase().includes('biobío') || summons.school.toLowerCase().includes('biobio');
    if (isBioBio) {
      const img = new Image();
      img.src = '/colegio-biobio-logo.png';
      img.onload = () => {
        executeGeneration(img);
      };
      img.onerror = (err) => {
        console.warn("No se pudo cargar la insignia del Colegio BioBío:", err);
        executeGeneration();
      };
    } else {
      executeGeneration();
    }
  });
};

