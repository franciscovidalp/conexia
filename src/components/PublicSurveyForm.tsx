import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Send, 
  CheckCircle2, 
  ShieldAlert,
  User,
  Info
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, SurveyAnswer } from '../types';
import toast from 'react-hot-toast';

interface PublicSurveyFormProps {
  surveyId: string;
  schoolName: string;
  gradeName: string;
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
      { id: 'q2', text: 'Conozco claramente los canales y profesionales con quienes deunciar un hecho de acoso o ciberacoso.', category: 'Seguridad' },
      { id: 'q3', text: 'Siento que el Reglamento de Convivencia Escolar se aplica de manera justa y equitativa para todos los alumnos.', category: 'Clima Social' },
      { id: 'q4', text: 'El equipo de convivencia escolar actúa con rapidez y efectividad cuando ocurre un conflicto en mi curso.', category: 'Apoyo Docente' }
    ]
  }
];

// Emoji mapping for Likert 1-5 scale
const EMOJIS = [
  { value: 1, char: '😡', label: 'Muy en desacuerdo' },
  { value: 2, char: '🙁', label: 'En desacuerdo' },
  { value: 3, char: '😐', label: 'Neutral' },
  { value: 4, char: '🙂', label: 'De acuerdo' },
  { value: 5, char: '😀', label: 'Muy de acuerdo' }
];

export const PublicSurveyForm: React.FC<PublicSurveyFormProps> = ({
  surveyId,
  schoolName,
  gradeName
}) => {
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const survey = SURVEY_TEMPLATES.find(t => t.id === surveyId) || SURVEY_TEMPLATES[0];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await dbService.getStudents(schoolName);
        const filtered = res.filter(s => s.grade === gradeName);
        setStudentsList(filtered);
      } catch (err) {
        toast.error('Error al cargar lista de estudiantes.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [schoolName, gradeName]);

  const handleSelectAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error('Por favor, selecciona tu nombre de la lista.');
      return;
    }

    // Verify all questions are answered
    const unanswered = survey.questions.some(q => !answers[q.id]);
    if (unanswered) {
      toast.error('Por favor, responde todas las preguntas del cuestionario.');
      return;
    }

    setSubmitting(true);
    try {
      const student = studentsList.find(s => s.id === selectedStudentId);
      if (!student) throw new Error('Estudiante no encontrado.');

      // Calculate score average
      let sum = 0;
      Object.values(answers).forEach(val => { sum += val; });
      const score = Number((sum / survey.questions.length).toFixed(1));

      // Calculate risk status
      let riskStatus: SurveyAnswer['riskStatus'] = 'Bajo';
      if (score < 2.5) riskStatus = 'Crítico';
      else if (score < 3.2) riskStatus = 'Alto';
      else if (score < 4.0) riskStatus = 'Medio';

      const payload: Omit<SurveyAnswer, 'id'> = {
        surveyId: survey.id,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        grade: gradeName,
        school: schoolName,
        responses: answers,
        score,
        riskStatus,
        submittedAt: new Date().toISOString().split('T')[0]
      };

      await dbService.createSurveyAnswer(payload);
      setSuccess(true);
      toast.success('¡Muchas gracias por tus respuestas!');
    } catch (err) {
      toast.error('Error al enviar respuestas. Inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Cargando cuestionario...</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[130px]"></div>
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
          <div className="inline-flex p-4 bg-emerald-950/60 text-emerald-400 rounded-full border border-emerald-900/60 shadow-lg">
            <CheckCircle2 size={48} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tight">¡Muchas Gracias!</h1>
            <p className="text-sm text-slate-400 mt-2">Tus respuestas se han guardado con éxito.</p>
          </div>
          <div className="bg-slate-850/50 border border-slate-800 rounded-2xl p-4.5 text-xs text-slate-350 leading-relaxed text-left">
            Tu opinión es muy importante para nosotros. Los datos recopilados serán procesados de manera profesional por el departamento de Convivencia Escolar y la Dupla Psicosocial de tu establecimiento para implementar mejoras en el clima escolar y el bienestar socioemocional.
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800">
            CONEXIA • Plataforma Escolar de Contención y Clima
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 relative overflow-y-auto font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 my-6">
        
        {/* Header Branding */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800 flex-wrap">
          <img src="/logo.png" alt="Conexia Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Establecimiento Educacional</span>
            <h2 className="font-extrabold text-white text-lg leading-snug">{schoolName}</h2>
          </div>
        </div>

        {/* Survey Info Card */}
        <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex gap-3 text-xs text-indigo-200">
          <ClipboardList className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-bold text-slate-200">{survey.title}</span>
            <p className="text-indigo-300/80 mt-1 leading-relaxed">{survey.description}</p>
          </div>
        </div>

        {/* Identification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-850/60 border border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-indigo-400" />
              <span>1. Identificación del Estudiante</span>
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Selecciona tu Nombre (Curso: {gradeName})
              </label>
              
              {studentsList.length === 0 ? (
                <div className="bg-amber-950/20 border border-amber-900/50 text-amber-300 p-3.5 rounded-xl text-xs flex gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>No se encontraron estudiantes matriculados en el curso <strong>{gradeName}</strong>. Por favor contacta al administrador escolar.</span>
                </div>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-xl border border-slate-700 p-3 text-sm focus:border-indigo-500 font-semibold"
                >
                  <option value="">-- Seleccionar mi nombre --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Likert Questionnaire */}
          {selectedStudentId && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 px-1">
                <ClipboardList size={14} className="text-indigo-400" />
                <span>2. Preguntas de Autoevaluación</span>
              </h3>

              <div className="space-y-5">
                {survey.questions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    className="bg-slate-850/40 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-900 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-400 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">{q.text}</p>
                    </div>

                    {/* Emoji Rating Bar */}
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {EMOJIS.map(emoji => {
                        const isSelected = answers[q.id] === emoji.value;
                        return (
                          <button
                            key={emoji.value}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, emoji.value)}
                            className={`flex flex-col items-center p-2.5 rounded-xl border transition-all text-center gap-1.5 cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-600/20 border-indigo-500 scale-[1.04] shadow shadow-indigo-500/10' 
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-2xl sm:text-3xl filter drop-shadow">{emoji.char}</span>
                            <span className={`text-[8px] sm:text-[9px] font-bold block ${
                              isSelected ? 'text-indigo-400 font-extrabold' : 'text-slate-500'
                            }`}>
                              {emoji.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold py-4 rounded-xl shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{submitting ? 'Enviando Respuestas...' : 'Enviar Respuestas'}</span>
                  {!submitting && <Send size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                </button>
              </div>
            </div>
          )}

        </form>

        {/* Confidentiality Footer */}
        <div className="flex gap-2 items-start text-[9px] text-slate-500 leading-normal border-t border-slate-800/40 pt-4">
          <Info size={12} className="text-indigo-500/60 shrink-0 mt-0.5" />
          <span>
            Declaración de Privacidad: Tu información está protegida en estricto cumplimiento de la Ley N° 19.628 sobre Protección de la Vida Privada. Las respuestas individuales son confidenciales y solo serán revisadas por los terapeutas autorizados del colegio.
          </span>
        </div>

      </div>
    </div>
  );
};
