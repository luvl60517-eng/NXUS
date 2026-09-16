import React from 'react';
import { Character, Universe, ChatSession } from '../types';
import { X, MessageSquare, Users, Sparkles, Check } from 'lucide-react';

interface NewChatModalProps {
  characters: Character[];
  universes: Universe[];
  onStartChat: (session: ChatSession) => void;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  characters,
  universes,
  onStartChat,
  onClose,
}) => {
  const [chatType, setChatType] = React.useState<'individual' | 'group'>('individual');
  const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>(
    characters[0]?.id || ''
  );
  const [selectedGroupCharIds, setSelectedGroupCharIds] = React.useState<string[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = React.useState<string>('');
  const [customTitle, setCustomTitle] = React.useState('');
  const [scenarioNotes, setScenarioNotes] = React.useState('');

  const toggleGroupCharacter = (id: string) => {
    if (selectedGroupCharIds.includes(id)) {
      setSelectedGroupCharIds(selectedGroupCharIds.filter((c) => c !== id));
    } else {
      setSelectedGroupCharIds([...selectedGroupCharIds, id]);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();

    if (chatType === 'individual') {
      const char = characters.find((c) => c.id === selectedCharacterId);
      if (!char) return;

      const initialMessage = {
        id: 'msg_' + Date.now(),
        senderId: char.id,
        senderName: char.name,
        senderAvatar: char.avatar,
        text: char.greetingMessage || `*${char.name} te observa con calma.* "¿Qué te trae por aquí?"`,
        timestamp: Date.now(),
      };

      const newSession: ChatSession = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: customTitle.trim() || `Chat con ${char.name}`,
        type: 'individual',
        universeId: char.universeId || selectedUniverseId || undefined,
        characterIds: [char.id],
        messages: [initialMessage],
        scenarioNotes: scenarioNotes.trim(),
        lastActivity: Date.now(),
      };

      onStartChat(newSession);
    } else {
      if (selectedGroupCharIds.length < 2) return;
      const groupChars = characters.filter((c) => selectedGroupCharIds.includes(c.id));
      const charNames = groupChars.map((c) => c.name).join(', ');

      const initialMessage = {
        id: 'msg_' + Date.now(),
        senderId: 'system',
        senderName: 'NEXUS Roleplay',
        text: scenarioNotes.trim()
          ? `*Escenario iniciado: ${scenarioNotes.trim()}. ${charNames} están presentes en la escena.*`
          : `*La escena da comienzo. ${charNames} se encuentran reunidos observándose mutuamente.*`,
        timestamp: Date.now(),
      };

      const newSession: ChatSession = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: customTitle.trim() || `Grupo: ${groupChars.slice(0, 3).map(c => c.name).join(', ')}`,
        type: 'group',
        universeId: selectedUniverseId || groupChars[0]?.universeId,
        characterIds: selectedGroupCharIds,
        messages: [initialMessage],
        scenarioNotes: scenarioNotes.trim(),
        lastActivity: Date.now(),
      };

      onStartChat(newSession);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#11141d] border border-zinc-800 w-full max-w-lg rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#151926]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nueva Conversación</h2>
              <p className="text-xs text-zinc-400">
                Selecciona personajes, universo y escenario
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
        <form onSubmit={handleStart} className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Chat Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setChatType('individual')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                chatType === 'individual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Individual (1 a 1)
            </button>
            <button
              type="button"
              onClick={() => setChatType('group')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                chatType === 'group'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Chat Grupal
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-400 text-xs">
              <p className="mb-2">No tienes personajes creados todavía.</p>
              <p className="text-[11px] text-zinc-500">
                Primero crea al menos un personaje en la pestaña 👥 Personajes para iniciar una conversación.
              </p>
            </div>
          ) : (
            <>
              {/* Individual Selection */}
              {chatType === 'individual' && (
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">
                    Elige el Personaje:
                  </label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {characters.map((char) => {
                      const isSelected = selectedCharacterId === char.id;
                      return (
                        <div
                          key={char.id}
                          onClick={() => setSelectedCharacterId(char.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 text-white'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={char.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{char.name}</div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {char.tagline || 'Personaje creado'}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group Selection */}
              {chatType === 'group' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Selecciona Personajes (Mínimo 2):
                    </label>
                    <span className="text-[11px] text-purple-400 font-medium">
                      {selectedGroupCharIds.length} seleccionados
                    </span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {characters.map((char) => {
                      const isSelected = selectedGroupCharIds.includes(char.id);
                      return (
                        <div
                          key={char.id}
                          onClick={() => toggleGroupCharacter(char.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 text-white'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={char.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{char.name}</div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {char.tagline || 'Personaje'}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? 'bg-purple-500 border-purple-500 text-white'
                                : 'border-zinc-700 bg-zinc-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Scenario notes */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Escenario Inicial / Situación (Opcional)
                </label>
                <textarea
                  value={scenarioNotes}
                  onChange={(e) => setScenarioNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: En un callejón oscuro durante un toque de queda, o en la taberna celebrando una victoria..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-purple-500"
                />
              </div>

              {/* Custom Title */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Título de la conversación (Opcional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Se generará automáticamente si se deja en blanco"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          {/* Footer */}
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
              disabled={
                characters.length === 0 ||
                (chatType === 'individual' && !selectedCharacterId) ||
                (chatType === 'group' && selectedGroupCharIds.length < 2)
              }
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-purple-950 disabled:opacity-50"
            >
              Iniciar Roleplay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
