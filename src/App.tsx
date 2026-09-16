/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Character,
  CharacterRelationship,
  Universe,
  ChatSession,
  UserProfile,
} from './types';
import { StorageService } from './services/storage';
import { ChatsList } from './components/ChatsList';
import { CharactersList } from './components/CharactersList';
import { UniversesList } from './components/UniversesList';
import { SettingsView } from './components/SettingsView';
import { ChatRoom } from './components/ChatRoom';
import { CharacterEditorModal } from './components/CharacterEditorModal';
import { UniverseEditorModal } from './components/UniverseEditorModal';
import { NewChatModal } from './components/NewChatModal';
import { SelectWorldModal } from './components/SelectWorldModal';
import {
  MessageSquare,
  Users,
  Globe,
  Settings,
  Smartphone,
  Maximize2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(
    StorageService.getUserProfile()
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'chats' | 'characters' | 'universes' | 'settings'>('chats');

  // Active chat session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Modals
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const [universeModalOpen, setUniverseModalOpen] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [selectWorldModalOpen, setSelectWorldModalOpen] = useState(false);
  const [selectedGroupCharacters, setSelectedGroupCharacters] = useState<Character[]>([]);

  // Mobile frame simulator on desktop
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Load initial data from localStorage
  const loadData = () => {
    setUniverses(StorageService.getUniverses());
    setCharacters(StorageService.getCharacters());
    setChats(StorageService.getChats());
    setUserProfile(StorageService.getUserProfile());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save changes to storage
  const handleUpdateCharacters = (updatedList: Character[]) => {
    setCharacters(updatedList);
    StorageService.saveCharacters(updatedList);
  };

  const handleUpdateUniverses = (updatedList: Universe[]) => {
    setUniverses(updatedList);
    StorageService.saveUniverses(updatedList);
  };

  const handleUpdateChats = (updatedList: ChatSession[]) => {
    setChats(updatedList);
    StorageService.saveChats(updatedList);
  };

  const handleSaveCharacter = (
    char: Character,
    reciprocalUpdates?: { targetId: string; relationship: CharacterRelationship }[]
  ) => {
    const exists = characters.some((c) => c.id === char.id);
    let updated: Character[];
    if (exists) {
      updated = characters.map((c) => (c.id === char.id ? char : c));
    } else {
      updated = [char, ...characters];
    }

    // Apply reciprocal relationship updates to other characters if requested
    if (reciprocalUpdates && reciprocalUpdates.length > 0) {
      updated = updated.map((c) => {
        const update = reciprocalUpdates.find((u) => u.targetId === c.id);
        if (update) {
          const filtered = (c.relationships || []).filter(
            (r) => r.targetId !== update.relationship.targetId
          );
          return {
            ...c,
            relationships: [...filtered, update.relationship],
          };
        }
        return c;
      });
    }

    handleUpdateCharacters(updated);
    setCharacterModalOpen(false);
    setEditingCharacter(null);
  };

  const handleDeleteCharacter = (charId: string) => {
    const updated = characters.filter((c) => c.id !== charId);
    handleUpdateCharacters(updated);
  };

  const handleSaveUniverse = (univ: Universe) => {
    const exists = universes.some((u) => u.id === univ.id);
    let updated: Universe[];
    if (exists) {
      updated = universes.map((u) => (u.id === univ.id ? univ : u));
    } else {
      updated = [univ, ...universes];
    }
    handleUpdateUniverses(updated);
    setUniverseModalOpen(false);
    setEditingUniverse(null);
  };

  const handleDeleteUniverse = (univId: string) => {
    const updated = universes.filter((u) => u.id !== univId);
    handleUpdateUniverses(updated);
  };

  const handleStartChatWithCharacter = (char: Character) => {
    // Check if an individual chat already exists for this character
    const existing = chats.find(
      (c) => c.type === 'individual' && c.characterIds.includes(char.id)
    );

    if (existing) {
      setActiveSessionId(existing.id);
    } else {
      const newChat: ChatSession = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: `Chat con ${char.name}`,
        type: 'individual',
        universeId: char.universeId,
        characterIds: [char.id],
        messages: [
          {
            id: 'msg_' + Date.now(),
            senderId: char.id,
            senderName: char.name,
            senderAvatar: char.avatar,
            text:
              char.greetingMessage ||
              `*${char.name} te observa con serenidad.* "¿En qué puedo ayudarte hoy?"`,
            timestamp: Date.now(),
          },
        ],
        lastActivity: Date.now(),
      };
      const updatedChats = [newChat, ...chats];
      handleUpdateChats(updatedChats);
      setActiveSessionId(newChat.id);
    }
  };

  const handleStartWorldAdventure = (selectedChars: Character[]) => {
    if (selectedChars.length === 0) return;
    setSelectedGroupCharacters(selectedChars);
    setSelectWorldModalOpen(true);
  };

  const handleSelectWorldConfirm = (universe: Universe, scenarioNotes?: string) => {
    const chars = selectedGroupCharacters;
    if (chars.length === 0) return;

    const charNames = chars.map((c) => c.name).join(', ');
    const isMulti = chars.length > 1;

    const initialText = scenarioNotes?.trim()
      ? `*Escenario en ${universe.name}: ${scenarioNotes.trim()}. ${charNames} están presentes en la escena.*`
      : isMulti
      ? `*${charNames} se encuentran ahora en ${universe.name}. ${universe.tagline ? universe.tagline + '.' : ''} El entorno cobra vida y las leyes del mundo comienzan a influir en sus decisiones.*`
      : chars[0].greetingMessage || `*${chars[0].name} aparece en ${universe.name}.* "¿Qué te trae por aquí?"`;

    const initialMessage = {
      id: 'msg_' + Date.now(),
      senderId: isMulti ? 'system' : chars[0].id,
      senderName: isMulti ? 'NEXUS Roleplay' : chars[0].name,
      senderAvatar: isMulti ? undefined : chars[0].avatar,
      text: initialText,
      timestamp: Date.now(),
    };

    const newChat: ChatSession = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: isMulti
        ? `${chars.slice(0, 3).map((c) => c.name).join(', ')} en ${universe.name}`
        : `Chat con ${chars[0].name} en ${universe.name}`,
      type: isMulti ? 'group' : 'individual',
      universeId: universe.id,
      characterIds: chars.map((c) => c.id),
      messages: [initialMessage],
      scenarioNotes: scenarioNotes?.trim(),
      lastActivity: Date.now(),
    };

    const updatedChats = [newChat, ...chats];
    handleUpdateChats(updatedChats);
    setSelectWorldModalOpen(false);
    setSelectedGroupCharacters([]);
    setActiveSessionId(newChat.id);
  };

  const handleStartChatInUniverse = (univ: Universe) => {
    const univChars = characters.filter((c) => c.universeId === univ.id);
    const charsToChoose = univChars.length > 0 ? univChars : characters;
    if (charsToChoose.length === 0) {
      // Prompt user to create character for this universe
      setEditingCharacter({
        id: '',
        universeId: univ.id,
        name: '',
        avatar: '',
        tagline: '',
        backstory: '',
        personality: '',
        speechStyle: '',
        personalObjectives: '',
        privateKnowledge: '',
        blindSpots: '',
        greetingMessage: '',
        relationships: [],
        memories: [],
        createdAt: Date.now(),
      });
      setCharacterModalOpen(true);
    } else {
      setSelectedGroupCharacters(charsToChoose);
      setSelectWorldModalOpen(true);
    }
  };

  const activeChat = chats.find((c) => c.id === activeSessionId);

  return (
    <div className="min-h-screen bg-[#07080c] text-[#eceef4] flex items-center justify-center select-none antialiased">
      {/* Container - Adaptive Mobile First */}
      <div
        className={`w-full h-screen flex flex-col bg-[#0a0c10] overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-md h-[92vh] max-h-[860px] rounded-3xl border-4 border-zinc-800 shadow-2xl relative my-auto'
            : 'max-w-xl sm:max-w-2xl md:max-w-4xl h-screen'
        }`}
      >
        {/* Desktop Viewport Toolbar (Hidden on small mobile screens) */}
        <div className="hidden md:flex items-center justify-between px-4 py-1.5 bg-[#0e111a] border-b border-zinc-800/80 text-[11px] text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-purple-400">NEXUS</span>
            <span className="text-zinc-600">|</span>
            <span>Experiencia Nativa Móvil (Android / iOS)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 transition"
              title="Alternar entre marco móvil y pantalla completa"
            >
              {isPhoneFrame ? (
                <>
                  <Maximize2 className="w-3 h-3" /> Pantalla Completa
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3" /> Marco Móvil
                </>
              )}
            </button>
          </div>
        </div>

        {/* If Active Chat is Open, render full-screen Chat Room */}
        {activeChat ? (
          <ChatRoom
            session={activeChat}
            characters={characters}
            universes={universes}
            userProfile={userProfile}
            onBack={() => setActiveSessionId(null)}
            onUpdateSession={(updated) => {
              const updatedChats = chats.map((c) =>
                c.id === updated.id ? updated : c
              );
              handleUpdateChats(updatedChats);
            }}
            onDeleteSession={(sessionId) => {
              const updatedChats = chats.filter((c) => c.id !== sessionId);
              handleUpdateChats(updatedChats);
              setActiveSessionId(null);
            }}
            onUpdateCharacter={(updatedChar) => {
              const updatedList = characters.map((c) =>
                c.id === updatedChar.id ? updatedChar : c
              );
              handleUpdateCharacters(updatedList);
            }}
          />
        ) : (
          /* Main Tabbed App Interface */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Brand Header */}
            <header className="h-14 px-4 bg-[#10131c]/95 border-b border-zinc-800/80 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-950">
                  N
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-widest text-white uppercase">
                    NEXUS
                  </h1>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Universos, Roleplay & Autonomía
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium">{userProfile.name}</span>
                </div>
              </div>
            </header>

            {/* Active Tab Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'chats' && (
                <ChatsList
                  chats={chats}
                  characters={characters}
                  universes={universes}
                  onSelectChat={(chat) => setActiveSessionId(chat.id)}
                  onNewChat={() => setNewChatModalOpen(true)}
                  onDeleteChat={(id) => {
                    handleUpdateChats(chats.filter((c) => c.id !== id));
                  }}
                  onCreateCharacterPrompt={() => {
                    setEditingCharacter(null);
                    setCharacterModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'characters' && (
                <CharactersList
                  characters={characters}
                  universes={universes}
                  userProfile={userProfile}
                  onCreateCharacter={() => {
                    setEditingCharacter(null);
                    setCharacterModalOpen(true);
                  }}
                  onEditCharacter={(char) => {
                    setEditingCharacter(char);
                    setCharacterModalOpen(true);
                  }}
                  onDeleteCharacter={handleDeleteCharacter}
                  onStartChatWithCharacter={handleStartChatWithCharacter}
                  onStartWorldAdventure={handleStartWorldAdventure}
                  onUpdateCharacter={(char) => {
                    const updated = characters.map((c) =>
                      c.id === char.id ? char : c
                    );
                    handleUpdateCharacters(updated);
                  }}
                />
              )}

              {activeTab === 'universes' && (
                <UniversesList
                  universes={universes}
                  characters={characters}
                  onCreateUniverse={() => {
                    setEditingUniverse(null);
                    setUniverseModalOpen(true);
                  }}
                  onEditUniverse={(univ) => {
                    setEditingUniverse(univ);
                    setUniverseModalOpen(true);
                  }}
                  onDeleteUniverse={handleDeleteUniverse}
                  onStartChatInUniverse={handleStartChatInUniverse}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  userProfile={userProfile}
                  onUpdateUserProfile={(up) => {
                    setUserProfile(up);
                    StorageService.saveUserProfile(up);
                  }}
                  onRefreshAllData={loadData}
                />
              )}
            </main>

            {/* Bottom Mobile Navigation Bar */}
            <nav className="h-16 bg-[#0f121a] border-t border-zinc-800/80 px-2 flex items-center justify-around shrink-0 z-10">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  activeTab === 'chats'
                    ? 'text-purple-400 font-semibold scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {chats.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1">Chats</span>
              </button>

              <button
                onClick={() => setActiveTab('characters')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  activeTab === 'characters'
                    ? 'text-purple-400 font-semibold scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] mt-1">Personajes</span>
              </button>

              <button
                onClick={() => setActiveTab('universes')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  activeTab === 'universes'
                    ? 'text-indigo-400 font-semibold scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="text-[10px] mt-1">Universos</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                  activeTab === 'settings'
                    ? 'text-purple-400 font-semibold scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] mt-1">Ajustes</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Character Creation / Editing Modal */}
      {characterModalOpen && (
        <CharacterEditorModal
          character={editingCharacter}
          otherCharacters={characters.filter((c) => c.id !== editingCharacter?.id)}
          universes={universes}
          userName={userProfile.name}
          onSave={handleSaveCharacter}
          onClose={() => {
            setCharacterModalOpen(false);
            setEditingCharacter(null);
          }}
        />
      )}

      {/* Universe Creation / Editing Modal */}
      {universeModalOpen && (
        <UniverseEditorModal
          universe={editingUniverse}
          onSave={handleSaveUniverse}
          onClose={() => {
            setUniverseModalOpen(false);
            setEditingUniverse(null);
          }}
        />
      )}

      {/* New Chat Modal */}
      {newChatModalOpen && (
        <NewChatModal
          characters={characters}
          universes={universes}
          onClose={() => setNewChatModalOpen(false)}
          onStartChat={(newSession) => {
            handleUpdateChats([newSession, ...chats]);
            setNewChatModalOpen(false);
            setActiveSessionId(newSession.id);
          }}
        />
      )}

      {/* Select World Modal for Group Adventure */}
      {selectWorldModalOpen && (
        <SelectWorldModal
          selectedCharacters={selectedGroupCharacters}
          universes={universes}
          onConfirm={handleSelectWorldConfirm}
          onCreateUniverse={() => {
            setSelectWorldModalOpen(false);
            setEditingUniverse(null);
            setUniverseModalOpen(true);
          }}
          onClose={() => {
            setSelectWorldModalOpen(false);
            setSelectedGroupCharacters([]);
          }}
        />
      )}
    </div>
  );
}
