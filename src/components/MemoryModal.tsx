import React from 'react';
import { Character, CharacterMemory } from '../types';
import {
  Brain,
  Plus,
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Clock,
  Pin,
  Search,
  Edit3,
  Check,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface MemoryModalProps {
  character: Character;
  onClose: () => void;
  onUpdateMemories: (memories: CharacterMemory[]) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  character,
  onClose,
  onUpdateMemories,
}) => {
  const [memories, setMemories] = React.useState<CharacterMemory[]>(
    character.memories || []
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('todos');

  // Add memory state
  const [isAdding, setIsAdding] = React.useState(false);
  const [newContent, setNewContent] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<'promesa' | 'pelea' | 'revelacion' | 'secreto' | 'hecho'>('hecho');
  const [newImportance, setNewImportance] = React.useState(8);
  const [newPinned, setNewPinned] = React.useState(false);

  // Edit memory state
  const [editingMemId, setEditingMemId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');
  const [editCategory, setEditCategory] = React.useState<'promesa' | 'pelea' | 'revelacion' | 'secreto' | 'hecho'>('hecho');
  const [editImportance, setEditImportance] = React.useState(8);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newMem: CharacterMemory = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      content: newContent.trim(),
      importance: newImportance,
      category: newCategory,
      pinned: newPinned,
    };

    const updated = [newMem, ...memories];
    setMemories(updated);
    onUpdateMemories(updated);
    setNewContent('');
    setIsAdding(false);
    setNewPinned(false);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    onUpdateMemories(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = memories.map((m) =>
      m.id === id ? { ...m, pinned: !m.pinned } : m
    );
    setMemories(updated);
    onUpdateMemories(updated);
  };

  const handleStartEdit = (mem: CharacterMemory) => {
    setEditingMemId(mem.id);
    setEditContent(mem.content);
    setEditCategory(mem.category || 'hecho');
    setEditImportance(mem.importance || 7);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    const updated = memories.map((m) =>
      m.id === id
        ? {
            ...m,
            content: editContent.trim(),
            category: editCategory,
            importance: editImportance,
          }
        : m
    );
    setMemories(updated);
    onUpdateMemories(updated);
    setEditingMemId(null);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'promesa':
        return <span className="bg-amber-950/60 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded-full font-medium">Promesa</span>;
      case 'secreto':
        return <span className="bg-purple-950/60 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded-full font-medium">Secreto</span>;
      case 'pelea':
        return <span className="bg-rose-950/60 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded-full font-medium">Conflicto</span>;
      case 'revelacion':
        return <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800 text-[10px] px-2 py-0.5 rounded-full font-medium">Revelación</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] px-2 py-0.5 rounded-full font-medium">Hecho clave</span>;
    }
  };

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory =
      selectedCategory === 'todos' ||
      (selectedCategory === 'fijados' ? mem.pinned : mem.category === selectedCategory);
    const matchesSearch =
      searchQuery.trim() === '' ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#11141c] border border-zinc-800 w-full max-w-xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-950/70 border border-purple-700/60 flex items-center justify-center text-purple-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Memoria Contextual a Largo Plazo
                </h2>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/60 px-2 py-0.2 rounded-full">
                  Motor de Evocación
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Recuerdos persistentes e independientes de los mensajes de chat de {character.name}
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
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {/* Informative banner about contextual memory resilience */}
          <div className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-xl text-xs text-purple-200/90 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p>
                <strong>Recuperación Dinámica Eficiente:</strong> NEXUS no vuelca historiales infinitos de chat. En cada turno, analiza el contexto inmediato y evoca solo los recuerdos, promesas y secretos relevantes.
              </p>
              <p className="text-purple-300/80 flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Los mensajes del chat son borrables:</strong> Incluso si borras mensajes de la conversación, estos recuerdos permanecen grabados en la mente del personaje.
                </span>
              </p>
            </div>
          </div>

          {/* Search and Category Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar recuerdos por texto o categoría..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-500 hover:text-zinc-300 absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'fijados', label: '📌 Núcleo/Fijados' },
                { id: 'promesa', label: 'Promesas' },
                { id: 'secreto', label: 'Secretos' },
                { id: 'pelea', label: 'Conflictos' },
                { id: 'revelacion', label: 'Revelaciones' },
                { id: 'hecho', label: 'Hechos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition text-[11px] ${
                    selectedCategory === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Recuerdos ({filteredMemories.length} de {memories.length})
            </span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs bg-purple-600/90 hover:bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Grabar Recuerdo
              </button>
            )}
          </div>

          {/* New Memory Form */}
          {isAdding && (
            <form
              onSubmit={handleAddMemory}
              className="bg-[#171b26] border border-purple-500/40 rounded-xl p-3.5 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Grabar Acontecimiento en Memoria Persistente
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Ej: El usuario me juró lealtad y prometió rescatar a mi hermana antes de la luna llena."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-purple-500"
                autoFocus
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Categoría:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg p-1.5 outline-none"
                  >
                    <option value="hecho">Hecho clave</option>
                    <option value="promesa">Promesa</option>
                    <option value="secreto">Secreto</option>
                    <option value="pelea">Conflicto / Pelea</option>
                    <option value="revelacion">Revelación</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">
                    Importancia: {newImportance}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full accent-purple-500 mt-1"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPinned}
                      onChange={(e) => setNewPinned(e.target.checked)}
                      className="rounded accent-purple-500"
                    />
                    <span>Fijar como Núcleo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1.5 text-zinc-400 text-xs hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  Guardar en Memoria
                </button>
              </div>
            </form>
          )}

          {/* Memories List */}
          {filteredMemories.length === 0 ? (
            <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>
                {searchQuery || selectedCategory !== 'todos'
                  ? 'No hay recuerdos que coincidan con los filtros aplicados.'
                  : 'Aún no hay recuerdos episódicos grabados.'}
              </p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Los recuerdos se generan automáticamente en las conversaciones o puedes grabarlos manualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMemories.map((mem) => {
                const isEditingThis = editingMemId === mem.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={mem.id}
                      className="bg-[#171b26] border border-purple-500/60 p-3 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
                        <span>Editando Recuerdo</span>
                        <button
                          onClick={() => setEditingMemId(null)}
                          className="text-zinc-400 hover:text-zinc-200 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-purple-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">Categoría:</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg p-1.5 outline-none"
                          >
                            <option value="hecho">Hecho clave</option>
                            <option value="promesa">Promesa</option>
                            <option value="secreto">Secreto</option>
                            <option value="pelea">Conflicto / Pelea</option>
                            <option value="revelacion">Revelación</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5">
                            Importancia: {editImportance}/10
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={editImportance}
                            onChange={(e) => setEditImportance(Number(e.target.value))}
                            className="w-full accent-purple-500 mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingMemId(null)}
                          className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(mem.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-500 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={mem.id}
                    className={`bg-[#161a25] border p-3 rounded-xl flex items-start justify-between gap-3 group transition ${
                      mem.pinned
                        ? 'border-purple-800/80 bg-purple-950/15'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(mem.category)}
                        {mem.pinned && (
                          <span className="bg-purple-900/60 text-purple-300 border border-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5 fill-purple-300" /> Núcleo
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(mem.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          • Importancia: {mem.importance || 7}/10
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        {mem.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-50 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleTogglePin(mem.id)}
                        className={`p-1 rounded transition ${
                          mem.pinned
                            ? 'text-purple-400 hover:text-purple-300 bg-purple-900/30'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                        }`}
                        title={mem.pinned ? 'Desfijar recuerdo' : 'Fijar como Núcleo (Siempre prioritario)'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${mem.pinned ? 'fill-purple-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleStartEdit(mem)}
                        className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition"
                        title="Editar recuerdo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                        title="Eliminar este recuerdo de la memoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#131722] flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Motor contextual activo • {memories.length} recuerdos salvaguardados</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
