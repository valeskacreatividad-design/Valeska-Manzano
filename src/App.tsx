import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SurveyCreator } from './components/SurveyCreator.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { SurveyTaker } from './components/SurveyTaker.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { Survey, SurveySummary } from './types.ts';
import { HelpCircle, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'results' | 'taker'>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [shareSurvey, setShareSurvey] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash.startsWith('#/s/') || hash.startsWith('#survey=')) {
        const id = hash.replace('#/s/', '').replace('#survey=', '');
        if (id) {
          setSelectedSurveyId(id);
          setCurrentView('taker');
          return;
        }
      }

      if (hash.startsWith('#/results/')) {
        const id = hash.replace('#/results/', '');
        if (id) {
          setSelectedSurveyId(id);
          setCurrentView('results');
          return;
        }
      }

      if (hash === '#/create') {
        setCurrentView('create');
        return;
      }

      // Default
      setCurrentView('dashboard');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch surveys on mount & whenever navigating to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchSurveys();
    }
  }, [currentView]);

  const fetchSurveys = async () => {
    setLoadingSurveys(true);
    try {
      const res = await fetch('/api/surveys');
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch (err) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handleNavigate = (view: 'dashboard' | 'create') => {
    if (view === 'dashboard') {
      window.location.hash = '#/';
      setCurrentView('dashboard');
    } else if (view === 'create') {
      window.location.hash = '#/create';
      setCurrentView('create');
    }
  };

  const handleSelectSurveyResults = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    window.location.hash = `#/results/${surveyId}`;
    setCurrentView('results');
  };

  const handleOpenTaker = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    window.location.hash = `#/s/${surveyId}`;
    setCurrentView('taker');
  };

  const handleSurveyCreated = (newSurvey: Survey) => {
    showToast(`¡Encuesta "${newSurvey.title}" creada con éxito!`);
    setShareSurvey(newSurvey);
    handleSelectSurveyResults(newSurvey.id);
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta encuesta y todas sus respuestas?')) return;
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Encuesta eliminada correctamente.');
        setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
        if (selectedSurveyId === surveyId) {
          handleNavigate('dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenTemplates={() => {
          handleNavigate('create');
        }}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full">
        {currentView === 'dashboard' && (
          <DashboardView
            surveys={surveys}
            loading={loadingSurveys}
            onSelectSurvey={handleSelectSurveyResults}
            onOpenCreator={() => handleNavigate('create')}
            onOpenShareModal={(s) => setShareSurvey(s)}
            onOpenTaker={handleOpenTaker}
            onDeleteSurvey={handleDeleteSurvey}
          />
        )}

        {currentView === 'create' && (
          <SurveyCreator
            onSurveyCreated={handleSurveyCreated}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'results' && selectedSurveyId && (
          <ResultsView
            surveyId={selectedSurveyId}
            onBack={() => handleNavigate('dashboard')}
            onOpenShare={(s) => setShareSurvey(s)}
            onOpenTaker={handleOpenTaker}
          />
        )}

        {currentView === 'taker' && selectedSurveyId && (
          <SurveyTaker
            surveyId={selectedSurveyId}
            onGoHome={() => handleNavigate('dashboard')}
            onViewAdminResults={(id) => handleSelectSurveyResults(id)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">EncuestaFlow</span>
            <span>·</span>
            <span>Plataforma Cloud de Encuestas y Exportación a Excel</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelp(true)}
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Ayuda y Guía
            </button>
            <span>·</span>
            <span>Descarga en Excel (.xlsx) y CSV</span>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        survey={shareSurvey}
        isOpen={Boolean(shareSurvey)}
        onClose={() => setShareSurvey(null)}
        onOpenTaker={handleOpenTaker}
      />

      {/* Help / Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Guía: Cómo crear y compartir encuestas
                </h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                <h4 className="font-bold text-indigo-900">1. Servidor en la Nube real</h4>
                <p>
                  A diferencia de aplicaciones que solo guardan datos en la memoria del navegador de un usuario, esta aplicación corre sobre un servidor que almacena las encuestas y respuestas en la nube de forma persistente.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">2. Enlaces compartibles universales</h4>
                <p>
                  Cada encuesta tiene un enlace público único. Puedes mandarlo por WhatsApp, Telegram, correo o escanear su código QR. Cualquier persona en su celular o PC puede abrirlo sin instalar nada.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-800">3. Recepción en tiempo real</h4>
                <p>
                  En cuanto un encuestado presiona "Enviar", la respuesta se registra en el servidor y aparece en tu panel de resultados con gráficos de barras, porcentajes y frecuencias.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                <h4 className="font-bold text-emerald-900">4. Descarga en Excel (.xlsx)</h4>
                <p>
                  Haz clic en "Descargar Excel" en cualquier momento para obtener un archivo con hojas separadas: Respuestas individuales ordenadas cronológicamente + Resumen estadístico agrupado.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
