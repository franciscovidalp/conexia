import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Users, 
  AlertCircle, 
  ArrowRight,
  Brain,
  Building,
  UserCheck,
  Link,
  Sparkles,
  BookmarkCheck,
  TrendingUp,
  X,
  FileText,
  Network
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, SchoolType, PsychosocialCase } from '../types';
import { SURVEY_TEMPLATES } from '../lib/surveyTemplates';
import toast from 'react-hot-toast';

interface ClimateDiagnosisModuleProps {
  activeSchool: SchoolType;
  students: Student[];
}

interface DIAResponse {
  studentId: string;
  studentName: string;
  answers: { [questionId: string]: number }; // Likert scale 1 to 5
  score: number; // average
  riskStatus: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  submittedAt: string;
}



export const ClimateDiagnosisModule: React.FC<ClimateDiagnosisModuleProps> = ({
  activeSchool,
  students
}) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState(SURVEY_TEMPLATES[0].id);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [responses, setResponses] = useState<any[]>([]);
  const [referredStudentIds, setReferredStudentIds] = useState<string[]>([]);
  const [activeIndividualResponse, setActiveIndividualResponse] = useState<any | null>(null);

  // Sociogram visualizer states
  const [activeNetwork, setActiveNetwork] = useState<'work' | 'play' | 'rejection' | 'reciprocal'>('work');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedSurvey = SURVEY_TEMPLATES.find(s => s.id === selectedSurveyId) || SURVEY_TEMPLATES[0];
  const courses = Array.from(new Set(students.filter(s => s.school === activeSchool).map(s => s.grade))).sort();

  const loadRealAnswers = async () => {
    if (!selectedCourse) return;
    try {
      const realAnswers = await dbService.getSurveyAnswers(selectedSurveyId, activeSchool, selectedCourse);
      if (realAnswers && realAnswers.length > 0) {
        const mapped = realAnswers.map(ans => ({
          studentId: ans.studentId,
          studentName: ans.studentName,
          answers: ans.responses,
          score: ans.score,
          riskStatus: ans.riskStatus,
          submittedAt: ans.submittedAt
        }));
        setResponses(mapped);
      } else {
        setResponses([]);
      }
    } catch (err) {
      console.error("Error loading survey answers:", err);
    }
  };

  // Reset local state on school change
  useEffect(() => {
    setSelectedCourse('');
    setResponses([]);
  }, [activeSchool]);

  // Load answers and referred status
  useEffect(() => {
    if (selectedCourse) {
      loadRealAnswers();
      checkReferredStatus();
    } else {
      setResponses([]);
    }
  }, [selectedCourse, selectedSurveyId, activeSchool]);

  const checkReferredStatus = async () => {
    try {
      const cases = await dbService.getPsychosocialCases(activeSchool);
      if (cases) {
        setReferredStudentIds(cases.map(c => c.studentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    if (!selectedCourse) {
      toast.error('Por favor seleccione un curso primero.');
      return;
    }
    const link = `${window.location.origin}/?surveyId=${selectedSurveyId}&school=${encodeURIComponent(activeSchool)}&grade=${encodeURIComponent(selectedCourse)}`;
    navigator.clipboard.writeText(link);
    toast.success('¡Enlace de encuesta copiado al portapapeles!');
  };
  const handleDeriveToPsychosocial = async (resp: DIAResponse) => {
    try {
      const student = students.find(s => s.id === resp.studentId);
      if (!student) {
        toast.error('Estudiante no encontrado en la base de datos.');
        return;
      }

      const payload: Omit<PsychosocialCase, 'id' | 'createdAt'> = {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        grade: student.grade,
        school: activeSchool,
        status: 'Ingresado',
        referredDate: new Date().toISOString().split('T')[0],
        reason: `Derivación automática desde Módulo Diagnóstico DIA (${selectedSurvey.title}). Puntaje promedio obtenido: ${resp.score}/5 (Clasificación de Riesgo: ${resp.riskStatus}).`,
        riskLevel: resp.riskStatus === 'Crítico' ? 'Crítico' : 'Alto'
      };

      await dbService.createPsychosocialCase(payload);
      setReferredStudentIds(prev => [...prev, student.id]);
      toast.success(`${student.firstName} ${student.lastName} derivado(a) de forma exitosa a la Dupla Psicosocial.`);
    } catch (e) {
      toast.error('Error al registrar derivación psicosocial.');
    }
  };

  const handleDeriveSociogramStudent = async (studentId: string, studentName: string, role: string, detailText: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Estudiante no encontrado en la base de datos.');
        return;
      }

      const payload: Omit<PsychosocialCase, 'id' | 'createdAt'> = {
        studentId: student.id,
        studentName: studentName,
        grade: student.grade,
        school: activeSchool,
        status: 'Ingresado',
        referredDate: new Date().toISOString().split('T')[0],
        reason: `Derivación automática desde Módulo Diagnóstico Sociométrico DIA. Rol de riesgo detectado: ${role}. Detalle de nominaciones recibidas: ${detailText}`,
        riskLevel: role === 'Aislado' ? 'Crítico' : 'Alto'
      };

      await dbService.createPsychosocialCase(payload);
      setReferredStudentIds(prev => [...prev, studentId]);
      toast.success(`${studentName} derivado(a) de forma exitosa a la Dupla Psicosocial.`);
    } catch (e) {
      toast.error('Error al registrar derivación psicosocial.');
    }
  };
  // Math metrics for charts
  const totalAnswers = responses.length;
  const criticalCount = responses.filter(r => r.riskStatus === 'Crítico' || r.riskStatus === 'Alto').length;
  
  // Calculate average by category
  const categoriesList = ['Clima Social', 'Autoestima', 'Seguridad', 'Apoyo Docente'] as const;
  const categoryStats = categoriesList.map(cat => {
    const catQuestions = selectedSurvey.questions.filter(q => q.category === cat);
    if (catQuestions.length === 0) return { category: cat, percentage: 0, count: 0 };
    
    let sum = 0;
    let answerCount = 0;
    
    responses.forEach(res => {
      catQuestions.forEach(q => {
        if (res.answers[q.id] !== undefined) {
          sum += res.answers[q.id];
          answerCount++;
        }
      });
    });

    // Score converted to percentage: 1-5 scale -> 1 is 0%, 5 is 100%
    const average = answerCount > 0 ? sum / answerCount : 0;
    const percentage = average > 0 ? Math.round(((average - 1) / 4) * 100) : 0;

    return {
      category: cat,
      percentage,
      count: answerCount
    };
  });

  // Calculate overall climate index (favorable percentage: 4 and 5 ratings)
  let favorableAnswersCount = 0;
  let totalRatingCount = 0;
  if (selectedSurveyId !== 'dia-sociograma') {
    responses.forEach(res => {
      Object.values(res.answers).forEach(val => {
        if (Number(val) >= 4) favorableAnswersCount++;
        totalRatingCount++;
      });
    });
  }
  const overallClimateIndex = totalRatingCount > 0 ? Math.round((favorableAnswersCount / totalRatingCount) * 100) : 0;

  // Alertas críticas (students with risk Crítico or Alto)
  const criticalAlerts = responses.filter(r => r.riskStatus === 'Crítico' || r.riskStatus === 'Alto');

  // Find critical and strong dimensions for group feedback
  const getGroupFeedback = () => {
    if (responses.length === 0) return null;
    
    // Sort dimensions by score
    const sortedStats = [...categoryStats].sort((a, b) => b.percentage - a.percentage);
    const strongDim = sortedStats[0];
    const criticalDim = sortedStats[sortedStats.length - 1];

    let diagnosis = '';
    let actionPlan = '';

    if (criticalDim.category === 'Seguridad') {
      diagnosis = 'El curso reporta debilidades en seguridad escolar, manifestando temor ante el bullying, desinformación sobre los canales de denuncia o presenciando agresiones en espacios comunes.';
      actionPlan = 'Coordinar con Inspectoría General un ciclo de mediación escolar. Agendar un Taller RICE preventivo sobre Ciberacoso y Violencia de Género. Agilizar entrevistas de apoyo individual a los casos detectados en riesgo crítico.';
    } else if (criticalDim.category === 'Autoestima') {
      diagnosis = 'Se observan índices preocupantes en bienestar socioemocional y autovaloración. Los estudiantes expresan dificultades para identificar o regular sus emociones y carecen de un espacio percibido como seguro para desahogarse.';
      actionPlan = 'Derivar de manera colectiva al curso a dinámicas grupales de contención socioemocional. Programar sesiones informativas sobre el autocuidado y salud mental con el psicólogo del establecimiento.';
    } else if (criticalDim.category === 'Clima Social') {
      diagnosis = 'Existen problemas de convivencia general, falta de integración y dificultades en la resolución dialogada de desacuerdos. Los estudiantes sienten que hay discriminación o exclusiones intencionadas.';
      actionPlan = 'Implementar talleres formativos enfocados en la empatía, trabajo en equipo y comunicación asertiva. Involucrar a los profesores jefes en consejos de curso dedicados al Reglamento Interno (RICE).';
    } else { // Apoyo Docente
      diagnosis = 'Los estudiantes perciben una distancia con sus profesores y una falta de apoyo frente a problemas académicos o personales. Sienten que sus opiniones no son escuchadas con la suficiente empatía.';
      actionPlan = 'Realizar una jornada de reflexión técnico-pedagógica (consejo docente) para revisar prácticas de contención emocional en el aula. Facilitar espacios de comunicación asertiva entre el profesor jefe y los alumnos.';
    }

    return {
      strongCategory: strongDim.category,
      strongPercentage: strongDim.percentage,
      criticalCategory: criticalDim.category,
      criticalPercentage: criticalDim.percentage,
      diagnosis,
      actionPlan
    };
  };

  const groupFeedback = getGroupFeedback();

  const getIndividualStats = (resp: DIAResponse) => {
    const cats: { [key: string]: { sum: number, count: number } } = {
      'Clima Social': { sum: 0, count: 0 },
      'Autoestima': { sum: 0, count: 0 },
      'Seguridad': { sum: 0, count: 0 },
      'Apoyo Docente': { sum: 0, count: 0 }
    };

    selectedSurvey.questions.forEach(q => {
      const val = resp.answers[q.id];
      if (val !== undefined && cats[q.category]) {
        cats[q.category].sum += val;
        cats[q.category].count++;
      }
    });

    return Object.keys(cats).map(catName => {
      const data = cats[catName];
      const avg = data.count > 0 ? data.sum / data.count : 0;
      const pct = avg > 0 ? Math.round(((avg - 1) / 4) * 100) : 0;
      return { category: catName, percentage: pct, average: Number(avg.toFixed(1)) };
    });
  };

  const getIndividualRecommendation = (score: number) => {
    if (score < 2.5) {
      return {
        title: 'ALERTA DE RIESGO CRÍTICO',
        style: 'bg-red-550/10 text-red-700 border-red-200',
        rec: 'Derivar de inmediato al estudiante al equipo psicosocial (Psicólogo) para realizar una evaluación clínica y de contención de urgencia. Agendar citación formal de apoderado dentro de las primeras 48 horas para coordinar apoyos familiares y/o derivaciones a redes externas (CESFAM, OPD).'
      };
    } else if (score < 3.2) {
      return {
        title: 'ALERTA DE RIESGO ALTO',
        style: 'bg-orange-50 text-orange-700 border-orange-250',
        rec: 'Coordinar entrevista de exploración psicopedagógica con la psicóloga escolar en los próximos 5 días hábiles. Se recomienda integrar al estudiante a talleres socioemocionales de carácter focalizado y monitorear su integración en los recreos.'
      };
    } else if (score < 4.0) {
      return {
        title: 'SEGUIMIENTO PREVENTIVO',
        style: 'bg-amber-50 text-amber-705 border-amber-250',
        rec: 'Mantener monitoreo pasivo en aula por parte del profesor jefe. Reforzar interacciones respetuosas, fomentar su participación activa en dinámicas grupales y motivar su asistencia a talleres preventivos de convivencia.'
      };
    } else {
      return {
        title: 'ESTADO DE BIENESTAR ÓPTIMO',
        style: 'bg-emerald-50 text-emerald-700 border-emerald-250',
        rec: 'El estudiante reporta niveles de autoestima y seguridad altamente favorables. Se recomienda incentivar su participación como líder positivo del curso, promotor de sana convivencia escolar o mediador par de conflictos.'
      };
    }
  };

  // Sociogram Math Calculations
  const courseStudents = students.filter(s => s.school === activeSchool && s.grade === selectedCourse);
  const roster = courseStudents.length > 0 ? courseStudents : Array.from(new Set(responses.map(r => r.studentId))).map(id => {
    const r = responses.find(resp => resp.studentId === id);
    return {
      id,
      rut: id,
      firstName: r?.studentName.split(' ')[0] || 'Estudiante',
      lastName: r?.studentName.split(' ').slice(1).join(' ') || id,
      school: activeSchool,
      grade: selectedCourse || '',
      conductScore: 100
    };
  });

  const getAnswersList = (ansObj: any, qId: string) => {
    if (!ansObj) return [];
    const val = ansObj[qId];
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return [];
  };

  const sociometricData = roster.map(student => {
    const id = student.id;
    const name = `${student.firstName} ${student.lastName}`;

    const chosenWork: string[] = [];
    const rejectedWork: string[] = [];
    const chosenPlay: string[] = [];
    const rejectedPlay: string[] = [];
    const nominatedLeader: string[] = [];
    const nominatedIsolated: string[] = [];

    let selectionsWork: string[] = [];
    let selectionsRejectedWork: string[] = [];
    let selectionsPlay: string[] = [];
    let selectionsRejectedPlay: string[] = [];
    let selectionsLeader: string[] = [];
    let selectionsIsolated: string[] = [];

    // Selections made by this student (outgoing)
    const ownResponse = responses.find(r => r.studentId === id);
    if (ownResponse) {
      selectionsWork = getAnswersList(ownResponse.answers, 'q1');
      selectionsRejectedWork = getAnswersList(ownResponse.answers, 'q2');
      selectionsPlay = getAnswersList(ownResponse.answers, 'q3');
      selectionsRejectedPlay = getAnswersList(ownResponse.answers, 'q4');
      selectionsLeader = getAnswersList(ownResponse.answers, 'q5');
      selectionsIsolated = getAnswersList(ownResponse.answers, 'q6');
    }

    // Nominations received by this student (incoming)
    responses.forEach(r => {
      const chooserId = r.studentId;
      if (getAnswersList(r.answers, 'q1').includes(id)) chosenWork.push(chooserId);
      if (getAnswersList(r.answers, 'q2').includes(id)) rejectedWork.push(chooserId);
      if (getAnswersList(r.answers, 'q3').includes(id)) chosenPlay.push(chooserId);
      if (getAnswersList(r.answers, 'q4').includes(id)) rejectedPlay.push(chooserId);
      if (getAnswersList(r.answers, 'q5').includes(id)) nominatedLeader.push(chooserId);
      if (getAnswersList(r.answers, 'q6').includes(id)) nominatedIsolated.push(chooserId);
    });

    const ep = chosenWork.length + chosenPlay.length;
    const rn = rejectedWork.length + rejectedPlay.length;

    return {
      id,
      name,
      student,
      chosenWork,
      rejectedWork,
      chosenPlay,
      rejectedPlay,
      nominatedLeader,
      nominatedIsolated,
      selectionsWork,
      selectionsRejectedWork,
      selectionsPlay,
      selectionsRejectedPlay,
      selectionsLeader,
      selectionsIsolated,
      ep,
      rn
    };
  });

  // Calculate mutual selections
  const reciprocalConnections: { from: string; to: string; type: 'work' | 'play' | 'both' }[] = [];
  const processedPairs = new Set<string>();

  sociometricData.forEach(A => {
    sociometricData.forEach(B => {
      if (A.id === B.id) return;
      const pairKey = [A.id, B.id].sort().join('-');
      if (processedPairs.has(pairKey)) return;

      const isWorkReciprocal = A.selectionsWork.includes(B.id) && B.selectionsWork.includes(A.id);
      const isPlayReciprocal = A.selectionsPlay.includes(B.id) && B.selectionsPlay.includes(A.id);

      if (isWorkReciprocal || isPlayReciprocal) {
        reciprocalConnections.push({
          from: A.id,
          to: B.id,
          type: isWorkReciprocal && isPlayReciprocal ? 'both' : isWorkReciprocal ? 'work' : 'play'
        });
        processedPairs.add(pairKey);
      }
    });
  });

  // Classify sociometric status roles
  const starStudents = sociometricData.filter(s => s.ep >= 4).map(s => s.id);
  const rejectedStudents = sociometricData.filter(s => s.rn >= 3).map(s => s.id);
  const leaderStudents = sociometricData.filter(s => s.nominatedLeader.length >= 3).map(s => s.id);
  const isolatedStudents = sociometricData.filter(s => s.ep === 0 && (s.nominatedIsolated.length > 0 || responses.some(r => r.studentId === s.id))).map(s => s.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-indigo-600" />
            <span>Clima Social Escolar y Diagnóstico DIA</span>
          </h2>
          <p className="text-sm text-slate-500">Módulo de encuestas socioemocionales e indicadores climáticos por nivel escolar.</p>
        </div>
      </div>

      {/* FILTER & SELECT BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Survey Template Select */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Brain size={12} className="text-indigo-500" />
            <span>Seleccionar Encuesta DIA</span>
          </label>
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="w-full bg-slate-50 text-slate-850 rounded-xl border border-slate-200 p-2.5 text-sm focus:border-indigo-500 font-semibold"
          >
            {SURVEY_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Course Select */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building size={12} className="text-indigo-500" />
            <span>Curso Escolar</span>
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-slate-50 text-slate-855 rounded-xl border border-slate-200 p-2.5 text-sm focus:border-indigo-500 font-semibold"
          >
            <option value="">-- Seleccionar Curso --</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Actions Column */}
        <div className="pt-5 md:pt-4">
          {selectedCourse ? (
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
            >
              <Link size={14} />
              <span>Copiar Enlace de Encuesta</span>
            </button>
          ) : (
            <div className="text-center text-xs text-slate-400 font-semibold py-5 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
              Seleccione un curso para ver opciones
            </div>
          )}
        </div>
      </div>

      {/* DETAILED SURVEY DESCRIPTION */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex gap-3">
        <InfoIcon className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-indigo-900 block">{selectedSurvey.title}</strong>
          <p className="text-indigo-950/80 mt-1 leading-relaxed">{selectedSurvey.description}</p>
        </div>
      </div>

      {totalAnswers === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Sin Respuestas Aún</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Seleccione el curso y comparta el enlace de la encuesta con los estudiantes. Las respuestas aparecerán aquí automáticamente una vez que los alumnos completen el cuestionario.
          </p>
        </div>
      ) : selectedSurveyId === 'dia-sociograma' ? (
        <div className="space-y-6 animate-in fade-in slide-in">
          {/* 1. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Participation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Participación</span>
                <span className="text-lg font-black text-slate-800">{responses.length} / {roster.length} Alumnos</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                  {Math.round((responses.length / roster.length) * 100)}% Completado
                </span>
              </div>
            </div>

            {/* Stars */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Sparkles size={20} className="text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alumnos Estrella</span>
                <span className="text-lg font-black text-slate-800">{starStudents.length} Detectados</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">≥ 4 elecciones recibidas</span>
              </div>
            </div>

            {/* Isolated */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alumnos Aislados</span>
                <span className="text-lg font-black text-slate-800">{isolatedStudents.length} Alertas</span>
                <span className="text-[10px] text-slate-550 block mt-0.5">0 elecciones recibidas</span>
              </div>
            </div>

            {/* Reciprocal links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
              <div className="p-3 bg-fuchsia-50 text-fuchsia-650 rounded-xl">
                <Network size={20} className="text-fuchsia-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lazos Recíprocos</span>
                <span className="text-lg font-black text-slate-800">{reciprocalConnections.length} Conexiones</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Mutua aceptación</span>
              </div>
            </div>
          </div>

          {/* 2. Main Visualizer and Detail panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graph Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Mapa Social de Relaciones del Curso</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      Grafo circular interactivo de nominaciones
                    </p>
                  </div>
                  
                  {/* Network filters */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'work', label: 'Trabajo (+)', color: 'bg-indigo-600' },
                      { id: 'play', label: 'Recreo (+)', color: 'bg-violet-650' },
                      { id: 'rejection', label: 'Rechazos (-)', color: 'bg-red-500' },
                      { id: 'reciprocal', label: 'Recíprocos', color: 'bg-emerald-600' }
                    ].map(net => (
                      <button
                        key={net.id}
                        onClick={() => setActiveNetwork(net.id as any)}
                        className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          activeNetwork === net.id
                            ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {net.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Graph SVG canvas */}
                <div className="relative flex items-center justify-center p-4">
                  {/* Instructions banner */}
                  <div className="absolute top-2 left-2 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-150 pointer-events-none">
                    💡 Pasa el ratón (hover) sobre un nodo para aislar sus relaciones
                  </div>

                  <svg viewBox="0 0 600 600" className="w-full max-w-[500px] h-auto select-none">
                    {/* SVG Definitions for Arrowheads */}
                    <defs>
                      <marker id="arrow-work" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
                      </marker>
                      <marker id="arrow-play" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                      </marker>
                      <marker id="arrow-rejection" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                      </marker>
                      <marker id="arrow-reciprocal" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                      </marker>
                    </defs>

                    {/* 1. Links (Nominations lines) */}
                    {(() => {
                      const width = 600;
                      const height = 600;
                      const cx = width / 2;
                      const cy = height / 2;
                      const r = 210;

                      // Position mapping
                      const nodePositions = sociometricData.map((node, index) => {
                        const angle = (2 * Math.PI * index) / sociometricData.length - Math.PI / 2;
                        const x = cx + r * Math.cos(angle);
                        const y = cy + r * Math.sin(angle);
                        return { id: node.id, x, y };
                      });

                      const links: { sourceId: string; targetId: string; style: string; marker: string; isNegative: boolean }[] = [];

                      sociometricData.forEach(source => {
                        let targets: string[] = [];
                        let style = '';
                        let marker = '';
                        let isNegative = false;

                        if (activeNetwork === 'work') {
                          targets = source.selectionsWork;
                          style = '#4f46e5';
                          marker = 'url(#arrow-work)';
                        } else if (activeNetwork === 'play') {
                          targets = source.selectionsPlay;
                          style = '#8b5cf6';
                          marker = 'url(#arrow-play)';
                        } else if (activeNetwork === 'rejection') {
                          targets = [...new Set([...source.selectionsRejectedWork, ...source.selectionsRejectedPlay])];
                          style = '#ef4444';
                          marker = 'url(#arrow-rejection)';
                          isNegative = true;
                        } else if (activeNetwork === 'reciprocal') {
                          // Only reciprocal connections
                          targets = [
                            ...source.selectionsWork.filter(tid => {
                              const targetNode = sociometricData.find(tn => tn.id === tid);
                              return targetNode?.selectionsWork.includes(source.id);
                            }),
                            ...source.selectionsPlay.filter(tid => {
                              const targetNode = sociometricData.find(tn => tn.id === tid);
                              return targetNode?.selectionsPlay.includes(source.id);
                            })
                          ];
                          style = '#10b981';
                          marker = 'url(#arrow-reciprocal)';
                        }

                        targets.forEach(targetId => {
                          links.push({
                            sourceId: source.id,
                            targetId,
                            style,
                            marker,
                            isNegative
                          });
                        });
                      });

                      return links.map((link, idx) => {
                        const source = nodePositions.find(p => p.id === link.sourceId);
                        const target = nodePositions.find(p => p.id === link.targetId);
                        if (!source || !target) return null;

                        const isHoveredActive = hoveredNodeId !== null;
                        const isRelevant = !isHoveredActive || (link.sourceId === hoveredNodeId || link.targetId === hoveredNodeId);
                        
                        let opacity = 0.35;
                        if (isHoveredActive) {
                          opacity = isRelevant ? 1.0 : 0.03;
                        } else if (activeNetwork === 'rejection') {
                          opacity = 0.25;
                        }

                        const dx = target.x - source.x;
                        const dy = target.y - source.y;
                        const dr = Math.sqrt(dx * dx + dy * dy);

                        const isMutual = sociometricData.find(s => s.id === link.sourceId)?.selectionsWork.includes(link.targetId) &&
                                          sociometricData.find(s => s.id === link.targetId)?.selectionsWork.includes(link.sourceId);
                        
                        let pathD = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
                        if (isMutual || activeNetwork === 'reciprocal' || activeNetwork === 'rejection') {
                          const h = 18;
                          const mx = (source.x + target.x) / 2;
                          const my = (source.y + target.y) / 2;
                          const px = -dy / dr;
                          const py = dx / dr;
                          const qx = mx + h * px;
                          const qy = my + h * py;
                          pathD = `M ${source.x} ${source.y} Q ${qx} ${qy} ${target.x} ${target.y}`;
                        }

                        return (
                          <path
                            key={idx}
                            d={pathD}
                            fill="none"
                            stroke={link.style}
                            strokeWidth={isRelevant && isHoveredActive ? 2.5 : 1.5}
                            strokeDasharray={link.isNegative ? '3,3' : undefined}
                            opacity={opacity}
                            markerEnd={link.marker}
                            className="transition-all duration-200"
                          />
                        );
                      });
                    })()}

                    {/* 2. Nodes (Student Circles) */}
                    {(() => {
                      const width = 600;
                      const height = 600;
                      const cx = width / 2;
                      const cy = height / 2;
                      const r = 210;

                      return sociometricData.map((node, index) => {
                        const angle = (2 * Math.PI * index) / sociometricData.length - Math.PI / 2;
                        const x = cx + r * Math.cos(angle);
                        const y = cy + r * Math.sin(angle);

                        const isStar = starStudents.includes(node.id);
                        const isRejected = rejectedStudents.includes(node.id);
                        const isIsolated = isolatedStudents.includes(node.id);
                        const isLeader = leaderStudents.includes(node.id);

                        let fill = '#f8fafc';
                        let stroke = '#64748b';
                        let strokeWidth = '1.5';
                        let nodeRadius = 18;

                        if (isStar) {
                          fill = '#e0e7ff';
                          stroke = '#4f46e5';
                          strokeWidth = '2.5';
                        } else if (isRejected) {
                          fill = '#ffe4e6';
                          stroke = '#e11d48';
                          strokeWidth = '2.5';
                        } else if (isIsolated) {
                          fill = '#fffbeb';
                          stroke = '#d97706';
                          strokeWidth = '2';
                        } else if (isLeader) {
                          fill = '#ede9fe';
                          stroke = '#7c3aed';
                          strokeWidth = '2';
                        }

                        if (selectedNodeId === node.id) {
                          strokeWidth = '4';
                          nodeRadius = 20;
                        }

                        const isHoveredActive = hoveredNodeId !== null;
                        const isSelf = hoveredNodeId === node.id;
                        const isConnected = isHoveredActive && (
                          node.selectionsWork.includes(hoveredNodeId) ||
                          node.selectionsPlay.includes(hoveredNodeId) ||
                          node.selectionsRejectedWork.includes(hoveredNodeId) ||
                          node.selectionsRejectedPlay.includes(hoveredNodeId) ||
                          sociometricData.find(s => s.id === hoveredNodeId)?.selectionsWork.includes(node.id) ||
                          sociometricData.find(s => s.id === hoveredNodeId)?.selectionsPlay.includes(node.id) ||
                          sociometricData.find(s => s.id === hoveredNodeId)?.selectionsRejectedWork.includes(node.id) ||
                          sociometricData.find(s => s.id === hoveredNodeId)?.selectionsRejectedPlay.includes(node.id)
                        );
                        
                        let opacity = 1.0;
                        if (isHoveredActive && !isSelf && !isConnected) {
                          opacity = 0.2;
                        }

                        const initials = node.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                        const labelX = x;
                        const labelY = y + 32;

                        return (
                          <g
                            key={node.id}
                            opacity={opacity}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => setSelectedNodeId(node.id)}
                            className="cursor-pointer transition-all duration-200"
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={nodeRadius}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={strokeWidth}
                              strokeDasharray={isIsolated ? '3,3' : undefined}
                              className="filter drop-shadow-sm hover:scale-110 transition-transform duration-200"
                            />
                            <text
                              x={x}
                              y={y + 4}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="bold"
                              fill={stroke === '#64748b' ? '#334155' : stroke}
                              className="font-mono pointer-events-none"
                            >
                              {initials}
                            </text>
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="semibold"
                              fill="#475569"
                              className="pointer-events-none filter drop-shadow-xs"
                            >
                              {node.name.split(' ')[0]}
                            </text>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs font-semibold text-slate-650 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-50 border-2 border-indigo-600 block"></span>
                  <span>Estrella (Aceptado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-50 border-2 border-rose-600 block"></span>
                  <span>Rechazado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-50 border-2 border-amber-600 border-dashed block"></span>
                  <span>Aislado (0 elecciones)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-violet-50 border-2 border-violet-600 block"></span>
                  <span>Referente/Líder</span>
                </div>
              </div>
            </div>

            {/* Right column: student profile & course alerts */}
            <div className="space-y-6">
              
              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
                  Ficha Sociométrica Individual
                </h3>

                {selectedNodeId ? (() => {
                  const sData = sociometricData.find(s => s.id === selectedNodeId);
                  if (!sData) return null;

                  const isStar = starStudents.includes(sData.id);
                  const isRejected = rejectedStudents.includes(sData.id);
                  const isIsolated = isolatedStudents.includes(sData.id);
                  const isLeader = leaderStudents.includes(sData.id);
                  const isReferred = referredStudentIds.includes(sData.id);

                  const getNamesFromIds = (ids: string[]) => {
                    return ids.map(id => {
                      const matched = sociometricData.find(x => x.id === id);
                      return matched ? matched.name.split(' ')[0] : id;
                    }).join(', ');
                  };

                  return (
                    <div className="space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 relative">
                        <p className="font-black text-slate-800 text-sm leading-tight">{sData.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">RUT: {sData.id}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {isStar && <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[8px] px-2 py-0.2 rounded-full">ESTRELLA</span>}
                          {isLeader && <span className="bg-violet-50 border border-violet-200 text-violet-700 font-extrabold text-[8px] px-2 py-0.2 rounded-full">LÍDER</span>}
                          {isRejected && <span className="bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[8px] px-2 py-0.2 rounded-full">RECHAZADO</span>}
                          {isIsolated && <span className="bg-amber-50 border border-amber-250 text-amber-705 font-extrabold text-[8px] px-2 py-0.2 rounded-full border-dashed">AISLADO</span>}
                          {!isStar && !isRejected && !isIsolated && !isLeader && <span className="bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[8px] px-2 py-0.2 rounded-full">NORMAL</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Elecciones (+)</span>
                          <span className="text-xl font-mono font-extrabold text-indigo-650">{sData.ep}</span>
                          <p className="text-[8px] text-slate-400 mt-0.5">{sData.chosenWork.length} Trab. | {sData.chosenPlay.length} Recr.</p>
                        </div>
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Rechazos (-)</span>
                          <span className="text-xl font-mono font-extrabold text-red-650">{sData.rn}</span>
                          <p className="text-[8px] text-slate-400 mt-0.5">{sData.rejectedWork.length} Trab. | {sData.rejectedPlay.length} Recr.</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 text-[11px] leading-relaxed">
                        <div>
                          <strong className="text-slate-700 block">Elegido para trabajar por:</strong>
                          <span className="text-slate-550 block bg-slate-50/20 px-2 py-1 rounded">
                            {getNamesFromIds(sData.chosenWork) || <em className="text-slate-400">Ningún compañero</em>}
                          </span>
                        </div>
                        <div>
                          <strong className="text-slate-700 block">Elegido para recreos por:</strong>
                          <span className="text-slate-550 block bg-slate-50/20 px-2 py-1 rounded">
                            {getNamesFromIds(sData.chosenPlay) || <em className="text-slate-400">Ningún compañero</em>}
                          </span>
                        </div>
                        <div>
                          <strong className="text-slate-700 block">Elegido como Líder por:</strong>
                          <span className="text-slate-550 block bg-slate-50/20 px-2 py-1 rounded">
                            {getNamesFromIds(sData.nominatedLeader) || <em className="text-slate-400">Ningún compañero</em>}
                          </span>
                        </div>
                        {isRejected && (
                          <div className="bg-rose-50/40 border border-rose-100/50 p-2.5 rounded-xl">
                            <strong className="text-rose-700 block">Compañeros que prefieren NO trabajar con él:</strong>
                            <span className="text-rose-600 block">
                              {getNamesFromIds(sData.rejectedWork) || <em className="text-slate-400">Ninguno</em>}
                            </span>
                          </div>
                        )}
                      </div>

                      {(isIsolated || isRejected) && (
                        <div className="pt-3 border-t border-slate-100">
                          {isReferred ? (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                              <UserCheck size={14} />
                              <span>Derivado Exitosamente a Dupla</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeriveSociogramStudent(
                                sData.id,
                                sData.name,
                                isIsolated ? 'Aislado' : 'Rechazado',
                                `${sData.chosenWork.length} elecciones trabajo, ${sData.chosenPlay.length} elecciones juego, ${sData.rn} rechazos recibidos.`
                              )}
                              className="w-full bg-rose-600 hover:bg-rose-750 text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>Derivar Caso a Dupla Psicosocial</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="text-center py-10 text-slate-400 font-medium">
                    Haga clic en algún estudiante del sociograma para ver su información y relaciones detalladas.
                  </div>
                )}
              </div>

              {/* Course alert lists */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-amber-500" />
                    <span>Estudiantes en Riesgo Relacional</span>
                  </h3>
                  <span className="font-mono bg-amber-50 text-amber-705 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    {isolatedStudents.length + rejectedStudents.length} Alertas
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {sociometricData.filter(s => isolatedStudents.includes(s.id) || rejectedStudents.includes(s.id)).map(s => {
                    const isIso = isolatedStudents.includes(s.id);
                    const isRef = referredStudentIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedNodeId(s.id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-700">{s.name}</p>
                          <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 border rounded-full mt-1 ${
                            isIso ? 'bg-amber-50 text-amber-700 border-amber-200 border-dashed' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isIso ? 'AISLADO' : 'RECHAZADO'}
                          </span>
                        </div>

                        <div>
                          {isRef ? (
                            <span className="text-emerald-650 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 block">Derivado</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeriveSociogramStudent(
                                  s.id,
                                  s.name,
                                  isIso ? 'Aislado' : 'Rechazado',
                                  `${s.ep} elecciones, ${s.rn} rechazos.`
                                );
                              }}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer block text-center"
                            >
                              Derivar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isolatedStudents.length + rejectedStudents.length === 0 && (
                    <div className="text-center py-4 text-slate-400 font-medium">
                      No se detectan alumnos en riesgo para este curso.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Socio-Matrix Summary Table */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
                Listado General de Puntuaciones Sociométricas
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-2.5">Estudiante</th>
                      <th className="py-2.5 text-center">Elecciones Trabajo (d+)</th>
                      <th className="py-2.5 text-center">Elecciones Recreo (d+)</th>
                      <th className="py-2.5 text-center">Rechazos Trabajo (d-)</th>
                      <th className="py-2.5 text-center">Rechazos Recreo (d-)</th>
                      <th className="py-2.5 text-center">Lazos Recíprocos</th>
                      <th className="py-2.5 text-right">Rol Detectado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {sociometricData.map(s => {
                      const isStar = starStudents.includes(s.id);
                      const isRejected = rejectedStudents.includes(s.id);
                      const isIsolated = isolatedStudents.includes(s.id);
                      const isLeader = leaderStudents.includes(s.id);
                      const reciprocalCount = reciprocalConnections.filter(c => c.from === s.id || c.to === s.id).length;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedNodeId(s.id)}
                          className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
                          title="Ver Ficha Sociométrica"
                        >
                          <td className="py-2.5 font-bold text-slate-800">{s.name}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-slate-650">{s.chosenWork.length}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-slate-650">{s.chosenPlay.length}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-red-500">{s.rejectedWork.length}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-red-500">{s.rejectedPlay.length}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-emerald-650">{reciprocalCount}</td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-block px-2 py-0.2 rounded-full border text-[9px] font-extrabold ${
                              isStar ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              isIsolated ? 'bg-amber-50 text-amber-705 border-amber-250 border-dashed' :
                              isLeader ? 'bg-violet-50 text-violet-700 border-violet-200' :
                              'bg-slate-50 text-slate-550 border-slate-200'
                            }`}>
                              {isStar ? 'ESTRELLA' : isRejected ? 'RECHAZADO' : isIsolated ? 'AISLADO' : isLeader ? 'LÍDER' : 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* STATS COL: Overall climate & Category progress */}
          <div className="space-y-6">
            
            {/* Overall index card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between items-center text-center">
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Índice Clima Favorable</h4>
                <p className="text-xs text-slate-500 mt-0.5">Respuestas de acuerdo / muy de acuerdo</p>
              </div>

              <div className="relative flex items-center justify-center my-6">
                <div className={`w-32 h-32 rounded-full border-[10px] flex flex-col items-center justify-center font-bold text-sm ${
                  overallClimateIndex >= 75 ? 'border-emerald-500 text-emerald-600' :
                  overallClimateIndex >= 50 ? 'border-amber-500 text-amber-600' :
                  'border-rose-500 text-rose-600'
                }`}>
                  <span className="text-3xl font-black">{overallClimateIndex}%</span>
                  <span className="text-[9px] font-mono text-slate-400">FAVORABLE</span>
                </div>
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-slate-400 block font-bold">ENCUESTADOS</span>
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <Users size={12} className="text-indigo-500" />
                    {totalAnswers} Alumnos
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold">CASOS ALERTA</span>
                  <span className="font-extrabold text-rose-600 flex items-center gap-1.5 mt-0.5 justify-end">
                    <AlertCircle size={12} />
                    {criticalCount} Críticos
                  </span>
                </div>
              </div>
            </div>

            {/* Category progress cards */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Resultado por Dimensión</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Promedio de satisfacción</p>
              </div>

              <div className="space-y-4">
                {categoryStats.map(stat => (
                  <div key={stat.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{stat.category}</span>
                      <span className={`${
                        stat.percentage >= 75 ? 'text-emerald-600' :
                        stat.percentage >= 50 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>{stat.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 transition-all duration-500 ${
                          stat.category === 'Clima Social' ? 'bg-indigo-500' :
                          stat.category === 'Autoestima' ? 'bg-fuchsia-500' :
                          stat.category === 'Seguridad' ? 'bg-sky-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* DETAIL COL: Questions distribution charts */}
          <div className="lg:col-span-2 space-y-6">

            {/* INFORME DE RETROALIMENTACIÓN GRUPAL */}
            {groupFeedback && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-indigo-650 w-4 h-4" />
                    <span>Informe de Retroalimentación del Curso</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    Auto-Generado
                  </span>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Fortaleza Principal</span>
                    <h4 className="font-bold text-xs text-slate-705">{groupFeedback.strongCategory} ({groupFeedback.strongPercentage}%)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Esta dimensión destaca positivamente en el curso, indicando un factor protector clave para la convivencia.
                    </p>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Dimensión Crítica</span>
                    <h4 className="font-bold text-xs text-slate-705">{groupFeedback.criticalCategory} ({groupFeedback.criticalPercentage}%)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Es el puntaje más bajo del curso. Requiere atención prioritaria y diseño de estrategias reparadoras.
                    </p>
                  </div>
                </div>
 
                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <strong className="text-slate-800 flex items-center gap-1.5 font-bold">
                      <BookmarkCheck className="text-indigo-500" size={14} />
                      Diagnóstico del Clima de Aula:
                    </strong>
                    <p className="text-slate-600 leading-relaxed pl-5">{groupFeedback.diagnosis}</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-slate-800 flex items-center gap-1.5 font-bold">
                      <TrendingUp className="text-emerald-500" size={14} />
                      Plan de Acción Recomendado:
                    </strong>
                    <p className="text-slate-600 leading-relaxed pl-5">{groupFeedback.actionPlan}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chart per question */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Distribución de Respuestas por Pregunta</h3>
                <p className="text-xs text-slate-500 mt-0.5">Frecuencia obtenida en escala Likert</p>
              </div>

              <div className="space-y-6 divide-y divide-slate-100">
                {selectedSurvey.questions.map((q, idx) => {
                  // Calculate distribution
                  let stronglyDisagree = 0; // 1
                  let disagree = 0; // 2
                  let neutral = 0; // 3
                  let agree = 0; // 4
                  let stronglyAgree = 0; // 5

                  responses.forEach(r => {
                    const ans = r.answers[q.id];
                    if (ans === 1) stronglyDisagree++;
                    else if (ans === 2) disagree++;
                    else if (ans === 3) neutral++;
                    else if (ans === 4) agree++;
                    else if (ans === 5) stronglyAgree++;
                  });

                  const totalQ = responses.length;
                  const pct1 = totalQ > 0 ? Math.round((stronglyDisagree / totalQ) * 100) : 0;
                  const pct2 = totalQ > 0 ? Math.round((disagree / totalQ) * 100) : 0;
                  const pct3 = totalQ > 0 ? Math.round((neutral / totalQ) * 100) : 0;
                  const pct4 = totalQ > 0 ? Math.round((agree / totalQ) * 100) : 0;
                  const pct5 = totalQ > 0 ? Math.round((stronglyAgree / totalQ) * 100) : 0;

                  return (
                    <div key={q.id} className={`pt-5 first:pt-0 space-y-3`}>
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-650 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-normal">{q.text}</p>
                          <span className="inline-block mt-1 text-[8px] font-extrabold uppercase bg-slate-100 border text-slate-400 px-1.5 py-0.2 rounded-md">
                            Dimensión: {q.category}
                          </span>
                        </div>
                      </div>

                      {/* Bar chart CSS */}
                      <div className="grid grid-cols-5 gap-2 pt-1 font-mono text-[9px] text-slate-500 font-bold text-center">
                        <div className="space-y-1">
                          <div className="bg-slate-100 rounded-lg h-12 flex flex-col justify-end">
                            <div className="bg-rose-500 rounded-lg transition-all duration-500" style={{ height: `${pct1}%` }}></div>
                          </div>
                          <span>Muy en desc. ({pct1}%)</span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-100 rounded-lg h-12 flex flex-col justify-end">
                            <div className="bg-orange-400 rounded-lg transition-all duration-500" style={{ height: `${pct2}%` }}></div>
                          </div>
                          <span>En desac. ({pct2}%)</span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-100 rounded-lg h-12 flex flex-col justify-end">
                            <div className="bg-amber-400 rounded-lg transition-all duration-500" style={{ height: `${pct3}%` }}></div>
                          </div>
                          <span>Neutral ({pct3}%)</span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-100 rounded-lg h-12 flex flex-col justify-end">
                            <div className="bg-emerald-400 rounded-lg transition-all duration-500" style={{ height: `${pct4}%` }}></div>
                          </div>
                          <span>De acuerdo ({pct4}%)</span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-100 rounded-lg h-12 flex flex-col justify-end">
                            <div className="bg-emerald-600 rounded-lg transition-all duration-500" style={{ height: `${pct5}%` }}></div>
                          </div>
                          <span>Muy de ac. ({pct5}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CRITICAL ALERTS: Direct action for high risk profiles */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>Alertas Críticas de Bienestar Escolar</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Estudiantes con respuestas de riesgo alto o crítico</p>
                </div>
                <span className="font-mono bg-rose-50 border border-rose-200 text-rose-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {criticalAlerts.length} Alertas
                </span>
              </div>

              {criticalAlerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl font-semibold">
                  ¡No se detectan alumnos en riesgo crítico para esta encuesta en el curso seleccionado!
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {criticalAlerts.map(alert => {
                    const isReferred = referredStudentIds.includes(alert.studentId);
                    return (
                      <div 
                        key={alert.studentId}
                        className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs transition-all"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{alert.studentName}</p>
                          <p className="text-[10px] text-slate-500">RUT: {alert.studentId} | Curso: {selectedCourse}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block text-[9px] font-extrabold px-2 py-0.2 border rounded-full ${
                              alert.riskStatus === 'Crítico' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                              RIESGO {alert.riskStatus.toUpperCase()}
                            </span>
                            <span className="font-mono text-slate-500 text-[10px] font-bold">Promedio: {alert.score}/5.0</span>
                          </div>
                        </div>

                        <div>
                          {isReferred ? (
                            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <UserCheck size={12} />
                              <span>Derivado</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeriveToPsychosocial(alert)}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer group"
                            >
                              <span>Derivar a Dupla</span>
                              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* LIST OF RESPONDENTS */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={16} className="text-indigo-600" />
                  <span>Historial de Respuestas del Curso</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Estudiantes evaluados y estado del cuestionario</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold">
                      <th className="py-2.5">Estudiante</th>
                      <th className="py-2.5">Fecha</th>
                      <th className="py-2.5 text-center">Puntaje</th>
                      <th className="py-2.5 text-right">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {responses.map(res => (
                      <tr 
                        key={res.studentId} 
                        onClick={() => setActiveIndividualResponse(res)}
                        className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
                        title="Haga clic para ver Ficha de Retroalimentación del Estudiante"
                      >
                        <td className="py-2.5 font-bold text-slate-800">{res.studentName}</td>
                        <td className="py-2.5 text-slate-500">{res.submittedAt}</td>
                        <td className="py-2.5 text-center font-bold font-mono">{res.score} / 5.0</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.2 rounded-full border text-[9px] font-extrabold ${
                            res.riskStatus === 'Crítico' ? 'bg-red-50 text-red-700 border-red-200' :
                            res.riskStatus === 'Alto' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            res.riskStatus === 'Medio' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {res.riskStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* INDIVIDUAL RESPONSE AND FEEDBACK MODAL */}
      {activeIndividualResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    Ficha de Retroalimentación Individual DIA
                  </span>
                  <h3 className="text-base font-black text-slate-800">{activeIndividualResponse.studentName}</h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveIndividualResponse(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Overall stats and recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Puntaje DIA</span>
                  <span className="text-2xl font-black text-slate-850 mt-1">{activeIndividualResponse.score} / 5.0</span>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.2 border rounded-full mt-1.5 ${
                    activeIndividualResponse.riskStatus === 'Crítico' ? 'bg-red-50 text-red-700 border-red-200' :
                    activeIndividualResponse.riskStatus === 'Alto' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    activeIndividualResponse.riskStatus === 'Medio' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    RIESGO {activeIndividualResponse.riskStatus.toUpperCase()}
                  </span>
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl border space-y-1.5 flex flex-col justify-center bg-slate-50/50 border-slate-200">
                  {(() => {
                    const recData = getIndividualRecommendation(activeIndividualResponse.score);
                    return (
                      <>
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full self-start ${recData.style}`}>
                          {recData.title}
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                          {recData.rec}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Dimensional Scores */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Satisfacción por Dimensión</h4>
                <div className="grid grid-cols-2 gap-3.5">
                  {getIndividualStats(activeIndividualResponse).map(dim => (
                    <div key={dim.category} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-650">{dim.category}</span>
                        <span className="text-slate-800">{dim.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${dim.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question list answers detail */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Respuestas Detalladas</h4>
                <div className="space-y-2">
                  {selectedSurvey.questions.map((q, idx) => {
                    const score = activeIndividualResponse.answers[q.id] || 0;
                    const emojiMap: { [key: number]: string } = { 1: '😡', 2: '🙁', 3: '😐', 4: '🙂', 5: '😀' };
                    const textMap: { [key: number]: string } = { 
                      1: 'Muy en desacuerdo', 
                      2: 'En desacuerdo', 
                      3: 'Neutral', 
                      4: 'De acuerdo', 
                      5: 'Muy de acuerdo' 
                    };

                    return (
                      <div 
                        key={q.id} 
                        className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-4 text-xs hover:shadow-xs transition-shadow"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold">Pregunta {idx + 1} • {q.category}</span>
                          <p className="text-slate-800 font-medium">{q.text}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-center justify-center font-bold bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1.5 min-w-[75px]">
                          <span className="text-base leading-none">{emojiMap[score] || '❓'}</span>
                          <span className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider whitespace-nowrap text-center">
                            {textMap[score] || 'Sin resp.'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              {activeIndividualResponse.riskStatus === 'Crítico' || activeIndividualResponse.riskStatus === 'Alto' ? (
                <button
                  onClick={() => {
                    handleDeriveToPsychosocial(activeIndividualResponse);
                    setActiveIndividualResponse(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Derivar Caso a Dupla Psicosocial
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setActiveIndividualResponse(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 bg-white rounded-xl text-slate-650 hover:bg-slate-100 transition-colors"
              >
                Cerrar Reporte
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Internal info helper
function InfoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={{ width: '16px', height: '16px' }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
