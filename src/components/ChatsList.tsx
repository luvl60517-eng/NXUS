import React from 'react';
import { ChatSession, Character, Universe } from '../types';
import {
  MessageSquare,
  Plus,
  Trash2,
  Users,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ChatsListProps {
  chats: ChatSession[];
  characters: Character[];
  universes: Universe[];
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onCreateCharacterPrompt: () => void;
}

export const ChatsList: React.FC<ChatsListProps> = ({
  chats,
  characters,
  universes,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onCreateCharacterPrompt,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'individual' | 'group'>('all');

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || chat.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Search and Filter */}
      <div className="p-3 sm:p-4 space-y-3 bg-[#0d1017] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Conversaciones
            </h1>
            <p className="text-xs text-zinc-400">
              Historias activas, chats individuales y grupales
            </p>
          </div>

          <button
            onClick={characters.length > 0 ? onNewChat : onCreateCharacterPrompt}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-purple-950"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Chat</span>
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterType === 'individual'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1 a 1
            </button>
            <button
              onClick={() => setFilterType('group')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterType === 'group'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Grupos
            </button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-sm font-semibold text-zinc-200">
                No hay conversaciones abiertas
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {characters.length === 0
                  ? 'Para empezar a chatear, primero crea un personaje propio con su historia y personalidad.'
                  : 'Inicia un nuevo chat con tus personajes creados para sumergirte en el universo.'}
              </p>
            </div>

            {characters.length === 0 ? (
              <button
                onClick={onCreateCharacterPrompt}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Crear mi primer Personaje
              </button>
            ) : (
              <button
                onClick={onNewChat}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Iniciar Conversación
              </button>
            )}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No se encontraron conversaciones con ese filtro.
          </div>
        ) : (
          filteredChats.map((chat) => {
            const chatChars = characters.filter((c) => chat.characterIds.includes(c.id));
            const primaryChar = chatChars[0];
            const universe = universes.find((u) => u.id === chat.universeId);
            const lastMsg = chat.messages[chat.messages.length - 1];

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className="bg-[#131722] hover:bg-[#181d2b] border border-zinc-800/90 hover:border-zinc-700 p-3 sm:p-3.5 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 group shadow-xs"
              >
                {/* Avatars */}
                <div className="relative shrink-0">
                  {chat.type === 'individual' && primaryChar ? (
                    <img
                      src={primaryChar.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/60"
                    />
                  ) : universe?.image ? (
                    <img
                      src={universe.image}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-600/50 flex items-center justify-center text-purple-300">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  {chat.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-bold rounded-md">
                      {chat.characterIds.length}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition">
                      {chat.title}
                    </h2>
                    <span className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(chat.lastActivity).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {universe && (
                    <div className="text-[10px] text-indigo-400 font-medium">
                      🌌 {universe.name}
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 truncate leading-snug">
                    {lastMsg ? (
                      <>
                        <span className="text-zinc-300 font-medium">
                          {lastMsg.senderName}:{' '}
                        </span>
                        {lastMsg.text.replace(/\*/g, '')}
                      </>
                    ) : (
                      'Sin mensajes aún'
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Eliminar esta conversación?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition opacity-0 group-hover:opacity-100"
                    title="Eliminar chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
