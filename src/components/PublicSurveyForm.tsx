import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Send, 
  CheckCircle2, 
  ShieldAlert,
  User,
  Info,
  Heart
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, SurveyAnswer } from '../types';
import { SURVEY_TEMPLATES } from '../lib/surveyTemplates';
import toast from 'react-hot-toast';

interface PublicSurveyFormProps {
  surveyId: string;
  schoolName: string;
  gradeName: string;
}

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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-y-auto font-sans">
        <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"></div>
        
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6 my-6">
          <div className="inline-flex p-4 bg-emerald-950/60 text-emerald-400 rounded-full border border-emerald-900/60 shadow-lg">
            <CheckCircle2 size={48} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tight">¡Muchas Gracias!</h1>
            <p className="text-sm text-slate-400 mt-2">Tus respuestas se han guardado con éxito y de forma confidencial.</p>
          </div>
 
          {/* PRIMEROS AUXILIOS EMOCIONALES CARD */}
          <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-5 text-left space-y-4 shadow-inner">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={18} />
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Ficha de Bienestar y Contención</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tus respuestas ayudan al establecimiento a crear un ambiente más seguro y comprensivo. Recuerda cuidar de ti mismo:
            </p>
 
            <ul className="space-y-3 text-[11px] text-slate-350">
              <li className="flex gap-2">
                <span className="text-rose-400 shrink-0">🧘</span>
                <div>
                  <strong className="text-slate-200">Ejercita la calma:</strong> Si te sientes angustiado o frustrado, realiza respiraciones pausadas: inhala en 4 segundos, mantén en 4 y exhala en 4.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 shrink-0">🗣️</span>
                <div>
                  <strong className="text-slate-200">Conversa tus emociones:</strong> Expresar tus sentimientos no es debilidad. Busca a un compañero, profesor jefe o a tu familia para hablar.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 shrink-0">👥</span>
                <div>
                  <strong className="text-slate-200">Dupla de Apoyo Escolar:</strong> No cargues solo con los problemas. El Psicólogo y Trabajador Social del colegio están disponibles para conversar de forma confidencial en la oficina de apoyo.
                </div>
              </li>
            </ul>
          </div>
 
          <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-4 text-[11px] text-indigo-300 leading-relaxed text-left flex gap-3">
            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Toda la información recolectada se resguarda bajo estrictos protocolos y sirve para que el colegio implemente talleres y apoyos personalizados para tu curso.
            </p>
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
