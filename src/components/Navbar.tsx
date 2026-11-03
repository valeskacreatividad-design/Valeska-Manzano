import React from 'react';
import { Plus, BarChart3 } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'create' | 'results' | 'taker';
  onNavigate: (view: 'dashboard' | 'create') => void;
  onOpenTemplates?: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenTemplates,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            EncuestaFlow
          </span>
        </div>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentView === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Mis Encuestas
          </button>
          <button
            onClick={() => onNavigate('create')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentView === 'create' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Diseñador de Encuestas
          </button>
          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900"
            >
              Plantillas Listas
            </button>
          )}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900"
            >
              Cómo Funciona
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('create')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Encuesta</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
