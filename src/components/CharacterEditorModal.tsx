import React from 'react';
import { Character, CharacterRelationship, Universe } from '../types';
import { GalleryImageUploader } from './GalleryImageUploader';
import {
  X,
  User,
  Sparkles,
  BookOpen,
  EyeOff,
  Target,
  MessageSquare,
  Smile,
  Users,
  Heart,
  Swords,
  Shield,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

interface CharacterEditorModalProps {
  character?: Character | null;
  otherCharacters?: Character[];
  universes: Universe[];
  onSave: (
    char: Character,
    reciprocalUpdates?: { targetId: string; relationship: CharacterRelationship }[]
  ) => void;
  onClose: () => void;
  userName: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

const RELATION_ROLE_PRESETS = [
  { value: 'aliado leal', label: 'Aliado leal / Compañero', defaultAffinity: 60 },
  { value: 'hermano / familia', label: 'Hermano / Familia', defaultAffinity: 80 },
  { value: 'rival acerrimo', label: 'Rival acérrimo / Competitivo', defaultAffinity: -15 },
  { value: 'enemigo mortal', label: 'Enemigo mortal / Hostil', defaultAffinity: -70 },
  { value: 'mentor', label: 'Mentor / Maestro', defaultAffinity: 50 },
  { value: 'aprendiz', label: 'Aprendiz / Protegido', defaultAffinity: 55 },
  { value: 'romance secreto', label: 'Romance secreto / Enamorado', defaultAffinity: 85 },
  { value: 'complice', label: 'Cómplice de misiones o crímenes', defaultAffinity: 40 },
  { value: 'sospechoso', label: 'Sospechoso / Vigilancia y recelo', defaultAffinity: -25 },
  { value: 'deuda de honor', label: 'Deuda de vida o honor', defaultAffinity: 45 },
  { value: 'indiferente', label: 'Indiferente / Desconocido', defaultAffinity: 0 },
];

export const CharacterEditorModal: React.FC<CharacterEditorModalProps> = ({
  character,
  otherCharacters = [],
  universes,
  onSave,
  onClose,
  userName,
}) => {
  const [activeTab, setActiveTab] = React.useState<'core' | 'knowledge' | 'speech' | 'relations'>('core');
  const [relationsSubTab, setRelationsSubTab] = React.useState<'user' | 'characters'>('characters');

  const [name, setName] = React.useState(character?.name || '');
  const [tagline, setTagline] = React.useState(character?.tagline || '');
  const [avatar, setAvatar] = React.useState(character?.avatar || AVATAR_PRESETS[0]);
  const [universeId, setUniverseId] = React.useState(character?.universeId || (universes[0]?.id || ''));
  const [greetingMessage, setGreetingMessage] = React.useState(
    character?.greetingMessage || ''
  );
  const [backstory, setBackstory] = React.useState(character?.backstory || '');
  const [personality, setPersonality] = React.useState(character?.personality || '');
  const [speechStyle, setSpeechStyle] = React.useState(character?.speechStyle || '');
  const [personalObjectives, setPersonalObjectives] = React.useState(
    character?.personalObjectives || ''
  );
  const [privateKnowledge, setPrivateKnowledge] = React.useState(
    character?.privateKnowledge || ''
  );
  const [blindSpots, setBlindSpots] = React.useState(character?.blindSpots || '');

  // Relationship with user
  const existingUserRel = character?.relationships?.find((r) => r.targetId === 'user');
  const [initialAffinity, setInitialAffinity] = React.useState(existingUserRel?.affinity ?? 0);
  const [initialStatus, setInitialStatus] = React.useState(existingUserRel?.status || 'indiferente');
  const [initialNotes, setInitialNotes] = React.useState(existingUserRel?.notes || 'No te conoce todavía.');

  // Relationships with other characters from the beginning
  const [interCharRels, setInterCharRels] = React.useState<CharacterRelationship[]>(() => {
    return (character?.relationships || []).filter(
      (r) => r.targetType === 'character' || (r.targetId !== 'user' && r.targetId)
    );
  });
  const [reciprocalFlags, setReciprocalFlags] = React.useState<Record<string, boolean>>(() => {
    const initialFlags: Record<string, boolean> = {};
    for (const other of otherCharacters) {
      initialFlags[other.id] = true; // default enabled for reciprocity
    }
    return initialFlags;
  });

  const availableOtherCharacters = otherCharacters.filter(
    (c) => c.id !== character?.id
  );

  const handleSetCharRelationship = (
    targetChar: Character,
    status: string,
    affinity: number,
    notes: string
  ) => {
    setInterCharRels((prev) => {
      const filtered = prev.filter((r) => r.targetId !== targetChar.id);
      return [
        ...filtered,
        {
          targetId: targetChar.id,
          targetType: 'character',
          targetName: targetChar.name,
          status,
          affinity,
          notes,
          lastUpdated: Date.now(),
        },
      ];
    });
  };

  const handleRemoveCharRelationship = (targetId: string) => {
    setInterCharRels((prev) => prev.filter((r) => r.targetId !== targetId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const charId =
      character?.id || 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const userRel: CharacterRelationship = {
      targetId: 'user',
      targetType: 'user',
      targetName: userName,
      status: initialStatus || 'indiferente',
      affinity: initialAffinity,
      notes: initialNotes || 'Recién conocido.',
      lastUpdated: Date.now(),
    };

    const finalRelationships: CharacterRelationship[] = [userRel, ...interCharRels];

    // Build reciprocal updates for other characters if checked
    const reciprocalUpdates: { targetId: string; relationship: CharacterRelationship }[] = [];
    for (const rel of interCharRels) {
      if (reciprocalFlags[rel.targetId]) {
        reciprocalUpdates.push({
          targetId: rel.targetId,
          relationship: {
            targetId: charId,
            targetType: 'character',
            targetName: name.trim(),
            status: rel.status,
            affinity: rel.affinity,
            notes: rel.notes
              ? `Vínculo recíproco desde el inicio con ${name.trim()}: "${rel.notes}"`
              : `Vínculo recíproco inicial con ${name.trim()} (${rel.status}).`,
            lastUpdated: Date.now(),
          },
        });
      }
    }

    const savedCharacter: Character = {
      id: charId,
      name: name.trim(),
      tagline: tagline.trim(),
      avatar: avatar.trim() || AVATAR_PRESETS[0],
      universeId: universeId || undefined,
      greetingMessage:
        greetingMessage.trim() ||
        `*${name} te observa con detenimiento y asiente en silencio.* "¿En qué puedo ayudarte?"`,
      backstory: backstory.trim(),
      personality: personality.trim(),
      speechStyle: speechStyle.trim(),
      personalObjectives: personalObjectives.trim(),
      privateKnowledge: privateKnowledge.trim(),
      blindSpots: blindSpots.trim(),
      relationships: finalRelationships,
      memories: character?.memories || [],
      createdAt: character?.createdAt || Date.now(),
    };

    onSave(savedCharacter, reciprocalUpdates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#11141d] border border-zinc-800 w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#151926]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {character ? `Editar a ${character.name}` : 'Crear Nuevo Personaje'}
              </h2>
              <p className="text-xs text-zinc-400">
                Personalidad profunda, conocimientos únicos y asimetría
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-[#131722] text-xs font-medium px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'core'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Identidad & Saludo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speech')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'speech'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Personalidad & Habla
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
            <BookOpen className="w-3.5 h-3.5" /> Conocimientos & Puntos Ciegos
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
            <Sparkles className="w-3.5 h-3.5" /> Relación Inicial
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'core' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Nombre del Personaje *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Kaelen Vane"
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Título u Ocupación
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Ej: Ex-mercenario cibernético"
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Universe Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Universo al que pertenece
                </label>
                {universes.length > 0 ? (
                  <select
                    value={universeId}
                    onChange={(e) => setUniverseId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                  >
                    <option value="">(Sin universo asignado - Vagabundo multidimensional)</option>
                    {universes.map((u) => (
                      <option key={u.id} value={u.id}>
                        🌌 {u.name} - {u.tagline || 'Universo'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                    Aún no has creado Universos. Puedes crear uno en la pestaña 🌌 Universos o dejarlo sin universo.
                  </div>
                )}
              </div>

              {/* Avatar Selector from Gallery or Presets */}
              <GalleryImageUploader
                label="Foto de Perfil del Personaje"
                sublabel="Sube una foto desde tu galería o dispositivo"
                value={avatar}
                onChange={(val) => setAvatar(val)}
                aspect="square"
                presets={AVATAR_PRESETS}
                placeholderIcon={<User className="w-8 h-8 text-purple-400" />}
              />

              {/* Greeting Message */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Mensaje Inicial / Enganche de Escena (Greeting)
                </label>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  rows={3}
                  placeholder="Ej: *Te apunta con su arma antes de bajarla lentamente.* '¿Quién te envió aquí?'"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed font-sans"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Usa *asteriscos* para describir acciones corporales, ambientación y miradas.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'speech' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Historia Personal (Backstory)
                </label>
                <textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  rows={4}
                  placeholder="Pasado del personaje, eventos formativos, traumas, deudas pendientes y motivos que lo empujan a seguir adelante..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Personalidad, Conducta y Modales
                </label>
                <textarea
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={3}
                  placeholder="Ej: Desconfiado con extraños, protector con sus amigos, le disgusta la fanfarronería, nunca sonríe por cortesía."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Estilo de Habla y Tono de Voz
                </label>
                <textarea
                  value={speechStyle}
                  onChange={(e) => setSpeechStyle(e.target.value)}
                  rows={3}
                  placeholder="Ej: Voz baja y rasgada, frases directas y concisas. No usa formalismos innecesarios. Hace pausas calculadas."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  Objetivos Personales Actuales
                </label>
                <textarea
                  value={personalObjectives}
                  onChange={(e) => setPersonalObjectives(e.target.value)}
                  rows={2}
                  placeholder="Ej: Encontrar la llave de la cripta; no dejar que nadie descubra su verdadera identidad."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-900/40 p-3 rounded-xl text-xs text-purple-300">
                <span className="font-semibold block mb-1">Principio de Asimetría de Información:</span>
                En NEXUS los personajes NO son omniscientes. Cada uno tiene cosas que sabe y cosas que desconoce.
                Esto evita que inventen cosas mágicamente o sepan secretos que nunca se les contaron.
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Base de Conocimientos Única (Lo que este personaje SABE)
                </label>
                <textarea
                  value={privateKnowledge}
                  onChange={(e) => setPrivateKnowledge(e.target.value)}
                  rows={4}
                  placeholder="Ej: Conoce las rutas de escape del puerto, la fórmula del antídoto y el verdadero nombre del gobernador corrupto."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  Puntos Ciegos (Lo que este personaje DESCONOCE)
                </label>
                <textarea
                  value={blindSpots}
                  onChange={(e) => setBlindSpots(e.target.value)}
                  rows={4}
                  placeholder="Ej: Desconoce que su hermano está vivo; no sabe quién es el usuario en realidad; ignora la traición que se prepara en el palacio."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  El personaje NUNCA asumirá ni revelará esta información a menos que tú u otro personaje se lo cuente en el diálogo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="space-y-4">
              {/* Relations Sub-navigation */}
              <div className="flex bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRelationsSubTab('characters')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    relationsSubTab === 'characters'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Entre Personajes ({interCharRels.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRelationsSubTab('user')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    relationsSubTab === 'user'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Con el Usuario ({userName})</span>
                </button>
              </div>

              {/* Subtab: Inter-Character Relationships */}
              {relationsSubTab === 'characters' && (
                <div className="space-y-3">
                  <div className="bg-purple-950/30 border border-purple-900/50 p-3 rounded-xl text-xs text-purple-200/90 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-white">Relaciones Preexistentes desde el Principio</span>
                      Define si este personaje y sus compañeros ya se conocen: ¿son hermanos, rivales, amantes en secreto, socios o enemigos jurados?
                    </div>
                  </div>

                  {availableOtherCharacters.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-1">
                      <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-300 font-medium">
                        No hay otros personajes disponibles aún
                      </p>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                        Cuando crees más personajes en este o en otros mundos, podrás tejer alianzas, lazos familiares y rivalidades directas entre ellos aquí mismo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {availableOtherCharacters.map((other) => {
                        const existingRel = interCharRels.find((r) => r.targetId === other.id);
                        const isConfigured = Boolean(existingRel);
                        const otherUniverse = universes.find((u) => u.id === other.universeId);

                        return (
                          <div
                            key={other.id}
                            className={`p-3.5 rounded-xl border transition ${
                              isConfigured
                                ? 'bg-[#151926] border-purple-900/60'
                                : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={other.avatar}
                                  alt={other.name}
                                  className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                    <span>{other.name}</span>
                                    {otherUniverse && (
                                      <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40 truncate">
                                        {otherUniverse.name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate">{other.tagline}</p>
                                </div>
                              </div>

                              {!isConfigured ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetCharRelationship(
                                      other,
                                      'aliado leal',
                                      50,
                                      `Se conocen desde hace tiempo en este mundo.`
                                    )
                                  }
                                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-purple-900/60 hover:text-purple-200 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Vincular</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCharRelationship(other.id)}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition shrink-0"
                                  title="Eliminar vínculo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Relationship Form if configured */}
                            {isConfigured && existingRel && (
                              <div className="space-y-2.5 mt-2 pt-2.5 border-t border-zinc-800/80 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[11px] text-zinc-300 font-semibold block mb-1">
                                      Tipo / Rol del Vínculo
                                    </label>
                                    <select
                                      value={existingRel.status}
                                      onChange={(e) => {
                                        const preset = RELATION_ROLE_PRESETS.find((p) => p.value === e.target.value);
                                        handleSetCharRelationship(
                                          other,
                                          e.target.value,
                                          preset ? preset.defaultAffinity : existingRel.affinity,
                                          existingRel.notes
                                        );
                                      }}
                                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500"
                                    >
                                      {RELATION_ROLE_PRESETS.map((preset) => (
                                        <option key={preset.value} value={preset.value}>
                                          {preset.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                                      <span>Afinidad Mutua Inicial:</span>
                                      <span className={`font-bold ${existingRel.affinity >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                                        {existingRel.affinity > 0 ? `+${existingRel.affinity}` : existingRel.affinity}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={existingRel.affinity}
                                      onChange={(e) =>
                                        handleSetCharRelationship(
                                          other,
                                          existingRel.status,
                                          Number(e.target.value),
                                          existingRel.notes
                                        )
                                      }
                                      className="w-full accent-purple-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] text-zinc-300 font-semibold block mb-1">
                                    Pensamientos íntimos / Historia compartida desde el inicio:
                                  </label>
                                  <input
                                    type="text"
                                    value={existingRel.notes}
                                    onChange={(e) =>
                                      handleSetCharRelationship(
                                        other,
                                        existingRel.status,
                                        existingRel.affinity,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Ej: Crecieron juntos en el Distrito 7; sabe que oculta un secreto; le debe la vida...`}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500"
                                  />
                                </div>

                                <label className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={reciprocalFlags[other.id] ?? true}
                                    onChange={(e) =>
                                      setReciprocalFlags((prev) => ({
                                        ...prev,
                                        [other.id]: e.target.checked,
                                      }))
                                    }
                                    className="rounded-sm accent-purple-500"
                                  />
                                  <span>
                                    Establecer relación recíproca automática en <strong className="text-white">{other.name}</strong>
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab: User Relationship */}
              {relationsSubTab === 'user' && (
                <div className="space-y-3">
                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                    Define cómo percibe inicialmente este personaje al usuario ({userName}).
                    Durante el roleplay esta relación cambiará de forma viva y dinámica.
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Estado de Relación Inicial con el Usuario
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500"
                    >
                      <option value="indiferente">Indiferente (Aún no le importas)</option>
                      <option value="desconfiado">Desconfiado (Sospecha de tus intenciones)</option>
                      <option value="amistoso">Amistoso (Cálido y receptivo)</option>
                      <option value="rival">Rival (Competitivo o desafiante)</option>
                      <option value="hostil">Hostil (Abiertamente confrontacional)</option>
                      <option value="leal">Leal / Protector (Discreción y devoción)</option>
                      <option value="intrigado">Intrigado (Siente curiosidad por ti)</option>
                      <option value="romantico">Romántico / Enamorado</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span>Afinidad Inicial (-100 a +100):</span>
                      <span className="font-bold text-purple-400">
                        {initialAffinity > 0 ? `+${initialAffinity}` : initialAffinity}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={initialAffinity}
                      onChange={(e) => setInitialAffinity(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Enemistad profunda (-100)</span>
                      <span>Neutral (0)</span>
                      <span>Devoción total (+100)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Pensamiento o Impresión Inicial hacia el Usuario
                    </label>
                    <input
                      type="text"
                      value={initialNotes}
                      onChange={(e) => setInitialNotes(e.target.value)}
                      placeholder="Ej: Un viajero desconocido que acaba de irrumpir en mi territorio."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-purple-950 disabled:opacity-50"
            >
              {character ? 'Guardar Cambios' : 'Crear Personaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
