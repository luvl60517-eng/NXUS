import React, { useState, useRef, useEffect } from 'react';
import {
  Character,
  Universe,
  ChatSession,
  Message,
  UserProfile,
  CharacterRelationship,
  CharacterMemory,
} from '../types';
import { ApiService } from '../services/api';
import { RelationshipModal } from './RelationshipModal';
import { MemoryModal } from './MemoryModal';
import { CharacterSheetModal } from './CharacterSheetModal';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  RotateCcw,
  Copy,
  Check,
  Brain,
  Sparkles,
  Users,
  MessageSquare,
  Bot,
  User,
  Heart,
  Shield,
  Swords,
  Zap,
  BookOpen,
  FileText,
} from 'lucide-react';

interface ChatRoomProps {
  session: ChatSession;
  characters: Character[];
  universes: Universe[];
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateSession: (updated: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateCharacter: (updated: Character) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  session,
  characters,
  universes,
  userProfile,
  onBack,
  onUpdateSession,
  onDeleteSession,
  onUpdateCharacter,
}) => {
  const [inputText, setInputText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Modals state
  const [activeRelModalCharId, setActiveRelModalCharId] = useState<string | null>(null);
  const [activeMemModalCharId, setActiveMemModalCharId] = useState<string | null>(null);
  const [activeSheetCharId, setActiveSheetCharId] = useState<string | null>(null);
  const [showFichasDropdown, setShowFichasDropdown] = useState(false);
  const [showLoreDrawer, setShowLoreDrawer] = useState(false);

  // Group chat specific target selector
  const [targetCharacterId, setTargetCharacterId] = useState<string>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve session characters
  const sessionCharacters = characters.filter((c) =>
    session.characterIds.includes(c.id)
  );
  const primaryCharacter = sessionCharacters[0];
  const universe = universes.find((u) => u.id === session.universeId);

  // Primary character's relationship with user
  const userRel = primaryCharacter?.relationships?.find((r) => r.targetId === 'user') || {
    status: 'indiferente',
    affinity: 0,
    notes: 'Aún no os conocéis.',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isResponding]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [inputText]);

  // Send a user message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isResponding) return;

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      senderId: 'user',
      senderName: userProfile.name || 'Tú',
      senderAvatar: userProfile.avatar,
      text: trimmed,
      timestamp: Date.now(),
      targetCharacterId: targetCharacterId !== 'all' ? targetCharacterId : undefined,
    };

    const newMessages = [...session.messages, userMessage];
    const updatedSession = {
      ...session,
      messages: newMessages,
      lastActivity: Date.now(),
    };
    onUpdateSession(updatedSession);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Decide which character responds
    let respondingChar = primaryCharacter;
    if (session.type === 'group') {
      if (targetCharacterId !== 'all') {
        respondingChar =
          sessionCharacters.find((c) => c.id === targetCharacterId) || primaryCharacter;
      } else {
        // Pick character based on conversation flow or randomly
        respondingChar =
          sessionCharacters[Math.floor(Math.random() * sessionCharacters.length)];
      }
    }

    if (!respondingChar) return;

    setIsResponding(true);
    try {
      const result = await ApiService.respondToMessage({
        character: respondingChar,
        universe,
        messages: newMessages,
        otherCharacters: sessionCharacters.filter((c) => c.id !== respondingChar.id),
        isGroupChat: session.type === 'group',
        scenarioNotes: session.scenarioNotes,
        userProfile,
      });

      const recalled = result.retrievedMemories?.map((m) => m.content) || [];
      const loreTitles = result.activatedLore?.map((l) => l.title) || [];

      const botMessage: Message = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderId: respondingChar.id,
        senderName: respondingChar.name,
        senderAvatar: respondingChar.avatar,
        text: result.dialogue,
        timestamp: Date.now(),
        affinityDelta:
          result.affinityChange !== 0
            ? {
                characterId: respondingChar.id,
                delta: result.affinityChange,
                newStatus: result.newStatus,
                reason: result.opinionUpdate,
              }
            : undefined,
        recalledMemories: recalled.length > 0 ? recalled : undefined,
        activatedLoreTitles: loreTitles.length > 0 ? loreTitles : undefined,
      };

      const finalMessages = [...newMessages, botMessage];
      onUpdateSession({
        ...updatedSession,
        messages: finalMessages,
        lastActivity: Date.now(),
      });

      // Update character dynamic relationship & memories if changed
      let charCopy = { ...respondingChar };
      let hasCharUpdates = false;

      if (result.affinityChange !== 0 || result.newStatus || result.opinionUpdate) {
        const existingRels = [...(charCopy.relationships || [])];
        const userRelIdx = existingRels.findIndex((r) => r.targetId === 'user');
        const oldAffinity = userRelIdx >= 0 ? existingRels[userRelIdx].affinity : 0;
        const newAffinity = Math.max(-100, Math.min(100, oldAffinity + result.affinityChange));

        const updatedUserRel: CharacterRelationship = {
          targetId: 'user',
          targetType: 'user',
          targetName: userProfile.name,
          status: result.newStatus || (userRelIdx >= 0 ? existingRels[userRelIdx].status : 'indiferente'),
          affinity: newAffinity,
          notes: result.opinionUpdate || (userRelIdx >= 0 ? existingRels[userRelIdx].notes : ''),
          lastUpdated: Date.now(),
        };

        if (userRelIdx >= 0) {
          existingRels[userRelIdx] = updatedUserRel;
        } else {
          existingRels.push(updatedUserRel);
        }
        charCopy.relationships = existingRels;
        hasCharUpdates = true;
      }

      // If a new episodic memory was extracted
      if (result.newEpisodicMemory) {
        const memContent =
          typeof result.newEpisodicMemory === 'string'
            ? result.newEpisodicMemory
            : result.newEpisodicMemory.content;
        const memImportance =
          typeof result.newEpisodicMemory === 'object' && result.newEpisodicMemory.importance
            ? result.newEpisodicMemory.importance
            : 8;
        const memCategory =
          typeof result.newEpisodicMemory === 'object' && result.newEpisodicMemory.category
            ? result.newEpisodicMemory.category
            : 'hecho';

        if (memContent && memContent.trim()) {
          const newMemory: CharacterMemory = {
            id: 'mem_' + Date.now(),
            timestamp: Date.now(),
            content: memContent.trim(),
            importance: memImportance,
            category: memCategory,
            sourceSessionId: session.id,
          };
          charCopy.memories = [newMemory, ...(charCopy.memories || [])];
          hasCharUpdates = true;
        }
      }

      if (hasCharUpdates) {
        onUpdateCharacter(charCopy);
      }
    } catch (err) {
      console.error('Error al responder mensaje:', err);
    } finally {
      setIsResponding(false);
    }
  };

  // Trigger Autonomous Inter-Character Turn in Group Chat
  const handleAutonomousTurn = async () => {
    if (isResponding || sessionCharacters.length === 0) return;
    setIsResponding(true);

    try {
      if (session.type === 'group') {
        const result = await ApiService.triggerAutonomousTurn({
          characters: sessionCharacters,
          universe,
          messages: session.messages,
          scenarioNotes: session.scenarioNotes,
        });

        const speakingChar =
          sessionCharacters.find((c) => c.id === result.speakingCharacterId) ||
          sessionCharacters[0];

        const autoRecalled = result.retrievedMemories?.map((m) => m.content) || [];

        const autoMessage: Message = {
          id: 'msg_' + Date.now(),
          senderId: speakingChar.id,
          senderName: speakingChar.name,
          senderAvatar: speakingChar.avatar,
          text: result.dialogue,
          timestamp: Date.now(),
          isAutonomous: true,
          recalledMemories: autoRecalled.length > 0 ? autoRecalled : undefined,
        };

        onUpdateSession({
          ...session,
          messages: [...session.messages, autoMessage],
          lastActivity: Date.now(),
        });
      } else {
        // Individual autonomous reaction / topic starter
        const result = await ApiService.respondToMessage({
          character: primaryCharacter,
          universe,
          messages: [
            ...session.messages,
            {
              id: 'sys_' + Date.now(),
              senderId: 'system',
              senderName: 'NEXUS',
              text: '*El silencio se prolonga. El personaje toma la iniciativa autónoma y reacciona espontáneamente al entorno o al usuario.*',
              timestamp: Date.now(),
            },
          ],
          otherCharacters: [],
          isGroupChat: false,
          scenarioNotes: session.scenarioNotes,
          userProfile,
        });

        const autoRecalled = result.retrievedMemories?.map((m) => m.content) || [];
        const loreTitles = result.activatedLore?.map((l) => l.title) || [];

        const autoMessage: Message = {
          id: 'msg_' + Date.now(),
          senderId: primaryCharacter.id,
          senderName: primaryCharacter.name,
          senderAvatar: primaryCharacter.avatar,
          text: result.dialogue,
          timestamp: Date.now(),
          isAutonomous: true,
          recalledMemories: autoRecalled.length > 0 ? autoRecalled : undefined,
          activatedLoreTitles: loreTitles.length > 0 ? loreTitles : undefined,
        };

        onUpdateSession({
          ...session,
          messages: [...session.messages, autoMessage],
          lastActivity: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error en turno autónomo:', err);
    } finally {
      setIsResponding(false);
    }
  };

  // Specific character trigger
  const handleTriggerCharacter = async (char: Character) => {
    if (isResponding) return;
    setIsResponding(true);

    try {
      const result = await ApiService.respondToMessage({
        character: char,
        universe,
        messages: session.messages,
        otherCharacters: sessionCharacters.filter((c) => c.id !== char.id),
        isGroupChat: session.type === 'group',
        scenarioNotes: session.scenarioNotes,
        userProfile,
      });

      const recalled = result.retrievedMemories?.map((m) => m.content) || [];
      const loreTitles = result.activatedLore?.map((l) => l.title) || [];

      const message: Message = {
        id: 'msg_' + Date.now(),
        senderId: char.id,
        senderName: char.name,
        senderAvatar: char.avatar,
        text: result.dialogue,
        timestamp: Date.now(),
        affinityDelta:
          result.affinityChange !== 0
            ? {
                characterId: char.id,
                delta: result.affinityChange,
                newStatus: result.newStatus,
                reason: result.opinionUpdate,
              }
            : undefined,
        recalledMemories: recalled.length > 0 ? recalled : undefined,
        activatedLoreTitles: loreTitles.length > 0 ? loreTitles : undefined,
      };

      onUpdateSession({
        ...session,
        messages: [...session.messages, message],
        lastActivity: Date.now(),
      });

      // Save memory if extracted
      if (result.newEpisodicMemory) {
        const memContent =
          typeof result.newEpisodicMemory === 'string'
            ? result.newEpisodicMemory
            : result.newEpisodicMemory.content;
        if (memContent && memContent.trim()) {
          const newMem: CharacterMemory = {
            id: 'mem_' + Date.now(),
            timestamp: Date.now(),
            content: memContent.trim(),
            importance: typeof result.newEpisodicMemory === 'object' ? result.newEpisodicMemory.importance || 8 : 8,
            category: typeof result.newEpisodicMemory === 'object' ? result.newEpisodicMemory.category || 'hecho' : 'hecho',
            sourceSessionId: session.id,
          };
          onUpdateCharacter({
            ...char,
            memories: [newMem, ...(char.memories || [])],
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResponding(false);
    }
  };

  // Delete an individual message (bot or user - explicitly requested)
  const handleDeleteMessage = (msgId: string) => {
    const filtered = session.messages.filter((m) => m.id !== msgId);
    onUpdateSession({
      ...session,
      messages: filtered,
    });
    setDeleteNotice('Mensaje eliminado del chat. Los recuerdos persistentes y afinidad del personaje se mantienen intactos.');
    setTimeout(() => {
      setDeleteNotice(null);
    }, 4000);
  };

  // Save edit of a message
  const handleSaveEditMessage = (msgId: string) => {
    if (!editText.trim()) return;
    const updated = session.messages.map((m) =>
      m.id === msgId ? { ...m, text: editText.trim() } : m
    );
    onUpdateSession({
      ...session,
      messages: updated,
    });
    setEditingMessageId(null);
  };

  // Regenerate bot response
  const handleRegenerateMessage = async (index: number) => {
    if (isResponding) return;
    // Strip messages from this index onwards
    const previousMessages = session.messages.slice(0, index);
    const targetMsg = session.messages[index];
    const respondingChar =
      sessionCharacters.find((c) => c.id === targetMsg.senderId) || primaryCharacter;

    if (!respondingChar) return;

    setIsResponding(true);
    try {
      const result = await ApiService.respondToMessage({
        character: respondingChar,
        universe,
        messages: previousMessages,
        otherCharacters: sessionCharacters.filter((c) => c.id !== respondingChar.id),
        isGroupChat: session.type === 'group',
        scenarioNotes: session.scenarioNotes,
        userProfile,
      });

      const recalled = result.retrievedMemories?.map((m) => m.content) || [];
      const loreTitles = result.activatedLore?.map((l) => l.title) || [];

      const newMsg: Message = {
        id: 'msg_' + Date.now(),
        senderId: respondingChar.id,
        senderName: respondingChar.name,
        senderAvatar: respondingChar.avatar,
        text: result.dialogue,
        timestamp: Date.now(),
        affinityDelta:
          result.affinityChange !== 0
            ? {
                characterId: respondingChar.id,
                delta: result.affinityChange,
                newStatus: result.newStatus,
                reason: result.opinionUpdate,
              }
            : undefined,
        recalledMemories: recalled.length > 0 ? recalled : undefined,
        activatedLoreTitles: loreTitles.length > 0 ? loreTitles : undefined,
      };

      onUpdateSession({
        ...session,
        messages: [...previousMessages, newMsg],
        lastActivity: Date.now(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsResponding(false);
    }
  };

  // Clear chat
  const handleClearMessages = () => {
    if (window.confirm('¿Seguro que deseas vaciar todos los mensajes de esta conversación?')) {
      onUpdateSession({
        ...session,
        messages: [],
      });
      setShowOptions(false);
    }
  };

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Insert markdown asterisks for actions
  const handleInsertAsterisks = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = inputText;
    if (start !== end) {
      const selected = current.substring(start, end);
      const replacement = `*${selected}*`;
      setInputText(current.substring(0, start) + replacement + current.substring(end));
    } else {
      const replacement = `**`;
      setInputText(current.substring(0, start) + replacement + current.substring(end));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + 1, start + 1);
        }
      }, 50);
    }
  };

  // Render roleplay formatted message
  const renderFormattedText = (text: string) => {
    // Split text by *actions*
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const cleanAction = part.slice(1, -1);
        return (
          <span
            key={index}
            className="italic text-zinc-400 font-serif my-0.5 inline-block"
          >
            *{cleanAction}*
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getAffinityBadge = (affinity: number, status: string) => {
    let color = 'bg-zinc-800 text-zinc-300 border-zinc-700';
    if (affinity >= 30) color = 'bg-emerald-950/60 text-emerald-300 border-emerald-700';
    else if (affinity <= -20) color = 'bg-rose-950/60 text-rose-300 border-rose-700';

    return (
      <span
        className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1 ${color}`}
      >
        <Heart className="w-3 h-3" />
        {status} ({affinity > 0 ? `+${affinity}` : affinity})
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-[#eceef4] relative overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 px-3 sm:px-4 border-b border-zinc-800/80 bg-[#10131b]/95 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Character(s) Info */}
          {session.type === 'individual' && primaryCharacter ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                onClick={() => setActiveRelModalCharId(primaryCharacter.id)}
                className="relative cursor-pointer group"
                title="Ver estado de relación"
              >
                <img
                  src={primaryCharacter.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border-2 border-purple-500/70 group-hover:border-purple-400 transition"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#10131b]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
                    {primaryCharacter.name}
                  </h1>
                  <button
                    onClick={() => setActiveRelModalCharId(primaryCharacter.id)}
                    className="cursor-pointer hover:opacity-80 transition"
                  >
                    {getAffinityBadge(userRel.affinity, userRel.status)}
                  </button>
                </div>
                <div className="text-[11px] text-zinc-400 truncate max-w-[160px] sm:max-w-[240px]">
                  {universe ? `🌌 ${universe.name}` : primaryCharacter.tagline || 'Roleplay'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              {universe?.image ? (
                <img
                  src={universe.image}
                  alt={universe.name}
                  className="w-9 h-9 rounded-xl object-cover border border-indigo-500/60 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/60 flex items-center justify-center text-purple-300 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate max-w-[180px]">
                  {session.title}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {universe ? `🌌 ${universe.name} • ` : ''}{sessionCharacters.length} personajes presentes
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {session.type === 'group' ? (
            <div className="relative">
              <button
                onClick={() => setShowFichasDropdown(!showFichasDropdown)}
                className="p-2 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 rounded-xl transition flex items-center gap-1 text-xs"
                title="Ver las fichas de los personajes del grupo"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline text-[11px] font-medium">
                  Fichas ({sessionCharacters.length})
                </span>
              </button>

              {showFichasDropdown && (
                <div className="absolute right-0 top-11 w-56 bg-[#141824] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Fichas en este Mundo
                  </div>
                  {sessionCharacters.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setActiveSheetCharId(char.id);
                        setShowFichasDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-zinc-800/90 rounded-lg flex items-center gap-2 text-zinc-200 transition"
                    >
                      <img src={char.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{char.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {char.tagline || 'Ver ficha completa'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            primaryCharacter && (
              <button
                onClick={() => setActiveSheetCharId(primaryCharacter.id)}
                className="p-2 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 rounded-xl transition flex items-center gap-1 text-xs"
                title="Ver ficha completa de este personaje"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Ficha</span>
              </button>
            )
          )}

          {primaryCharacter && (
            <>
              {/* Memory quick inspect */}
              <button
                onClick={() => setActiveMemModalCharId(primaryCharacter.id)}
                className="p-2 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 rounded-xl transition flex items-center gap-1 text-xs"
                title="Memoria contextual del personaje"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline text-[11px] font-medium">
                  Memoria ({primaryCharacter.memories?.length || 0})
                </span>
              </button>

              {/* Relationship engine quick button */}
              <button
                onClick={() => setActiveRelModalCharId(primaryCharacter.id)}
                className="p-2 text-zinc-400 hover:text-pink-300 hover:bg-zinc-800 rounded-xl transition flex items-center gap-1 text-xs"
                title="Motor de relaciones dinámicas"
              >
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Relación</span>
              </button>
            </>
          )}

          {universe && (
            <button
              onClick={() => setShowLoreDrawer(!showLoreDrawer)}
              className="p-2 text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 rounded-xl transition"
              title="Lorebook del universo"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptions && (
              <div className="absolute right-0 top-11 w-48 bg-[#141824] border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 text-xs">
                <button
                  onClick={handleClearMessages}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Vaciar mensajes
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Eliminar esta conversación por completo?')) {
                      onDeleteSession(session.id);
                      onBack();
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Group Chat Character Strip & Autonomy Button */}
      {session.type === 'group' && (
        <div className="px-3 py-2 bg-[#121622]/95 border-b border-zinc-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mr-1">
              Hablar con:
            </span>
            <button
              onClick={() => setTargetCharacterId('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                targetCharacterId === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>
            {sessionCharacters.map((char) => (
              <button
                key={char.id}
                onClick={() => setTargetCharacterId(char.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                  targetCharacterId === char.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <img src={char.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                {char.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleAutonomousTurn}
            disabled={isResponding}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition disabled:opacity-50 shadow-xs"
            title="Los personajes interactuarán, debatirán o bromearán entre sí"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Autonomía</span>
          </button>
        </div>
      )}

      {/* Universe Lore Quick Drawer (collapsible) */}
      {showLoreDrawer && universe && (
        <div className="bg-[#141825] border-b border-zinc-800 p-3 text-xs space-y-2 max-h-48 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Lorebook: {universe.name}
            </span>
            <button
              onClick={() => setShowLoreDrawer(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            {universe.description || 'Sin descripción general.'}
          </p>
          {universe.rules && (
            <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg">
              <strong className="text-zinc-300">Reglas del mundo:</strong> {universe.rules}
            </div>
          )}
          {universe.lore && universe.lore.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">
                Entradas registradas:
              </span>
              {universe.lore.map((l) => (
                <div key={l.id} className="text-[11px] text-zinc-300">
                  • <strong className="text-indigo-200">{l.title}:</strong> {l.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {deleteNotice && (
          <div className="bg-purple-950/90 border border-purple-500/60 text-purple-200 text-xs px-3.5 py-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2 transition-all">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{deleteNotice}</span>
            </div>
            <button
              onClick={() => setDeleteNotice(null)}
              className="text-purple-400 hover:text-purple-200 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {session.scenarioNotes && (
          <div className="mx-auto max-w-lg bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5">
              Escenario Actual
            </span>
            {session.scenarioNotes}
          </div>
        )}

        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium text-zinc-300">Conversación limpia</p>
            <p className="text-xs mt-1 max-w-xs text-zinc-400">
              Puedes borrar o vaciar los mensajes del chat en cualquier momento. La memoria contextual y conocimientos acumulados del personaje seguirán guiando sus respuestas.
            </p>
          </div>
        ) : (
          session.messages.map((msg, index) => {
            const isUser = msg.senderId === 'user';
            const isEditing = editingMessageId === msg.id;
            const senderChar = sessionCharacters.find((c) => c.id === msg.senderId);

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                } transition-all`}
              >
                {/* Sender Name & Tag */}
                <div className="flex items-center gap-1.5 px-2 mb-1 text-[11px] text-zinc-400">
                  {!isUser && (
                    <img
                      src={msg.senderAvatar || senderChar?.avatar}
                      alt=""
                      onClick={() => senderChar && setActiveSheetCharId(senderChar.id)}
                      className={`w-4 h-4 rounded-full object-cover ${
                        senderChar ? 'cursor-pointer hover:ring-2 hover:ring-purple-400 transition' : ''
                      }`}
                      title={senderChar ? `Ver ficha de ${senderChar.name}` : undefined}
                    />
                  )}
                  <span
                    onClick={() => senderChar && setActiveSheetCharId(senderChar.id)}
                    className={`font-semibold text-zinc-300 ${
                      senderChar ? 'cursor-pointer hover:text-purple-300 transition' : ''
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  {msg.isAutonomous && (
                    <span className="text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded-full font-medium">
                      Autónomo
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Bubble Container */}
                <div className="relative max-w-[90%] sm:max-w-[80%]">
                  {!isEditing ? (
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-purple-700 text-white rounded-tr-none'
                          : 'bg-[#151924] border border-zinc-800 text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Affinity Delta Badge */}
                      {msg.affinityDelta && (
                        <div className="mt-2 pt-2 border-t border-zinc-700/50 flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                          <span>
                            Afinidad {msg.affinityDelta.delta > 0 ? `+${msg.affinityDelta.delta}` : msg.affinityDelta.delta}
                            {msg.affinityDelta.newStatus && ` (${msg.affinityDelta.newStatus})`}
                          </span>
                          {msg.affinityDelta.reason && (
                            <span className="text-zinc-400 font-normal italic">
                              • {msg.affinityDelta.reason}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Recalled Memories and Activated Lore */}
                      {((msg.recalledMemories && msg.recalledMemories.length > 0) ||
                        (msg.activatedLoreTitles && msg.activatedLoreTitles.length > 0)) && (
                        <div className="mt-2 pt-2 border-t border-zinc-700/40 flex flex-wrap items-center gap-1.5 text-[10px]">
                          {msg.recalledMemories && msg.recalledMemories.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-700/50"
                              title={msg.recalledMemories.join(' • ')}
                            >
                              <Brain className="w-3 h-3 text-purple-400 shrink-0" />
                              {msg.recalledMemories.length}{' '}
                              {msg.recalledMemories.length === 1 ? 'recuerdo evocado' : 'recuerdos evocados'}
                            </span>
                          )}
                          {msg.activatedLoreTitles && msg.activatedLoreTitles.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-700/50"
                              title={msg.activatedLoreTitles.join(', ')}
                            >
                              <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                              Lore: {msg.activatedLoreTitles.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit Form */
                    <div className="bg-[#181d2a] border border-purple-500 rounded-xl p-3 min-w-[260px] space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-900 text-white text-xs p-2 rounded-lg outline-none border border-zinc-700"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEditMessage(msg.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-medium"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hover Action Bar (Edit, Delete, Regenerate, Copy) */}
                  {!isEditing && (
                    <div
                      className={`flex items-center gap-1 mt-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800/80 transition"
                        title="Copiar texto"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditText(msg.text);
                        }}
                        className="p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-800/80 transition"
                        title="Editar mensaje"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {!isUser && (
                        <button
                          onClick={() => handleRegenerateMessage(index)}
                          className="p-1 text-zinc-500 hover:text-purple-300 rounded hover:bg-zinc-800/80 transition"
                          title="Regenerar respuesta"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete individual message - explicitly requested */}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-rose-950/40 transition"
                        title="Eliminar este mensaje"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isResponding && (
          <div className="flex items-center gap-2 p-2 text-zinc-400 text-xs animate-pulse">
            <img
              src={primaryCharacter?.avatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="font-serif italic">
              {primaryCharacter?.name || 'El personaje'} está escribiendo y evaluando la escena...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 sm:p-3 bg-[#10131c] border-t border-zinc-800/80 shrink-0">
        {/* Quick action bar above textarea */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertAsterisks}
              className="px-2 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700 flex items-center gap-1 transition"
              title="Insertar asteriscos para narrar una acción (*acción*)"
            >
              <span>*acción*</span>
            </button>

            {session.type === 'individual' && (
              <button
                type="button"
                onClick={handleAutonomousTurn}
                disabled={isResponding}
                className="px-2 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-purple-300 text-[11px] border border-purple-900/50 flex items-center gap-1 transition"
                title="Hacer que el personaje tome la iniciativa y hable de forma espontánea"
              >
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Iniciativa</span>
              </button>
            )}
          </div>

          <span className="text-[10px] text-zinc-500">
            Usa *asteriscos* para gestos o acciones
          </span>
        </div>

        {/* Text Input & Send */}
        <div className="flex items-end gap-2 bg-[#161a25] border border-zinc-700/80 focus-within:border-purple-500 rounded-2xl p-1.5 transition shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              session.type === 'group'
                ? targetCharacterId === 'all'
                  ? 'Habla al grupo o narra una acción...'
                  : `Dirigiéndote a ${
                      sessionCharacters.find((c) => c.id === targetCharacterId)?.name || 'personaje'
                    }...`
                : `Habla o narra con ${primaryCharacter?.name || 'el personaje'}...`
            }
            className="flex-1 bg-transparent text-white text-xs sm:text-sm px-2.5 py-1.5 outline-none resize-none max-h-36 placeholder:text-zinc-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isResponding}
            className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-purple-600 shadow-md shadow-purple-950 shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Relationship Modal */}
      {activeRelModalCharId && (
        <RelationshipModal
          character={characters.find((c) => c.id === activeRelModalCharId) || primaryCharacter}
          userName={userProfile.name}
          otherCharacters={characters.filter((c) => c.id !== activeRelModalCharId)}
          onClose={() => setActiveRelModalCharId(null)}
          onUpdateRelationships={(updated) => {
            const char = characters.find((c) => c.id === activeRelModalCharId);
            if (char) {
              onUpdateCharacter({
                ...char,
                relationships: updated,
              });
            }
          }}
        />
      )}

      {/* Memory Modal */}
      {activeMemModalCharId && (
        <MemoryModal
          character={characters.find((c) => c.id === activeMemModalCharId) || primaryCharacter}
          onClose={() => setActiveMemModalCharId(null)}
          onUpdateMemories={(updated) => {
            const char = characters.find((c) => c.id === activeMemModalCharId);
            if (char) {
              onUpdateCharacter({
                ...char,
                memories: updated,
              });
            }
          }}
        />
      )}

      {/* Character Sheet Modal */}
      {activeSheetCharId && (() => {
        const sheetChar = characters.find((c) => c.id === activeSheetCharId);
        if (!sheetChar) return null;
        return (
          <CharacterSheetModal
            character={sheetChar}
            universe={universes.find((u) => u.id === sheetChar.universeId)}
            userProfile={userProfile}
            onClose={() => setActiveSheetCharId(null)}
          />
        );
      })()}
    </div>
  );
};
