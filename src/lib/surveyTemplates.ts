export interface DIAQuestion {
  id: string;
  text: string;
  category: 'Clima Social' | 'Autoestima' | 'Seguridad' | 'Apoyo Docente';
}

export interface DIASurvey {
  id: string;
  title: string;
  description: string;
  target: string;
  questions: DIAQuestion[];
}

export const SURVEY_TEMPLATES: DIASurvey[] = [
  {
    id: 'dia-clima-aula',
    title: 'Diagnóstico DIA: Clima de Aula e Inclusión',
    description: 'Evalúa la percepción de los estudiantes sobre la convivencia, el trato respetuoso, la equidad de género y el nivel de integración socioemocional dentro del salón de clases.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'Los estudiantes de mi curso se tratan con respeto durante los recreos y en la sala de clases.', category: 'Clima Social' },
      { id: 'q2', text: 'Siento que mis profesores me escuchan y me apoyan cuando tengo una dificultad de aprendizaje o personal.', category: 'Apoyo Docente' },
      { id: 'q3', text: 'Mi sala de clases es un lugar seguro donde me siento protegido y libre de bullying.', category: 'Seguridad' },
      { id: 'q4', text: 'Siento que todos los estudiantes del curso son integrados por igual, sin discriminación de ningún tipo.', category: 'Clima Social' },
      { id: 'q5', text: 'Cuando trabajamos en grupos, mis compañeros respetan las opiniones de todos por igual.', category: 'Clima Social' },
      { id: 'q6', text: 'Mis profesores promueven la participación equitativa de hombres y mujeres en todas las actividades.', category: 'Apoyo Docente' },
      { id: 'q7', text: 'En la sala de clases se conversan las normas y nos ponemos de acuerdo en cómo respetarnos.', category: 'Clima Social' },
      { id: 'q8', text: 'Siento que puedo ser yo mismo(a) en mi curso sin temor a ser criticado o apartado por mis compañeros.', category: 'Seguridad' },
      { id: 'q9', text: 'Cuando alguien se siente solo o excluido en el curso, siempre hay compañeros que intentan integrarlo.', category: 'Clima Social' },
      { id: 'q10', text: 'Mis profesores se dan cuenta cuando un estudiante está triste o excluido y tratan de ayudarlo.', category: 'Apoyo Docente' }
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
      { id: 'q4', text: 'Los psicólogos y profesores del colegio se preocupan de manera activa por mi salud mental y emocional.', category: 'Apoyo Docente' },
      { id: 'q5', text: 'Tengo herramientas y estrategias personales para calmarme cuando siento rabia o frustración.', category: 'Autoestima' },
      { id: 'q6', text: 'Siento que mi colegio realiza actividades y talleres que me ayudan a entender mejor mis emociones.', category: 'Apoyo Docente' },
      { id: 'q7', text: 'Tengo amigos o compañeros de confianza en el colegio a quienes puedo contarles mis cosas personales.', category: 'Autoestima' },
      { id: 'q8', text: 'Me siento motivado(a) por venir a clases y participar en las actividades cotidianas del colegio.', category: 'Autoestima' },
      { id: 'q9', text: 'Sé que si cometo un error, es parte del aprendizaje y mis profesores me guiarán en vez de solo castigarme.', category: 'Apoyo Docente' },
      { id: 'q10', text: 'Siento que mis opiniones y sugerencias sobre el colegio son tomadas en cuenta por el equipo directivo.', category: 'Autoestima' }
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
      { id: 'q4', text: 'El equipo de convivencia escolar actúa con rapidez y efectividad cuando ocurre un conflicto en mi curso.', category: 'Apoyo Docente' },
      { id: 'q5', text: 'He presenciado o sé de situaciones de burlas constantes (bullying) a través de redes sociales en mi curso.', category: 'Seguridad' },
      { id: 'q6', text: 'En los recreos, los inspectores y docentes cuidan activamente que no haya agresiones o juegos peligrosos.', category: 'Seguridad' },
      { id: 'q7', text: 'Siento que el colegio nos enseña formas no violentas de resolver los desacuerdos entre compañeros.', category: 'Clima Social' },
      { id: 'q8', text: 'Si denuncio un hecho de violencia en el colegio, confío en que se protegerá mi identidad y seguridad.', category: 'Seguridad' },
      { id: 'q9', text: 'En mi curso se evitan los rumores y las exclusiones intencionadas hacia ciertos estudiantes.', category: 'Clima Social' },
      { id: 'q10', text: 'Siento que hay respeto recíproco y buena convivencia general entre estudiantes y profesores.', category: 'Clima Social' }
    ]
  },
  {
    id: 'dia-vinculo-familia',
    title: 'Diagnóstico DIA: Vínculo Familiar y Alianza Escuela-Hogar',
    description: 'Mide la comunicación entre el hogar y el establecimiento, el interés de los apoderados en los procesos académicos de sus pupilos y el soporte familiar percibido por los alumnos.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'En mi casa, mi familia se interesa activamente por lo que aprendo y hago en el colegio.', category: 'Autoestima' },
      { id: 'q2', text: 'Siento que mi familia y mis profesores trabajan juntos para ayudarme a tener éxito.', category: 'Apoyo Docente' },
      { id: 'q3', text: 'Mi familia asiste con agrado a las reuniones y citaciones convocadas por mi establecimiento.', category: 'Clima Social' },
      { id: 'q4', text: 'Sé que en mi hogar cuento con el apoyo de mi familia para realizar mis tareas escolares.', category: 'Autoestima' },
      { id: 'q5', text: 'En mi hogar conversamos abiertamente sobre cómo resolver los problemas de manera tranquila.', category: 'Autoestima' },
      { id: 'q6', text: 'Mi colegio me da oportunidades para involucrar a mi familia en las actividades y talleres.', category: 'Clima Social' },
      { id: 'q7', text: 'Siento que el colegio informa oportunamente a mi apoderado sobre mis logros y no solo sobre mis faltas.', category: 'Apoyo Docente' },
      { id: 'q8', text: 'En mi familia existe confianza para hablar sobre mis emociones y problemas del colegio.', category: 'Autoestima' },
      { id: 'q9', text: 'Mi apoderado sabe claramente a quién contactar en el colegio cuando tiene una duda o reclamo.', category: 'Seguridad' },
      { id: 'q10', text: 'Siento que el colegio respeta y valora la opinión de mi apoderado y familia.', category: 'Clima Social' }
    ]
  },
  {
    id: 'dia-sociograma',
    title: 'Diagnóstico DIA: Sociograma y Relaciones del Curso',
    description: 'Establece el mapa de relaciones socioafectivas del aula, identificando líderes, alumnos integrados, aislados y dinámicas de aceptación o rechazo escolar.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: '¿Con qué compañeros de tu curso te gustaría trabajar en proyectos escolares o tareas de clase?', category: 'Clima Social' },
      { id: 'q2', text: '¿Con qué compañeros de tu curso preferirías NO trabajar en proyectos escolares o tareas de clase?', category: 'Clima Social' },
      { id: 'q3', text: '¿Con qué compañeros de tu curso te gusta compartir en los recreos, jugar o realizar actividades libres?', category: 'Clima Social' },
      { id: 'q4', text: '¿Con qué compañeros de tu curso preferirías NO compartir en los recreos o jugar?', category: 'Clima Social' },
      { id: 'q5', text: '¿A quién(es) consideras como líder(es) o referente(s) positivo(s) en el curso (a quien todos escuchan)?', category: 'Clima Social' },
      { id: 'q6', text: '¿Quién(es) crees que se siente(n) más solo(s) o aislado(s) en el curso en el día a día?', category: 'Clima Social' }
    ]
  },
  {
    id: 'convivencia-rice',
    title: 'Diagnóstico: Convivencia Escolar y Normativa RICE',
    description: 'Evalúa el nivel de conocimiento del reglamento interno escolar, la percepción de justicia en las medidas aplicadas y el nivel de participación activa del alumnado en el bienestar escolar.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'Siento que las normas del colegio se aplican a todos los estudiantes de la misma manera, sin favoritismos.', category: 'Clima Social' },
      { id: 'q2', text: 'Conozco las faltas y las medidas disciplinarias que están descritas en el Reglamento Interno (RICE).', category: 'Seguridad' },
      { id: 'q3', text: 'Sé a qué profesional acudir inmediatamente si veo que a un compañero le están haciendo bullying en internet o en el patio.', category: 'Seguridad' },
      { id: 'q4', text: 'Los directivos e inspectores me escuchan con respeto cuando quiero dar mi versión sobre algún conflicto.', category: 'Apoyo Docente' },
      { id: 'q5', text: 'Siento que las sanciones o amonestaciones aplicadas en mi colegio son justas y buscan que aprendamos del error.', category: 'Clima Social' },
      { id: 'q6', text: 'En las reuniones de curso o de estudiantes conversamos con frecuencia sobre cómo mantener un buen trato mutuo.', category: 'Clima Social' },
      { id: 'q7', text: 'El ambiente físico del colegio (salas, patios, baños) es limpio, ordenado y me hace sentir seguro(a).', category: 'Seguridad' },
      { id: 'q8', text: 'Mis profesores intervienen de inmediato cuando escuchan comentarios burlones o insultos entre estudiantes.', category: 'Apoyo Docente' },
      { id: 'q9', text: 'Siento que puedo dar mi opinión con total libertad para mejorar las reglas de mi curso.', category: 'Autoestima' },
      { id: 'q10', text: 'El colegio reconoce y felicita públicamente a los cursos y alumnos que tienen buena convivencia.', category: 'Autoestima' }
    ]
  },
  {
    id: 'resolucion-conflictos',
    title: 'Diagnóstico: Mediación y Resolución de Conflictos',
    description: 'Mide la preferencia por soluciones dialogadas, la efectividad del equipo de mediación escolar y la capacidad percibida por los estudiantes para resolver desacuerdos pacíficamente.',
    target: 'Estudiantes',
    questions: [
      { id: 'q1', text: 'Cuando tengo un problema o pelea con un compañero, prefiero conversar antes que gritar o agredir.', category: 'Autoestima' },
      { id: 'q2', text: 'Sé que en el colegio existe un equipo de estudiantes o profesores mediadores que ayudan a solucionar conflictos.', category: 'Seguridad' },
      { id: 'q3', text: 'Si pido ayuda a un mediador del colegio, confío en que nos ayudará a llegar a un acuerdo pacífico.', category: 'Apoyo Docente' },
      { id: 'q4', text: 'Siento que el colegio nos enseña técnicas útiles de respiración o diálogo para controlar la rabia.', category: 'Autoestima' },
      { id: 'q5', text: 'En mi curso, la mayoría de los estudiantes prefiere disculparse y reparar el daño cuando comete un error.', category: 'Clima Social' },
      { id: 'q6', text: 'Los docentes nos dan la oportunidad de calmarnos antes de mandarnos directamente a Inspectoría.', category: 'Apoyo Docente' },
      { id: 'q7', text: 'He aprendido en el colegio cómo expresar lo que siento sin insultar a la persona con la que discuto.', category: 'Autoestima' },
      { id: 'q8', text: 'El diálogo con mis compañeros en situaciones difíciles suele terminar en un acuerdo beneficioso para ambos.', category: 'Clima Social' },
      { id: 'q9', text: 'Siento que el colegio apoya activamente la mediación de conflictos en vez de solo aplicar castigos.', category: 'Clima Social' },
      { id: 'q10', text: 'Sé que disculparme o perdonar me ayuda a sentirme mejor y mejora la convivencia general del curso.', category: 'Autoestima' }
    ]
  }
];
