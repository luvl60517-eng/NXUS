import React, { useState } from 'react';
import { Character, Universe, UserProfile } from '../types';
import {
  X,
  User,
  BookOpen,
  EyeOff,
  Target,
  MessageSquare,
  Heart,
  Brain,
  Sparkles,
  Edit2,
  Globe,
  Shield,
  HelpCircle,
  Users,
} from 'lucide-react';

interface CharacterSheetModalProps {
  character: Character;
  universe?: Universe;
  userProfile?: UserProfile;
  onClose: () => void;
  onEdit?: (character: Character) => void;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  character,
  universe,
  userProfile,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'psych' | 'knowledge' | 'relations'>('sheet');

  const userRel = character.relationships?.find((r) => r.targetId === 'user') || {
    status: 'indiferente',
    affinity: 0,
    notes: 'Sin interacción previa registrada.',
  };

  const getAffinityColor = (affinity: number) => {
    if (affinity >= 30) return 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60';
    if (affinity <= -20) return 'text-rose-400 bg-rose-950/60 border-rose-700/60';
    return 'text-purple-300 bg-purple-950/60 border-purple-700/60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#11141d] border border-zinc-800 w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 bg-[#151926] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500/70 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">{character.name}</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-950/70 border border-purple-700/50 text-purple-300 shrink-0">
                  Ficha de Personaje
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {character.tagline || 'Sin lema'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(character);
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                title="Editar esta ficha"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800/80 bg-[#131722] text-xs font-medium px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Identidad & Historia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('psych')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'psych'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Personalidad & Diálogo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" /> Secretos & Puntos Ciegos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relations')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'relations'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> Relación & Memorias ({character.memories?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              {/* Universe link */}
              {universe && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/60 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-indigo-300 min-w-0">
                    {universe.image ? (
                      <img
                        src={universe.image}
                        alt={universe.name}
                        className="w-10 h-10 rounded-lg object-cover border border-indigo-600/60 shrink-0"
                      />
                    ) : (
                      <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-bold block truncate">Mundo: {universe.name}</span>
                      <p className="text-[11px] text-indigo-400/80 truncate">{universe.tagline}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backstory */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  Historia de Origen / Trasfondo
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {character.backstory || 'Sin trasfondo definido.'}
                </div>
              </div>

              {/* Greeting */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  Mensaje Inicial de Saludo
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-300 italic leading-relaxed whitespace-pre-wrap">
                  {character.greetingMessage || 'Saludo estándar.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'psych' && (
            <div className="space-y-4">
              {/* Personality */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Psicología & Personalidad
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {character.personality || 'Sin rasgos de personalidad definidos.'}
                </div>
              </div>

              {/* Speech Style */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  Estilo de Habla & Cadencia
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {character.speechStyle || 'Estilo de diálogo estándar.'}
                </div>
              </div>

              {/* Objectives */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  Objetivos Personales
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {character.personalObjectives || 'Sin objetivos declarados.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              {/* Private Knowledge */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Conocimientos Privados & Secretos
                </h3>
                <p className="text-[11px] text-zinc-500 mb-1.5">
                  Información que este personaje conoce pero oculta a los demás personajes o al usuario.
                </p>
                <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200/90 leading-relaxed whitespace-pre-wrap">
                  {character.privateKnowledge || 'No posee conocimientos secretos especiales.'}
                </div>
              </div>

              {/* Blind spots */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                  Puntos Ciegos (Lo que desconoce)
                </h3>
                <p className="text-[11px] text-zinc-500 mb-1.5">
                  Detalles cruciales que ignora por completo, evitando que el personaje actúe como si lo supiera todo.
                </p>
                <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl text-rose-200/90 leading-relaxed whitespace-pre-wrap">
                  {character.blindSpots || 'No tiene puntos ciegos registrados.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="space-y-4">
              {/* User relationship status */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  Vínculo con el Usuario ({userProfile?.name || 'Tú'})
                </h3>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Estado de relación:</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${getAffinityColor(userRel.affinity)}`}>
                      {userRel.status} ({userRel.affinity > 0 ? `+${userRel.affinity}` : userRel.affinity})
                    </span>
                  </div>
                  {userRel.notes && (
                    <div className="text-xs text-zinc-300 pt-1 border-t border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Impresión actual:</span>
                      {userRel.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Inter-character relationships */}
              {(() => {
                const charRels = (character.relationships || []).filter(
                  (r) => r.targetType === 'character' || (r.targetId !== 'user' && r.targetId)
                );

                return (
                  <div>
                    <h3 className="font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Vínculos con otros Personajes ({charRels.length})
                    </h3>
                    {charRels.length === 0 ? (
                      <div className="p-3 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs">
                        No tiene lazos previos registrados con otros personajes.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {charRels.map((rel) => (
                          <div
                            key={rel.targetId}
                            className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{rel.targetName}</span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${getAffinityColor(
                                  rel.affinity
                                )}`}
                              >
                                {rel.status} ({rel.affinity > 0 ? `+${rel.affinity}` : rel.affinity})
                              </span>
                            </div>
                            {rel.notes && (
                              <div className="text-xs text-zinc-300 pt-1 border-t border-zinc-800/80">
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                                  Historia / Opinión:
                                </span>
                                {rel.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stored memories */}
              <div>
                <h3 className="font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  Recuerdos Contextuales ({character.memories?.length || 0})
                </h3>
                {(!character.memories || character.memories.length === 0) ? (
                  <div className="p-4 text-center text-zinc-500 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                    Este personaje aún no ha formado recuerdos episódicos.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {character.memories.map((mem) => (
                      <div
                        key={mem.id}
                        className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-start gap-2"
                      >
                        <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-200">{mem.content}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                            {mem.category && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 uppercase">
                                {mem.category}
                              </span>
                            )}
                            <span>Importancia: {mem.importance}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#151926] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
