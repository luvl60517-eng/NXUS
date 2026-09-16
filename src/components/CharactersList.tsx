import React, { useState, useRef } from 'react';
import { Character, Universe, UserProfile } from '../types';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Brain,
  Heart,
  Search,
  Check,
  CheckSquare,
  Globe,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import { RelationshipModal } from './RelationshipModal';
import { MemoryModal } from './MemoryModal';
import { CharacterSheetModal } from './CharacterSheetModal';

interface CharactersListProps {
  characters: Character[];
  universes: Universe[];
  userProfile: UserProfile;
  onCreateCharacter: () => void;
  onEditCharacter: (char: Character) => void;
  onDeleteCharacter: (charId: string) => void;
  onStartChatWithCharacter: (char: Character) => void;
  onUpdateCharacter: (char: Character) => void;
  onStartWorldAdventure?: (selectedCharacters: Character[]) => void;
}

export const CharactersList: React.FC<CharactersListProps> = ({
  characters,
  universes,
  userProfile,
  onCreateCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onStartChatWithCharacter,
  onUpdateCharacter,
  onStartWorldAdventure,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniverseFilter, setSelectedUniverseFilter] = useState<string>('all');

  // Multi-selection state for group adventure
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Modals state
  const [activeRelChar, setActiveRelChar] = useState<Character | null>(null);
  const [activeMemChar, setActiveMemChar] = useState<Character | null>(null);
  const [activeSheetChar, setActiveSheetChar] = useState<Character | null>(null);

  // Long press timer ref & tracker
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressPosRef = useRef<{ x: number; y: number } | null>(null);
  const didTriggerLongPressRef = useRef(false);

  const toggleSelectCharacter = (charId: string) => {
    setSelectedCharacterIds((prev) => {
      const next = prev.includes(charId)
        ? prev.filter((id) => id !== charId)
        : [...prev, charId];
      if (next.length === 0 && !isSelectionMode) {
        setIsSelectionMode(false);
      }
      return next;
    });
  };

  const handlePointerDown = (charId: string, e: React.PointerEvent) => {
    // Avoid triggering on child buttons or inputs
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    didTriggerLongPressRef.current = false;
    pressPosRef.current = { x: e.clientX, y: e.clientY };

    longPressTimerRef.current = setTimeout(() => {
      didTriggerLongPressRef.current = true;
      setIsSelectionMode(true);
      toggleSelectCharacter(charId);
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try {
          window.navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressPosRef.current) return;
    const dist = Math.hypot(e.clientX - pressPosRef.current.x, e.clientY - pressPosRef.current.y);
    if (dist > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (char: Character) => {
    if (didTriggerLongPressRef.current) {
      didTriggerLongPressRef.current = false;
      return;
    }
    if (isSelectionMode) {
      toggleSelectCharacter(char.id);
    }
  };

  const clearSelection = () => {
    setSelectedCharacterIds([]);
    setIsSelectionMode(false);
  };

  const selectedCharacters = characters.filter((c) => selectedCharacterIds.includes(c.id));

  const filteredCharacters = characters.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUniverse =
      selectedUniverseFilter === 'all' || c.universeId === selectedUniverseFilter;
    return matchesSearch && matchesUniverse;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Search & Top Bar */}
      <div className="p-3 sm:p-4 space-y-3 bg-[#0d1017] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Mis Personajes ({characters.length})
            </h1>
            <p className="text-xs text-zinc-400">
              Creados por ti: con fichas completas, conocimientos privados y memorias
            </p>
          </div>

          <div className="flex items-center gap-2">
            {characters.length > 0 && (
              <button
                onClick={() => {
                  if (isSelectionMode) {
                    clearSelection();
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                  isSelectionMode
                    ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
                }`}
                title="Seleccionar varios personajes para entrar a un mundo"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isSelectionMode ? 'Cancelar' : 'Seleccionar'}</span>
              </button>
            )}

            <button
              onClick={onCreateCharacter}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-purple-950"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Personaje</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Tip / instructions banner */}
        <div className="px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              {isSelectionMode
                ? 'Toca los personajes que participarán y dale a "Entrar al Mundo".'
                : 'Mantén pulsado cualquier personaje para seleccionarlo y meterlo a un mundo.'}
            </span>
          </span>
          {isSelectionMode && selectedCharacterIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-[11px] text-purple-200 hover:underline shrink-0 ml-2"
            >
              Limpiar ({selectedCharacterIds.length})
            </button>
          )}
        </div>

        {/* Search and filter controls */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o profesión..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          {universes.length > 0 && (
            <select
              value={selectedUniverseFilter}
              onChange={(e) => setSelectedUniverseFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 outline-none max-w-[150px]"
            >
              <option value="all">Todos los Universos</option>
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Characters Grid / List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-24">
        {characters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-sm font-semibold text-zinc-200">
                Aún no has creado personajes
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                En NEXUS puedes crear personajes con fichas completas, conocimientos privados,
                puntos ciegos y objetivos. Cuando tengas varios, podrás seleccionarlos y meterlos a
                un mundo para iniciar un roleplay grupal.
              </p>
            </div>
            <button
              onClick={onCreateCharacter}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-purple-950"
            >
              <Plus className="w-4 h-4" /> Crear mi primer Personaje
            </button>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No se encontraron personajes con ese criterio de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCharacters.map((char) => {
              const universe = universes.find((u) => u.id === char.universeId);
              const userRel = char.relationships?.find((r) => r.targetId === 'user') || {
                status: 'indiferente',
                affinity: 0,
                notes: 'Sin interacción previa',
              };
              const isSelected = selectedCharacterIds.includes(char.id);

              return (
                <div
                  key={char.id}
                  onPointerDown={(e) => handlePointerDown(char.id, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onClick={() => handleCardClick(char)}
                  className={`rounded-2xl p-4 flex flex-col justify-between transition relative cursor-pointer select-none ${
                    isSelected
                      ? 'bg-purple-950/40 border-2 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                      : isSelectionMode
                      ? 'bg-[#131722] border-2 border-dashed border-zinc-700 hover:border-purple-400'
                      : 'bg-[#131722] border border-zinc-800/90 hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar, Selector Badge & Identity */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative shrink-0">
                        <img
                          src={char.avatar}
                          alt={char.name}
                          className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md transition ${
                            isSelected ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-purple-500/60'
                          }`}
                        />
                        {/* Multi-selection Checkbox Indicator */}
                        {isSelectionMode && (
                          <div
                            className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition shadow-md ${
                              isSelected
                                ? 'bg-purple-600 border-purple-300 text-white'
                                : 'bg-black/80 border-zinc-500 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2
                            className={`text-sm font-bold truncate transition ${
                              isSelected ? 'text-purple-200' : 'text-white'
                            }`}
                          >
                            {char.name}
                          </h2>
                          <div className="flex items-center gap-1">
                            {/* Ver Ficha Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSheetChar(char);
                              }}
                              className="p-1.5 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-950/50 transition flex items-center gap-1 text-[11px]"
                              title="Ver ficha completa de este personaje"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ficha</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCharacter(char);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                              title="Editar personaje"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Eliminar al personaje ${char.name}?`)) {
                                  onDeleteCharacter(char.id);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition"
                              title="Eliminar personaje"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 truncate mb-1">
                          {char.tagline || 'Personaje con ficha'}
                        </p>

                        {universe && (
                          <span className="inline-block text-[10px] text-indigo-400 font-medium bg-indigo-950/40 border border-indigo-800/60 px-2 py-0.5 rounded-md truncate max-w-full">
                            🌌 {universe.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Personality snippet */}
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                      {char.personality || char.backstory || 'Sin descripción adicional.'}
                    </p>

                    {/* Stats pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRelChar(char);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-pink-500/60 transition"
                        title="Ver y ajustar relación con el usuario"
                      >
                        <Heart className="w-3 h-3 text-pink-400" />
                        <span className="capitalize">{userRel.status}</span>
                        <span className="text-purple-400 font-bold">
                          ({userRel.affinity > 0 ? `+${userRel.affinity}` : userRel.affinity})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMemChar(char);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500/60 transition"
                        title="Ver recuerdos episódicos"
                      >
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span>{char.memories?.length || 0} Recuerdos</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSheetChar(char);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-purple-300 flex items-center gap-1 py-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChatWithCharacter(char);
                      }}
                      className="px-3.5 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Directo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar when characters are selected */}
      {selectedCharacterIds.length > 0 && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#121624] border-2 border-purple-500/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                {selectedCharacters.slice(0, 4).map((c) => (
                  <img
                    key={c.id}
                    src={c.avatar}
                    alt={c.name}
                    className="w-8 h-8 rounded-full ring-2 ring-[#121624] object-cover"
                    title={c.name}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {selectedCharacters.length}{' '}
                  {selectedCharacters.length === 1
                    ? 'personaje seleccionado'
                    : 'personajes seleccionados'}
                </span>
                <span className="text-[11px] text-purple-300/80 truncate block">
                  {selectedCharacters.length > 1
                    ? 'Listos para entrar al mundo en chat grupal'
                    : 'Selecciona más o entra al mundo'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearSelection}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                title="Deseleccionar todos"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onStartWorldAdventure) {
                    onStartWorldAdventure(selectedCharacters);
                  }
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-950 transition"
              >
                <Globe className="w-4 h-4 text-purple-200" />
                <span>Elegir Mundo y Arrancar 🌌</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Sheet Modal */}
      {activeSheetChar && (
        <CharacterSheetModal
          character={activeSheetChar}
          universe={universes.find((u) => u.id === activeSheetChar.universeId)}
          userProfile={userProfile}
          onClose={() => setActiveSheetChar(null)}
          onEdit={(char) => {
            setActiveSheetChar(null);
            onEditCharacter(char);
          }}
        />
      )}

      {/* Relationship Modal */}
      {activeRelChar && (
        <RelationshipModal
          character={activeRelChar}
          userName={userProfile.name}
          otherCharacters={characters.filter((c) => c.id !== activeRelChar.id)}
          onClose={() => setActiveRelChar(null)}
          onUpdateRelationships={(updated) => {
            onUpdateCharacter({
              ...activeRelChar,
              relationships: updated,
            });
            setActiveRelChar({
              ...activeRelChar,
              relationships: updated,
            });
          }}
        />
      )}

      {/* Memory Modal */}
      {activeMemChar && (
        <MemoryModal
          character={activeMemChar}
          onClose={() => setActiveMemChar(null)}
          onUpdateMemories={(updated) => {
            onUpdateCharacter({
              ...activeMemChar,
              memories: updated,
            });
            setActiveMemChar({
              ...activeMemChar,
              memories: updated,
            });
          }}
        />
      )}
    </div>
  );
};
