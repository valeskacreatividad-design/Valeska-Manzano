import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Share2,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Star,
  Users,
  PieChart,
  Table as TableIcon,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { Survey, SurveyResponse } from '../types.ts';
import { exportSurveyToExcel, exportSurveyToCSV } from '../utils/excelExport.ts';

interface ResultsViewProps {
  surveyId: string;
  onBack: () => void;
  onOpenShare: (survey: Survey) => void;
  onOpenTaker: (surveyId: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  surveyId,
  onBack,
  onOpenShare,
  onOpenTaker,
}) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grouped' | 'table'>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [surveyId]);

  const fetchResults = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`);
      if (!res.ok) throw new Error('Error al cargar respuestas');
      const data = await res.json();
      setSurvey(data.survey);
      setResponses(data.responses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleActive = async () => {
    if (!survey) return;
    const newActive = !survey.active;
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      if (res.ok) {
        setSurvey((prev) => (prev ? { ...prev, active: newActive } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta respuesta del registro?')) return;
    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses/${responseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setResponses((prev) => prev.filter((r) => r.id !== responseId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    if (!survey) return;
    exportSurveyToExcel(survey, responses);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleExportCSV = () => {
    if (!survey) return;
    exportSurveyToCSV(survey, responses);
  };

  // Filtered responses for table
  const filteredResponses = responses.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (r.respondentName && r.respondentName.toLowerCase().includes(q)) return true;
    if (r.id.toLowerCase().includes(q)) return true;
    return Object.values(r.answers).some((val) =>
      String(val).toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Cargando datos y respuestas en tiempo real...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Encuesta no encontrada</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  // Calculate average rating if any
  const ratingQuestion = survey.questions.find((q) => q.type === 'rating');
  let avgRating: string | null = null;
  if (ratingQuestion && responses.length > 0) {
    const ratings = responses
      .map((r) => Number(r.answers[ratingQuestion.id]))
      .filter((v) => !isNaN(v) && v > 0);
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr, 0);
      avgRating = (sum / ratings.length).toFixed(1);
    }
  }

  const latestResponseTime =
    responses.length > 0
      ? new Date(responses[0].submittedAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
        })
      : 'Sin respuestas';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Back and Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Mis Encuestas
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Sincronizar con el servidor para nuevas respuestas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar Respuestas'}</span>
          </button>

          <button
            onClick={() => onOpenTaker(survey.id)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Abrir como encuestado</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold ${
                  survey.active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {survey.active ? '● Encuesta Activa (Recibiendo datos)' : '⏸ Pausada'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">
                Creada el {new Date(survey.createdAt).toLocaleDateString('es-ES')}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{survey.questions.length} preguntas</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-sm text-slate-500 max-w-3xl">{survey.description}</p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Descargar versión compatible en formato CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => onOpenShare(survey)}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>¡Excel descargado con éxito! Contiene las hojas "Respuestas Detalladas" y "Resumen Agrupado".</span>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Respuestas Totales
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {responses.length}
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              Última Actividad
            </div>
            <div className="text-sm font-semibold text-slate-800 truncate">
              {latestResponseTime}
            </div>
          </div>

          {avgRating && (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Satisfacción Promedio
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {avgRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Estado</span>
              <button
                onClick={handleToggleActive}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {survey.active ? 'Recibiendo envíos' : 'Recepción cerrada'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'grouped'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Datos y Gráficos Agrupados</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Tabla de Respuestas ({responses.length})</span>
          </button>
        </div>

        {activeTab === 'table' && (
          <div className="relative w-64 hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en respuestas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: DATOS Y GRÁFICOS AGRUPADOS */}
      {activeTab === 'grouped' && (
        <div className="space-y-6">
          {responses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Aún no hay respuestas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Comparte el enlace de tu encuesta por WhatsApp o correo. A medida que las personas respondan, verás aquí los datos y gráficos agrupados en tiempo real.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onOpenShare(survey)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  Obtener Enlace para Compartir
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {survey.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-semibold text-indigo-600">
                        Pregunta #{idx + 1}
                      </span>
                      <span>{getQuestionTypeLabel(q.type)}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {q.text}
                    </h3>
                  </div>

                  {/* Render Visual Grouped Data based on type */}
                  <div className="pt-2">
                    {renderGroupedQuestionStats(q, responses)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TABLA DE RESPUESTAS */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Registro Individual de Respuestas
              </h3>
              <p className="text-xs text-slate-500">
                Mostrando {filteredResponses.length} de {responses.length} respuestas
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Descargar este reporte en Excel
            </button>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No se encontraron respuestas que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 whitespace-nowrap">Fecha y Hora</th>
                    <th className="p-3 whitespace-nowrap">Encuestado</th>
                    {survey.questions.map((q) => (
                      <th
                        key={q.id}
                        className="p-3 min-w-[200px] max-w-[320px] whitespace-normal"
                        title={q.text}
                      >
                        {q.text}
                      </th>
                    ))}
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-mono">
                        {i + 1}
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-600 font-mono">
                        {new Date(r.submittedAt).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium text-slate-800">
                        {r.respondentName || (
                          <span className="text-slate-400 italic">Anónimo</span>
                        )}
                      </td>
                      {survey.questions.map((q) => {
                        const val = r.answers[q.id];
                        let displayVal = '-';
                        if (val !== undefined && val !== null && val !== '') {
                          if (Array.isArray(val)) displayVal = val.join(', ');
                          else displayVal = String(val);
                        }
                        return (
                          <td
                            key={q.id}
                            className="p-3 text-slate-700 max-w-xs truncate"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedResponse(r)}
                            title="Ver detalle completo"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteResponse(r.id)}
                            title="Eliminar respuesta"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Individual Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Detalle Individual de Respuesta
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedResponse.id} ·{' '}
                  {new Date(selectedResponse.submittedAt).toLocaleString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {selectedResponse.respondentName && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-600">Nombre del encuestado:</span>{' '}
                <span className="font-bold text-slate-900">
                  {selectedResponse.respondentName}
                </span>
              </div>
            )}

            <div className="space-y-4 divide-y divide-slate-100">
              {survey.questions.map((q, idx) => {
                const val = selectedResponse.answers[q.id];
                const display =
                  val !== undefined && val !== null && val !== ''
                    ? Array.isArray(val)
                      ? val.join(', ')
                      : String(val)
                    : '(Sin respuesta)';

                return (
                  <div key={q.id} className="pt-3 space-y-1">
                    <p className="text-xs font-semibold text-slate-500">
                      {idx + 1}. {q.text}
                    </p>
                    <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {display}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function renderGroupedQuestionStats(q: any, responses: SurveyResponse[]) {
  const total = responses.length;

  if (q.type === 'radio' || q.type === 'checkbox' || q.type === 'yesno') {
    const options =
      q.type === 'yesno'
        ? ['Sí', 'No']
        : q.options && q.options.length > 0
        ? q.options
        : [];

    const counts: Record<string, number> = {};
    options.forEach((opt: string) => (counts[opt] = 0));

    let answeredTotal = 0;
    responses.forEach((r) => {
      const ans = r.answers[q.id];
      if (ans) {
        answeredTotal++;
        if (Array.isArray(ans)) {
          ans.forEach((item) => {
            counts[item] = (counts[item] || 0) + 1;
          });
        } else {
          counts[String(ans)] = (counts[String(ans)] || 0) + 1;
        }
      }
    });

    return (
      <div className="space-y-3">
        {options.map((opt: string) => {
          const count = counts[opt] || 0;
          const pct = answeredTotal > 0 ? Math.round((count / answeredTotal) * 100) : 0;

          return (
            <div key={opt} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="truncate pr-2">{opt}</span>
                <span className="font-mono tabular-nums text-slate-500 shrink-0">
                  {count} votos ({pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        <div className="pt-1 text-[11px] text-slate-400 text-right">
          Total respuestas a esta pregunta: {answeredTotal}
        </div>
      </div>
    );
  }

  if (q.type === 'rating') {
    let sum = 0;
    let count = 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    responses.forEach((r) => {
      const val = Number(r.answers[q.id]);
      if (!isNaN(val) && val > 0) {
        sum += val;
        count++;
        dist[val] = (dist[val] || 0) + 1;
      }
    });

    const avg = count > 0 ? (sum / count).toFixed(2) : 'N/A';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <div>
              <div className="text-xl font-bold text-slate-900 font-mono">{avg}</div>
              <div className="text-[11px] text-slate-500">Promedio de calificación</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <span className="font-semibold text-slate-900 font-mono">{count}</span> evaluaciones
          </div>
        </div>

        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const c = dist[stars] || 0;
            const p = count > 0 ? Math.round((c / count) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-12 text-slate-600 font-mono shrink-0">{stars} ★</span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${p}%` }}
                  ></div>
                </div>
                <span className="w-16 text-right text-slate-400 font-mono shrink-0">
                  {c} ({p}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Text questions
  const textAnswers = responses
    .map((r) => r.answers[q.id])
    .filter((val) => val && String(val).trim().length > 0)
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 flex justify-between">
        <span>Últimas respuestas de texto:</span>
        <span className="font-semibold font-mono">{textAnswers.length} registradas</span>
      </div>
      {textAnswers.length === 0 ? (
        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
          Sin respuestas de texto aún.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {textAnswers.map((txt, i) => (
            <div
              key={i}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-800 leading-relaxed"
            >
              "{String(txt)}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'radio':
      return 'Opción Única';
    case 'checkbox':
      return 'Múltiple Selección';
    case 'rating':
      return 'Calificación';
    case 'yesno':
      return 'Sí / No';
    case 'textarea':
      return 'Párrafo';
    case 'text':
    default:
      return 'Texto';
  }
}
