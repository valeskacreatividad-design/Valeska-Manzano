import React, { useState, useEffect } from 'react';
import { CheckCircle2, Star, Send, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { Survey, Question } from '../types.ts';

interface SurveyTakerProps {
  surveyId: string;
  onGoHome: () => void;
  onViewAdminResults?: (surveyId: string) => void;
}

export const SurveyTaker: React.FC<SurveyTakerProps> = ({
  surveyId,
  onGoHome,
  onViewAdminResults,
}) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (!res.ok) {
        throw new Error('No se pudo encontrar la encuesta especificada.');
      }
      const data: Survey = await res.json();
      setSurvey(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar la encuesta.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setMissingRequired((prev) => prev.filter((id) => id !== questionId));
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setMissingRequired((prev) => prev.filter((id) => id !== questionId));
  };

  const handleCheckboxChange = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    setAnswers((prev) => ({ ...prev, [questionId]: updated }));
    if (updated.length > 0) {
      setMissingRequired((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
    setMissingRequired((prev) => prev.filter((id) => id !== questionId));
  };

  // Progress calculation
  const totalQuestions = survey ? survey.questions.length : 0;
  const answeredCount = survey
    ? survey.questions.filter((q) => {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      }).length
    : 0;

  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validate required fields
    const missing: string[] = [];
    survey.questions.forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          missing.push(q.id);
        }
      }
    });

    if (missing.length > 0) {
      setMissingRequired(missing);
      // Scroll to first missing question
      const firstMissingEl = document.getElementById(`q-card-${missing[0]}`);
      if (firstMissingEl) {
        firstMissingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          respondentName: respondentName.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Ocurrió un error al enviar las respuestas.');
      }

      setSubmissionId(result.responseId);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de red al enviar tus respuestas.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Cargando encuesta...</p>
      </div>
    );
  }

  if (errorMessage && !survey) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Encuesta no disponible</h2>
        <p className="text-sm text-slate-500">{errorMessage}</p>
        <button
          onClick={onGoHome}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Ir a la página principal
        </button>
      </div>
    );
  }

  if (!survey) return null;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto my-10 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">¡Muchas Gracias!</h1>
          <p className="text-sm text-slate-600">
            Tus respuestas para <span className="font-semibold text-slate-900">"{survey.title}"</span>{' '}
            han sido enviadas y registradas correctamente.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-1.5 text-xs text-slate-500 font-mono">
          <div className="flex justify-between">
            <span>Comprobante de envío:</span>
            <span className="font-semibold text-slate-700">{submissionId}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha y hora:</span>
            <span className="text-slate-700">{new Date().toLocaleString('es-ES')}</span>
          </div>
          <div className="flex justify-between">
            <span>Total de respuestas:</span>
            <span className="text-slate-700">{totalQuestions} preguntas respondidas</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              setRespondentName('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Enviar otra respuesta
          </button>

          {onViewAdminResults && (
            <button
              onClick={() => onViewAdminResults(survey.id)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              Ver Panel de Resultados y Excel
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a EncuestaFlow
        </button>

        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          Formulario seguro y verificado
        </div>
      </div>

      {/* Survey Title Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {survey.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Progreso de la encuesta</span>
            <span className="font-semibold text-indigo-600 font-mono tabular-nums">
              {answeredCount} de {totalQuestions} respondidas ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Survey Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Optional Respondent Name */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
          <label className="block text-sm font-semibold text-slate-800">
            Tu Nombre o Identificador <span className="text-xs font-normal text-slate-400">(Opcional)</span>
          </label>
          <input
            type="text"
            value={respondentName}
            onChange={(e) => setRespondentName(e.target.value)}
            placeholder="Ej. Juan Pérez o Déjalo vacío si prefieres ser anónimo"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Questions list */}
        {survey.questions.map((q, idx) => {
          const isMissing = missingRequired.includes(q.id);

          return (
            <div
              key={q.id}
              id={`q-card-${q.id}`}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                isMissing
                  ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
                  : 'border-slate-200 shadow-xs'
              } space-y-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600 font-mono">
                      #{idx + 1}
                    </span>
                    {q.required && (
                      <span className="text-xs font-medium text-rose-500">
                        * Obligatoria
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {q.text}
                  </h3>
                </div>
              </div>

              {/* Render Question Field by Type */}
              {renderQuestionField(
                q,
                answers[q.id],
                hoverRating[q.id] || 0,
                (val) => handleTextChange(q.id, val),
                (val) => handleRadioChange(q.id, val),
                (opt) => handleCheckboxChange(q.id, opt),
                (rating) => handleRatingChange(q.id, rating),
                (star) => setHoverRating((prev) => ({ ...prev, [q.id]: star })),
                () => setHoverRating((prev) => ({ ...prev, [q.id]: 0 }))
              )}

              {isMissing && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Esta pregunta requiere una respuesta antes de enviar.
                </p>
              )}
            </div>
          );
        })}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando respuestas a la nube...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Respuestas al Administrador</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Al enviar, tus respuestas quedarán guardadas y agrupadas en el panel de control del creador.
          </p>
        </div>
      </form>
    </div>
  );
};

function renderQuestionField(
  q: Question,
  currentValue: any,
  currentHover: number,
  onTextChange: (val: string) => void,
  onRadioChange: (val: string) => void,
  onCheckboxChange: (opt: string) => void,
  onRatingChange: (rating: number) => void,
  onRatingHover: (star: number) => void,
  onRatingLeave: () => void
) {
  switch (q.type) {
    case 'radio':
      return (
        <div className="space-y-2 pt-1">
          {(q.options || []).map((opt, i) => {
            const isSelected = currentValue === opt;
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={isSelected}
                  onChange={() => onRadioChange(opt)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      );

    case 'checkbox':
      const selectedList = Array.isArray(currentValue) ? currentValue : [];
      return (
        <div className="space-y-2 pt-1">
          {(q.options || []).map((opt, i) => {
            const isChecked = selectedList.includes(opt);
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                  isChecked
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onCheckboxChange(opt)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      );

    case 'rating':
      const ratingVal = Number(currentValue) || 0;
      return (
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2" onMouseLeave={onRatingLeave}>
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (currentHover || ratingVal);
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => onRatingChange(star)}
                  onMouseEnter={() => onRatingHover(star)}
                  className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                  aria-label={`${star} estrellas`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      active
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-semibold text-slate-500 ml-2 font-mono tabular-nums">
              {ratingVal > 0 ? `${ratingVal} de 5` : 'Selecciona una puntuación'}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 max-w-xs px-1">
            <span>1 = Muy Insatisfecho</span>
            <span>5 = Excelente</span>
          </div>
        </div>
      );

    case 'yesno':
      return (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {['Sí', 'No'].map((choice) => {
            const isSelected = currentValue === choice;
            return (
              <button
                type="button"
                key={choice}
                onClick={() => onRadioChange(choice)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  isSelected
                    ? choice === 'Sí'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      );

    case 'textarea':
      return (
        <div className="pt-1">
          <textarea
            rows={3}
            value={currentValue || ''}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={q.placeholder || 'Escribe tu respuesta aquí con detalle...'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
          />
        </div>
      );

    case 'text':
    default:
      return (
        <div className="pt-1">
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={q.placeholder || 'Escribe tu respuesta...'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      );
  }
}
