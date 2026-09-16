import React from 'react';
import { Universe, Character } from '../types';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  MapPin,
  KeyRound,
  Users,
  Search,
} from 'lucide-react';

interface UniversesListProps {
  universes: Universe[];
  characters: Character[];
  onCreateUniverse: () => void;
  onEditUniverse: (universe: Universe) => void;
  onDeleteUniverse: (univId: string) => void;
  onStartChatInUniverse: (universe: Universe) => void;
}

export const UniversesList: React.FC<UniversesListProps> = ({
  universes,
  characters,
  onCreateUniverse,
  onEditUniverse,
  onDeleteUniverse,
  onStartChatInUniverse,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredUniverses = universes.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="p-3 sm:p-4 space-y-3 bg-[#0d1017] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Universos & Lore ({universes.length})
            </h1>
            <p className="text-xs text-zinc-400">
              Mundos con reglas propias, secretos y lorebooks persistentes
            </p>
          </div>

          <button
            onClick={onCreateUniverse}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-950"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Universo</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar universo por nombre o lema..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Universes List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {universes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <Globe className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-sm font-semibold text-zinc-200">
                Aún no has creado universos
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Define mundos enteros con sus leyes físicas y mágicas, ubicaciones emblemáticas,
                secretos históricos y entradas de Lorebook.
              </p>
            </div>
            <button
              onClick={onCreateUniverse}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-950"
            >
              <Plus className="w-4 h-4" /> Crear mi primer Universo
            </button>
          </div>
        ) : filteredUniverses.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No se encontraron universos con ese nombre.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredUniverses.map((univ) => {
              const universeCharacters = characters.filter(
                (c) => c.universeId === univ.id
              );

              return (
                <div
                  key={univ.id}
                  className="bg-[#131722] border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-4 transition shadow-xs group overflow-hidden"
                >
                  {univ.image && (
                    <div className="relative w-full h-32 -mx-4 -mt-4 mb-3.5 overflow-hidden border-b border-zinc-800/80">
                      <img
                        src={univ.image}
                        alt={univ.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-[#131722]/30 to-transparent" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-2">
                        <span>🌌 {univ.name}</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {univ.tagline || 'Universo personalizado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditUniverse(univ)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                        title="Editar universo y lore"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Eliminar el universo "${univ.name}"? Los personajes no se borrarán.`
                            )
                          ) {
                            onDeleteUniverse(univ.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition"
                        title="Eliminar universo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed mb-3">
                    {univ.description || 'Sin descripción general.'}
                  </p>

                  {/* Badges / Stats */}
                  <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-300">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{univ.lore?.length || 0} Entradas Lorebook</span>
                    </span>

                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-300">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{univ.locations?.length || 0} Ubicaciones</span>
                    </span>

                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-300">
                      <Users className="w-3.5 h-3.5" />
                      <span>{universeCharacters.length} Habitantes</span>
                    </span>

                    {univ.secrets && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-300">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Secretos ocultos</span>
                      </span>
                    )}
                  </div>

                  {/* Resident Avatars Preview */}
                  {universeCharacters.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 mb-3">
                      <span className="text-[11px] text-zinc-400">Personajes:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {universeCharacters.slice(0, 5).map((c) => (
                          <img
                            key={c.id}
                            src={c.avatar}
                            alt={c.name}
                            title={c.name}
                            className="inline-block w-6 h-6 rounded-full ring-2 ring-[#131722] object-cover"
                          />
                        ))}
                      </div>
                      {universeCharacters.length > 5 && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                          +{universeCharacters.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => onStartChatInUniverse(univ)}
                      className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Abrir Escena en este Mundo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
