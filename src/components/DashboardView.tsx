import React, { useState } from 'react';
import {
  Plus,
  Share2,
  FileSpreadsheet,
  BarChart2,
  Trash2,
  ExternalLink,
  Search,
  Users,
  CheckCircle2,
  Send,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { SurveySummary, Survey } from '../types.ts';

interface DashboardViewProps {
  surveys: SurveySummary[];
  loading: boolean;
  onSelectSurvey: (id: string) => void;
  onOpenCreator: () => void;
  onOpenShareModal: (survey: Survey) => void;
  onOpenTaker: (id: string) => void;
  onDeleteSurvey: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  surveys,
  loading,
  onSelectSurvey,
  onOpenCreator,
  onOpenShareModal,
  onOpenTaker,
  onDeleteSurvey,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const totalSurveys = surveys.length;
  const totalResponses = surveys.reduce((acc, curr) => acc + curr.responseCount, 0);
  const activeSurveys = surveys.filter((s) => s.active).length;

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'active') return matchesSearch && s.active;
    if (filter === 'paused') return matchesSearch && !s.active;
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sincronización en la Nube y Exportación Excel</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Crea tus encuestas, compártelas y descarga las respuestas en Excel.
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Genera enlaces públicos que cualquier persona puede responder desde su celular.
            Recibe todas las respuestas en vivo y descárgalas en Excel (.xlsx) 100% agrupadas y ordenadas.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreator}
              className="px-6 py-3 rounded-xl bg-white text-indigo-950 text-xs sm:text-sm font-bold shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Crear Nueva Encuesta</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Encuestas Creadas</span>
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalSurveys}
          </div>
          <div className="text-xs text-slate-400">Listas para compartir con tu audiencia</div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Respuestas Recibidas</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalResponses}
          </div>
          <div className="text-xs text-slate-400">Almacenadas de forma segura en el servidor</div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Encuestas Activas</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {activeSurveys}
          </div>
          <div className="text-xs text-slate-400">Disponibles actualmente para responder</div>
        </div>
      </div>

      {/* Workflow Steps Explanation */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
          ¿Cómo funciona el flujo completo?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-600 font-mono">1. Diseñas</span>
            <p className="text-slate-600 leading-normal">
              Agregas tus preguntas (opción única, múltiple, estrellas o texto libre).
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-600 font-mono">2. Compartes</span>
            <p className="text-slate-600 leading-normal">
              Copias el enlace o lo mandas por WhatsApp con código QR a cualquier persona.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-600 font-mono">3. Responden</span>
            <p className="text-slate-600 leading-normal">
              Los encuestados abren el enlace en su celular o PC y presionan enviar.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-600 font-mono">4. Descargas Excel</span>
            <p className="text-slate-600 leading-normal">
              Obtienes un archivo .xlsx con todas las respuestas ordenadas y agrupadas con gráficos.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título de encuesta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({surveys.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activas ({activeSurveys})
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'paused'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pausadas ({surveys.length - activeSurveys})
          </button>
        </div>
      </div>

      {/* Survey Cards Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Cargando encuestas disponibles...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">
              {search ? 'No se encontraron encuestas' : 'Aún no tienes encuestas'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'Prueba con otro término de búsqueda o limpia el filtro.'
                : 'Crea tu primera encuesta ahora para generar un enlace y empezar a recibir respuestas.'}
            </p>
          </div>
          <button
            onClick={onOpenCreator}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            Crear Primera Encuesta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {new Date(survey.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span>·</span>
                    <span>{survey.questionsCount} preguntas</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      survey.active ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {survey.active ? '● Activa' : '⏸ Pausada'}
                  </span>
                </div>

                {/* Title and description */}
                <div>
                  <h3
                    onClick={() => onSelectSurvey(survey.id)}
                    className="font-bold text-slate-900 text-base leading-snug line-clamp-2 cursor-pointer group-hover:text-indigo-600 transition-colors"
                  >
                    {survey.title}
                  </h3>
                  {survey.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {survey.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Response Count and Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-mono tabular-nums">{survey.responseCount}</span>{' '}
                    <span>{survey.responseCount === 1 ? 'respuesta' : 'respuestas'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenTaker(survey.id)}
                      title="Probar responder como encuestado"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSurvey(survey.id)}
                      title="Eliminar encuesta"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectSurvey(survey.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver Excel</span>
                  </button>

                  <button
                    onClick={async () => {
                      // Fetch full survey to pass to modal
                      try {
                        const res = await fetch(`/api/surveys/${survey.id}`);
                        if (res.ok) {
                          const full = await res.json();
                          onOpenShareModal(full);
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
