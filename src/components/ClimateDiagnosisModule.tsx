import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Users, 
  AlertCircle, 
  ArrowRight,
  Brain,
  Zap,
  Building,
  UserCheck,
  Link
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, SchoolType, PsychosocialCase } from '../types';
import toast from 'react-hot-toast';

interface ClimateDiagnosisModuleProps {
  activeSchool: SchoolType;
  students: Student[];
}

interface DIAQuestion {
  id: string;
  text: string;
  category: 'Clima Social' | 'Autoestima' | 'Seguridad' | 'Apoyo Docente';
}

interface DIASurvey {
  id: string;
  title: string;
  description: string;
  target: string;
  questions: DIAQuestion[];
}

interface DIAResponse {
  studentId: string;
  studentName: string;
  answers: { [questionId: string]: number }; // Likert scale 1 to 5
  score: number; // average
  riskStatus: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  submittedAt: string;
}

const SURVEY_TEMPLATES: DIASurvey[] = [
  {
    id: 'dia-clima-aula',
    title: 'Diagnóstico DIA: Clima de Aula e Inclusión',
    description: 'Evalúa la percepción de los estudiantes sobre la convivencia, el trato respetuoso, la equidad de género y el nivel de integración socioemocional dentro del salón de clases.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'Los estudiantes de mi curso se tratan con respeto durante los recreos y en la sala de clases.', category: 'Clima Social' },
      { id: 'q2', text: 'Siento que mis profesores me escuchan y me apoyan cuando tengo una dificultad de aprendizaje o personal.', category: 'Apoyo Docente' },
      { id: 'q3', text: 'Mi sala de clases es un lugar seguro donde me siento protegido y libre de bullying.', category: 'Seguridad' },
      { id: 'q4', text: 'Siento que todos los estudiantes del curso son integrados por igual, sin discriminación de ningún tipo.', category: 'Clima Social' }
    ]
  },
  {
    id: 'dia-bienestar-autoestima',
    title: 'Diagnóstico DIA: Bienestar Socioemocional y Autoestima',
    description: 'Mide la valoración personal de los alumnos, la capacidad de identificar y expresar sus emociones, y la presencia de redes de apoyo al interior de la comunidad escolar.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'Me siento feliz, cómodo y valorado con quién soy al interior de mi establecimiento escolar.', category: 'Autoestima' },
      { id: 'q2', text: 'Cuando me siento triste, asustado o abrumado, sé a qué profesional del colegio recurrir para pedir ayuda.', category: 'Autoestima' },
      { id: 'q3', text: 'Puedo expresar mis emociones, ideas y opiniones de manera libre y segura dentro de mi colegio.', category: 'Seguridad' },
      { id: 'q4', text: 'Los psicólogos y profesores del colegio se preocupan de manera activa por mi salud mental y emocional.', category: 'Apoyo Docente' }
    ]
  },
  {
    id: 'dia-relaciones-bullying',
    title: 'Diagnóstico DIA: Relaciones Interpersonales y Violencia Escolar',
    description: 'Evalúa la frecuencia de conductas disruptivas o burlas, el conocimiento de los canales de denuncia RICE y la velocidad de respuesta del equipo ante casos de violencia escolar.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'En mi curso, las diferencias de opinión se resuelven mediante el diálogo y no con agresiones verbales o físicas.', category: 'Clima Social' },
      { id: 'q2', text: 'Conozco claramente los canales y profesionales con quienes denunciar un hecho de acoso o ciberacoso.', category: 'Seguridad' },
      { id: 'q3', text: 'Siento que el Reglamento de Convivencia Escolar se aplica de manera justa y equitativa para todos los alumnos.', category: 'Clima Social' },
      { id: 'q4', text: 'El equipo de convivencia escolar actúa con rapidez y efectividad cuando ocurre un conflicto en mi curso.', category: 'Apoyo Docente' }
    ]
  }
];

export const ClimateDiagnosisModule: React.FC<ClimateDiagnosisModuleProps> = ({
  activeSchool,
  students
}) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState(SURVEY_TEMPLATES[0].id);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [responses, setResponses] = useState<DIAResponse[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [referredStudentIds, setReferredStudentIds] = useState<string[]>([]);

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
        // Fallback to local simulated cache
        const key = `conexia_dia_resp_${activeSchool}_${selectedSurveyId}_${selectedCourse}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setResponses(JSON.parse(saved));
        } else {
          setResponses([]);
        }
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

  const handleSimulateResponses = () => {
    if (!selectedCourse) {
      toast.error('Por favor seleccione un curso primero.');
      return;
    }
    setIsSimulating(true);

    const courseStudents = students.filter(s => s.school === activeSchool && s.grade === selectedCourse);
    if (courseStudents.length === 0) {
      toast.error('No se encontraron estudiantes matriculados en este curso.');
      setIsSimulating(false);
      return;
    }

    // Generate random answers with specific biases to make it look realistic (some high risk, most healthy)
    const simulated: DIAResponse[] = courseStudents.map((std, index) => {
      const answers: { [questionId: string]: number } = {};
      let total = 0;
      
      // Introduce 1-2 critical students on purpose to trigger alerts
      const isCriticalStudent = index === 2 || index === 5;

      selectedSurvey.questions.forEach(q => {
        let val = 4; // default healthy answer (Agreed)
        if (isCriticalStudent) {
          // Low scores (1 or 2: Disagree / Strongly Disagree)
          val = Math.random() > 0.4 ? 1 : 2;
        } else {
          // Random score between 3 and 5
          const rand = Math.random();
          val = rand > 0.85 ? 3 : rand > 0.4 ? 4 : 5;
        }
        answers[q.id] = val;
        total += val;
      });

      const score = Number((total / selectedSurvey.questions.length).toFixed(1));
      let riskStatus: DIAResponse['riskStatus'] = 'Bajo';
      if (score < 2.5) riskStatus = 'Crítico';
      else if (score < 3.2) riskStatus = 'Alto';
      else if (score < 4.0) riskStatus = 'Medio';

      return {
        studentId: std.id,
        studentName: `${std.firstName} ${std.lastName}`,
        answers,
        score,
        riskStatus,
        submittedAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString().split('T')[0] // last 3 days
      };
    });

    const key = `conexia_dia_resp_${activeSchool}_${selectedSurveyId}_${selectedCourse}`;
    localStorage.setItem(key, JSON.stringify(simulated));
    setResponses(simulated);
    setIsSimulating(false);
    toast.success(`Se simularon con éxito respuestas de ${simulated.length} estudiantes.`);
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
  responses.forEach(res => {
    Object.values(res.answers).forEach(val => {
      if (val >= 4) favorableAnswersCount++;
      totalRatingCount++;
    });
  });
  const overallClimateIndex = totalRatingCount > 0 ? Math.round((favorableAnswersCount / totalRatingCount) * 100) : 0;

  // Alertas críticas (students with risk Crítico or Alto)
  const criticalAlerts = responses.filter(r => r.riskStatus === 'Crítico' || r.riskStatus === 'Alto');

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
        <div className="pt-5 md:pt-4 flex flex-col gap-2">
          {selectedCourse ? (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs py-2 rounded-xl shadow-md transition-all cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
              >
                <Link size={14} />
                <span>Copiar Enlace de Encuesta</span>
              </button>
              <button
                onClick={handleSimulateResponses}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-2 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Zap size={14} className={isSimulating ? "animate-spin" : ""} />
                <span>Simular Datos de Prueba</span>
              </button>
            </>
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
          <h3 className="text-lg font-bold text-slate-700">Sin Datos para Mostrar</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Seleccione el curso escolar correspondiente y presione el botón **"Simular Respuestas del Curso"** para cargar de manera instantánea el análisis del clima socioemocional.
          </p>
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
                      <tr key={res.studentId} className="hover:bg-slate-50/50">
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
