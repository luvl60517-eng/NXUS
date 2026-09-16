import React from 'react';
import { Character, CharacterRelationship } from '../types';
import { Heart, Shield, Swords, Users, Sparkles, X, Edit3, Check, Plus, Trash2 } from 'lucide-react';

interface RelationshipModalProps {
  character: Character;
  onClose: () => void;
  onUpdateRelationships: (updated: CharacterRelationship[]) => void;
  otherCharacters?: Character[];
  userName: string;
}

const STATUS_PRESETS = [
  'aliado leal',
  'hermano / familia',
  'rival acerrimo',
  'enemigo mortal',
  'mentor',
  'aprendiz',
  'romance secreto',
  'complice',
  'sospechoso',
  'deuda de honor',
  'indiferente',
];

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  character,
  onClose,
  onUpdateRelationships,
  otherCharacters = [],
  userName,
}) => {
  const [relationships, setRelationships] = React.useState<CharacterRelationship[]>(
    character.relationships || []
  );
  const [editingTargetId, setEditingTargetId] = React.useState<string | null>(null);
  const [tempNotes, setTempNotes] = React.useState('');
  const [tempStatus, setTempStatus] = React.useState('');
  const [tempAffinity, setTempAffinity] = React.useState(0);

  // New relationship creation state
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newTargetId, setNewTargetId] = React.useState('');
  const [newStatus, setNewStatus] = React.useState('aliado leal');
  const [newAffinity, setNewAffinity] = React.useState(40);
  const [newNotes, setNewNotes] = React.useState('');

  // Characters not yet linked to this character
  const unlinkedCharacters = otherCharacters.filter(
    (c) => c.id !== character.id && !relationships.some((r) => r.targetId === c.id)
  );

  // Ensure relationship with user exists
  React.useEffect(() => {
    let list = [...(character.relationships || [])];
    const userRel = list.find((r) => r.targetId === 'user');
    if (!userRel) {
      list.unshift({
        targetId: 'user',
        targetType: 'user',
        targetName: userName,
        status: 'indiferente',
        affinity: 0,
        notes: 'Aún os estáis conociendo.',
        lastUpdated: Date.now(),
      });
      setRelationships(list);
      onUpdateRelationships(list);
    }
  }, [character.id, userName]);

  const handleStartEdit = (rel: CharacterRelationship) => {
    setEditingTargetId(rel.targetId);
    setTempNotes(rel.notes);
    setTempStatus(rel.status);
    setTempAffinity(rel.affinity);
  };

  const handleSaveEdit = (targetId: string) => {
    const updated = relationships.map((r) => {
      if (r.targetId === targetId) {
        return {
          ...r,
          status: tempStatus || r.status,
          affinity: tempAffinity,
          notes: tempNotes,
          lastUpdated: Date.now(),
        };
      }
      return r;
    });
    setRelationships(updated);
    onUpdateRelationships(updated);
    setEditingTargetId(null);
  };

  const handleDeleteRelationship = (targetId: string) => {
    const updated = relationships.filter((r) => r.targetId !== targetId);
    setRelationships(updated);
    onUpdateRelationships(updated);
    if (editingTargetId === targetId) {
      setEditingTargetId(null);
    }
  };

  const handleCreateNewRelationship = () => {
    if (!newTargetId) return;
    const targetChar = otherCharacters.find((c) => c.id === newTargetId);
    if (!targetChar) return;

    const newRel: CharacterRelationship = {
      targetId: targetChar.id,
      targetType: 'character',
      targetName: targetChar.name,
      status: newStatus,
      affinity: newAffinity,
      notes: newNotes || `Vínculo preexistente con ${targetChar.name}.`,
      lastUpdated: Date.now(),
    };

    const updated = [...relationships, newRel];
    setRelationships(updated);
    onUpdateRelationships(updated);
    setIsAddingNew(false);
    setNewTargetId('');
    setNewNotes('');
    setNewAffinity(40);
  };

  const getStatusColor = (affinity: number) => {
    if (affinity >= 50) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
    if (affinity >= 15) return 'text-sky-400 bg-sky-950/40 border-sky-800';
    if (affinity > -15) return 'text-zinc-400 bg-zinc-900 border-zinc-700';
    if (affinity > -50) return 'text-amber-400 bg-amber-950/40 border-amber-800';
    return 'text-rose-400 bg-rose-950/40 border-rose-800';
  };

  const getAffinityIcon = (affinity: number, status: string) => {
    if (status.includes('romant') || affinity > 75) return <Heart className="w-4 h-4 text-pink-400" />;
    if (status.includes('rival') || status.includes('hostil') || affinity < -30) return <Swords className="w-4 h-4 text-rose-400" />;
    if (status.includes('leal') || status.includes('protector') || status.includes('herman')) return <Shield className="w-4 h-4 text-indigo-400" />;
    return <Sparkles className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#11141c] border border-zinc-800 w-full max-w-lg rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover border border-zinc-700"
            />
            <div>
              <h2 className="text-base font-semibold text-white">
                Vínculos & Relaciones
              </h2>
              <p className="text-xs text-zinc-400">
                Lazos de {character.name} con el usuario y otros personajes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60 text-xs text-zinc-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              Las relaciones existen desde el principio y evolucionan dinámicamente durante el roleplay.
              NEXUS inyecta estos lazos en el prompt para que los personajes se reconozcan de inmediato.
            </span>
          </div>

          <div className="space-y-3">
            {relationships.map((rel) => {
              const isEditing = editingTargetId === rel.targetId;
              const isUser = rel.targetId === 'user';
              const targetChar = !isUser ? otherCharacters.find((c) => c.id === rel.targetId) : null;

              return (
                <div
                  key={rel.targetId}
                  className="bg-[#161a25] border border-zinc-800 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      {isUser ? (
                        <div className="w-9 h-9 rounded-full bg-purple-900/60 border border-purple-600 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                          Tú
                        </div>
                      ) : targetChar ? (
                        <img
                          src={targetChar.avatar}
                          alt={targetChar.name}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                          <span>{isUser ? `${userName} (Tú)` : rel.targetName}</span>
                          {!isUser && (
                            <span className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.2 rounded">
                              Personaje
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 capitalize">
                          {isUser ? 'Relación con el usuario' : 'Vínculo entre personajes'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(rel)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
                            title="Modificar relación manualmente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isUser && (
                            <button
                              onClick={() => handleDeleteRelationship(rel.targetId)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition"
                              title="Eliminar vínculo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleSaveEdit(rel.targetId)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs flex items-center gap-1 font-medium"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                      )}
                    </div>
                  </div>

                  {!isEditing ? (
                    <div>
                      {/* Affinity Bar */}
                      <div className="mt-2 mb-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            {getAffinityIcon(rel.affinity, rel.status)}
                            <span className="capitalize">{rel.status}</span>
                          </span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full border text-[11px] ${getStatusColor(
                              rel.affinity
                            )}`}
                          >
                            Afinidad: {rel.affinity > 0 ? `+${rel.affinity}` : rel.affinity} / 100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full transition-all duration-300 ${
                              rel.affinity >= 0 ? 'bg-purple-500' : 'bg-rose-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(5, (rel.affinity + 100) / 2))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Notes / Thoughts */}
                      <div className="text-xs text-zinc-300 bg-zinc-900/70 p-2.5 rounded-lg border border-zinc-800/80 mt-2">
                        <span className="text-zinc-500 font-medium block text-[10px] uppercase tracking-wider mb-0.5">
                          Pensamientos íntimos de {character.name}:
                        </span>
                        {rel.notes || 'Sin impresiones registradas aún.'}
                      </div>
                    </div>
                  ) : (
                    /* Edit Form */
                    <div className="space-y-3 mt-3 pt-3 border-t border-zinc-800">
                      <div>
                        <label className="text-xs text-zinc-300 font-medium block mb-1">
                          Estado o rol de la relación:
                        </label>
                        <input
                          type="text"
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          placeholder="Ej: aliado leal, rival, hermano, enemigo..."
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-zinc-300 mb-1">
                          <span>Afinidad (-100 a +100):</span>
                          <span className="font-bold text-purple-400">{tempAffinity}</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={tempAffinity}
                          onChange={(e) => setTempAffinity(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-zinc-300 font-medium block mb-1">
                          Pensamientos íntimos / Motivo del lazo:
                        </label>
                        <textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          rows={2}
                          placeholder="¿Qué piensa el personaje de esta persona o qué historia comparten?"
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Section to link with unlinked other characters */}
            {unlinkedCharacters.length > 0 && !isAddingNew && (
              <button
                onClick={() => {
                  setNewTargetId(unlinkedCharacters[0].id);
                  setIsAddingNew(true);
                }}
                className="w-full py-2.5 px-3 border border-dashed border-zinc-700 hover:border-purple-500/80 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-purple-950/20 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Vincular con otro personaje ({unlinkedCharacters.length} disponibles)</span>
              </button>
            )}

            {/* New Relationship Creator Form */}
            {isAddingNew && (
              <div className="bg-[#171c2b] border border-purple-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    Nuevo Vínculo con Personaje
                  </span>
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs text-zinc-300 block mb-1">Selecciona el personaje:</label>
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  >
                    {unlinkedCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.tagline})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-zinc-300 block mb-1">Rol / Estado:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-purple-500"
                    >
                      {STATUS_PRESETS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span>Afinidad inicial:</span>
                      <span className="font-bold text-purple-400">{newAffinity}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={newAffinity}
                      onChange={(e) => setNewAffinity(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-300 block mb-1">
                    Historia previa o qué piensa de este personaje:
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ej: Se conocen de misiones pasadas; desconfía de sus implantes..."
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewRelationship}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-950"
                  >
                    Crear Vínculo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#131722] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
