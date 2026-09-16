import React, { useState } from 'react';
import { Character, Universe } from '../types';
import {
  X,
  Globe,
  Users,
  Sparkles,
  BookOpen,
  MapPin,
  Plus,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface SelectWorldModalProps {
  selectedCharacters: Character[];
  universes: Universe[];
  onConfirm: (universe: Universe, scenarioNotes?: string) => void;
  onCreateUniverse: () => void;
  onClose: () => void;
}

export const SelectWorldModal: React.FC<SelectWorldModalProps> = ({
  selectedCharacters,
  universes,
  onConfirm,
  onCreateUniverse,
  onClose,
}) => {
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(
    universes[0]?.id || ''
  );
  const [customScenario, setCustomScenario] = useState('');

  const handleStart = (universe: Universe) => {
    onConfirm(universe, customScenario.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#11141d] border border-zinc-800 w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 bg-[#151926] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-600/50 flex items-center justify-center text-indigo-300 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Elige el Mundo para la Aventura
              </h2>
              <p className="text-xs text-zinc-400">
                Selecciona en qué universo se adentrarán los personajes seleccionados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected characters strip */}
        <div className="px-4 py-3 bg-purple-950/20 border-b border-zinc-800/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {selectedCharacters.map((char) => (
                <img
                  key={char.id}
                  src={char.avatar}
                  alt={char.name}
                  className="inline-block w-8 h-8 rounded-full ring-2 ring-[#11141d] object-cover"
                  title={char.name}
                />
              ))}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-purple-200 block truncate">
                {selectedCharacters.map((c) => c.name).join(', ')}
              </span>
              <span className="text-[11px] text-zinc-400">
                {selectedCharacters.length}{' '}
                {selectedCharacters.length === 1 ? 'personaje con su ficha' : 'personajes con sus fichas'}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-700/50 shrink-0">
            {selectedCharacters.length > 1 ? 'Chat Grupal' : 'Chat Individual'}
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Custom Scenario / Situación inicial */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Situación inicial o prólogo (opcional)
            </label>
            <input
              type="text"
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="Ej: Los personajes se encuentran acorralados en un callejón lluvioso..."
              className="w-full bg-[#161a26] border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition text-xs"
            />
          </div>

          {/* Universes list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Mundos disponibles ({universes.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateUniverse();
                }}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Nuevo Mundo
              </button>
            </div>

            {universes.length === 0 ? (
              <div className="text-center py-8 px-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl">
                <Globe className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-300 font-semibold mb-1">Aún no hay mundos creados</p>
                <p className="text-zinc-500 text-xs mb-3">
                  Crea un universo con sus reglas, secretos y lorebook para arrancar la aventura.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateUniverse();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  Crear mi primer Universo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {universes.map((univ) => {
                  const isSelected = selectedUniverseId === univ.id;
                  return (
                    <div
                      key={univ.id}
                      onClick={() => setSelectedUniverseId(univ.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/40'
                          : 'bg-[#141824] border-zinc-800/90 hover:border-zinc-700 hover:bg-[#181d2c]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {univ.image ? (
                          <img
                            src={univ.image}
                            alt={univ.name}
                            className="w-14 h-14 rounded-xl object-cover border border-zinc-700/80 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-indigo-400">
                            <Globe className="w-6 h-6" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm truncate">{univ.name}</h3>
                          </div>
                          {univ.tagline && (
                            <p className="text-xs text-indigo-200/90 line-clamp-1">{univ.tagline}</p>
                          )}
                          {univ.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2">{univ.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md">
                              <BookOpen className="w-3 h-3 text-indigo-400" />
                              {univ.lore?.length || 0} entradas de lore
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              {univ.locations?.length || 0} ubicaciones
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(univ);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md transition"
                      >
                        <span>Entrar a este Mundo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-[#151926] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>

          {universes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const targetUniv = universes.find((u) => u.id === selectedUniverseId) || universes[0];
                if (targetUniv) handleStart(targetUniv);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
            >
              <span>¡Entrar al Mundo y Arrancar! 🚀</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
