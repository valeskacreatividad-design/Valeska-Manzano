import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Save,
  Layers,
} from 'lucide-react';
import { Question, QuestionType, Survey } from '../types.ts';

interface SurveyCreatorProps {
  onSurveyCreated: (survey: Survey) => void;
  onCancel: () => void;
}

interface TemplatePreset {
  name: string;
  description: string;
  surveyTitle: string;
  surveyDesc: string;
  questions: Array<{
    text: string;
    type: QuestionType;
    required: boolean;
    options?: string[];
  }>;
}

const TEMPLATES: TemplatePreset[] = [
  {
    name: 'Satisfacción de Cliente',
    description: 'Mide la calidad de tu producto o atención al cliente.',
    surveyTitle: 'Encuesta de Satisfacción del Cliente',
    surveyDesc: 'Tu opinión es muy importante para nosotros. Por favor ayúdanos respondiendo estas breves preguntas.',
    questions: [
      {
        text: '¿Cómo calificarías tu experiencia general con nosotros?',
        type: 'rating',
        required: true,
      },
      {
        text: '¿Qué aspecto consideras más destacado de nuestra atención?',
        type: 'radio',
        required: true,
        options: ['Rapidez y eficiencia', 'Calidad del servicio', 'Amabilidad del equipo', 'Relación calidad-precio'],
      },
      {
        text: '¿Volverías a utilizar nuestros servicios en el futuro?',
        type: 'yesno',
        required: true,
      },
      {
        text: '¿Qué sugerencia nos darías para seguir mejorando?',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    name: 'Evaluación de Evento o Taller',
    description: 'Recopila feedback de participantes tras una charla o curso.',
    surveyTitle: 'Evaluación del Evento y Aprendizaje',
    surveyDesc: 'Gracias por asistir. Queremos conocer tus impresiones sobre el contenido, la organización y los expositores.',
    questions: [
      {
        text: '¿Qué tan útil y aplicable te pareció el contenido presentado?',
        type: 'rating',
        required: true,
      },
      {
        text: '¿Cuál fue la sesión o tema que más te aportó valor?',
        type: 'text',
        required: true,
      },
      {
        text: '¿Qué formato de futuros eventos prefieres?',
        type: 'radio',
        required: true,
        options: ['100% Presencial', 'Virtual en vivo', 'Híbrido', 'Grabaciones a demanda'],
      },
      {
        text: '¿Recomendarías esta actividad a colegas?',
        type: 'yesno',
        required: true,
      },
    ],
  },
  {
    name: 'Clima Laboral y Equipo',
    description: 'Conoce el bienestar y la opinión del equipo de trabajo.',
    surveyTitle: 'Sondeo de Clima Laboral y Bienestar',
    surveyDesc: 'Esta encuesta es confidencial. Tu sinceridad nos ayuda a crear un mejor ambiente de trabajo para todos.',
    questions: [
      {
        text: '¿Cómo calificarías tu nivel de satisfacción en tu rol actual?',
        type: 'rating',
        required: true,
      },
      {
        text: '¿Sientes que cuentas con las herramientas y apoyo necesarios para tu día a día?',
        type: 'yesno',
        required: true,
      },
      {
        text: '¿Qué áreas consideras prioritarias de mejora interna?',
        type: 'checkbox',
        required: false,
        options: ['Comunicación interna', 'Reconocimiento y feedback', 'Flexibilidad horaria', 'Capacitación continua'],
      },
      {
        text: 'Comentarios o propuestas adicionales para el equipo directivo:',
        type: 'textarea',
        required: false,
      },
    ],
  },
];

export const SurveyCreator: React.FC<SurveyCreatorProps> = ({ onSurveyCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q_init_1',
      text: '¿Cómo calificarías nuestro servicio?',
      type: 'rating',
      required: true,
      minRating: 1,
      maxRating: 5,
    },
    {
      id: 'q_init_2',
      text: '¿Qué fue lo que más te gustó?',
      type: 'radio',
      required: true,
      options: ['La rapidez', 'La atención al cliente', 'La calidad', 'El precio'],
    },
    {
      id: 'q_init_3',
      text: 'Comentarios adicionales:',
      type: 'textarea',
      required: false,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const applyTemplate = (t: TemplatePreset) => {
    setTitle(t.surveyTitle);
    setDescription(t.surveyDesc);
    setQuestions(
      t.questions.map((q, idx) => ({
        id: `q_${Date.now()}_${idx}`,
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options ? [...q.options] : [],
        minRating: 1,
        maxRating: 5,
      }))
    );
  };

  const addQuestion = (type: QuestionType = 'radio') => {
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: '',
      type,
      required: true,
      options: type === 'radio' || type === 'checkbox' ? ['Opción 1', 'Opción 2', 'Opción 3'] : [],
      minRating: 1,
      maxRating: 5,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const duplicateQuestion = (index: number) => {
    const original = questions[index];
    const duplicated: Question = {
      ...original,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: `${original.text} (Copia)`,
      options: original.options ? [...original.options] : undefined,
    };
    const copy = [...questions];
    copy.splice(index + 1, 0, duplicated);
    setQuestions(copy);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('La encuesta debe tener al menos una pregunta.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setQuestions(copy);
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const opts = q.options ? [...q.options] : [];
    opts.push(`Opción ${opts.length + 1}`);
    updateQuestion(qIndex, { options: opts });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const opts = q.options ? [...q.options] : [];
    opts[optIndex] = val;
    updateQuestion(qIndex, { options: opts });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if ((q.options || []).length <= 2) {
      alert('Las preguntas de opciones deben tener al menos dos opciones.');
      return;
    }
    const opts = (q.options || []).filter((_, i) => i !== optIndex);
    updateQuestion(qIndex, { options: opts });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Por favor ingresa un título para la encuesta.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Verify all questions have text
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Por favor escribe el enunciado para la pregunta #${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar la encuesta.');
      }

      const created: Survey = await res.json();
      onSurveyCreated(created);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Diseñador de Encuestas en la Nube
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configura tus preguntas. Al guardar, recibirás un enlace único para enviar a tus encuestados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              previewMode
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Modo Editor' : 'Vista Previa'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando enlace...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Generar Enlace Público</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Template Quick Selection */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Opciones Rápidas: Carga una plantilla con 1 clic
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(tmpl)}
              className="p-3.5 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200 text-left transition-all hover:border-indigo-300 group shadow-2xs"
            >
              <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600">
                {tmpl.name}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {tmpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Survey Metadata Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Título de la Encuesta <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Encuesta de Evaluación de Calidad 2026"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Instrucciones o Descripción para los encuestados
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Te tomará menos de 2 minutos. Tus comentarios son muy valiosos para nuestro equipo."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Question Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Preguntas de la Encuesta ({questions.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addQuestion('radio')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Opción Única
            </button>
            <button
              type="button"
              onClick={() => addQuestion('checkbox')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Multiselección
            </button>
            <button
              type="button"
              onClick={() => addQuestion('rating')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Calificación
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 transition-all hover:border-slate-300"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pregunta #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, 'up')}
                    disabled={idx === 0}
                    title="Mover arriba"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-50"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(idx, 'down')}
                    disabled={idx === questions.length - 1}
                    title="Mover abajo"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-50"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuestion(idx)}
                    title="Duplicar pregunta"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    title="Eliminar pregunta"
                    className="p-1.5 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enunciado de la pregunta
                  </label>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                    placeholder="Escribe la pregunta..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Respuesta
                  </label>
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      const patch: Partial<Question> = { type: newType };
                      if ((newType === 'radio' || newType === 'checkbox') && (!q.options || q.options.length === 0)) {
                        patch.options = ['Opción 1', 'Opción 2', 'Opción 3'];
                      }
                      updateQuestion(idx, patch);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="radio">Opción Única (Radio)</option>
                    <option value="checkbox">Múltiple Selección (Casillas)</option>
                    <option value="rating">Calificación de Estrellas (1-5)</option>
                    <option value="yesno">Sí / No</option>
                    <option value="text">Texto Corto</option>
                    <option value="textarea">Párrafo Largo</option>
                  </select>
                </div>
              </div>

              {/* Options Editor for Radio & Checkbox */}
              {(q.type === 'radio' || q.type === 'checkbox') && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2.5 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Opciones configurables:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddOption(idx)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Opción
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono w-4">
                          {optIdx + 1}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                          placeholder={`Opción ${optIdx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx, optIdx)}
                          title="Eliminar opción"
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Footer: Required toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Respuesta obligatoria
                  </span>
                </label>

                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {q.id}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button Banner */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => addQuestion('radio')}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Añadir otra pregunta
          </button>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {questions.length} preguntas listas para compartir
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Crear y Obtener Enlace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
