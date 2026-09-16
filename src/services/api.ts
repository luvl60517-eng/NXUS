import { Character, Universe, Message, UserProfile } from '../types';
import { retrieveRelevantMemories, retrieveRelevantLore } from './memoryEngine';

export interface RetrievedMemorySummary {
  id: string;
  content: string;
  category?: string;
  importance?: number;
  reason?: string;
  score?: number;
}

export interface ActivatedLoreSummary {
  id: string;
  title: string;
  matchedKeywords: string[];
}

export interface ChatResponseResult {
  dialogue: string;
  affinityChange: number;
  newStatus?: string;
  opinionUpdate?: string;
  newEpisodicMemory?: {
    content: string;
    importance: number;
    category: 'promesa' | 'pelea' | 'revelacion' | 'secreto' | 'hecho';
  } | string | null;
  retrievedMemories?: RetrievedMemorySummary[];
  activatedLore?: ActivatedLoreSummary[];
}

export interface AutonomousTurnResult {
  speakingCharacterId: string;
  speakingCharacterName: string;
  dialogue: string;
  targetCharacterName?: string;
  newEpisodicMemory?: any;
  retrievedMemories?: { id: string; content: string; reason?: string }[];
}

export const ApiService = {
  async respondToMessage(params: {
    character: Character;
    universe?: Universe;
    messages: Message[];
    targetCharacter?: Character;
    otherCharacters?: Character[];
    isGroupChat?: boolean;
    scenarioNotes?: string;
    userProfile: UserProfile;
  }): Promise<ChatResponseResult> {
    try {
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn('Fallo en API, usando generador local de inmersión:', error);
      // Client-side fallback with memory context
      const retrieved = retrieveRelevantMemories(
        params.character,
        params.messages,
        params.targetCharacter?.name || params.userProfile.name,
        params.scenarioNotes,
        3
      );
      const activeLore = retrieveRelevantLore(params.universe, params.messages, params.scenarioNotes, 2);

      let memoryDialogueAddon = '';
      if (retrieved.length > 0) {
        const topMem = retrieved[0].memory;
        if (topMem.category === 'promesa') {
          memoryDialogueAddon = ` "Aún tengo muy presente lo que me prometiste: ${topMem.content}."`;
        } else if (topMem.category === 'secreto') {
          memoryDialogueAddon = ` "Y no creas que he olvidado el secreto que compartimos."`;
        }
      }

      const fallbackActions = [
        `*${params.character.name} reflexiona unos instantes con serenidad y responde con mirada penetrante.* "Tus palabras dejan ver más de lo que pretendías.${memoryDialogueAddon} Sigamos viendo hasta dónde nos llega esto."`,
        `*${params.character.name} esboza una leve sonrisa cargada de misterio.* "Interesante perspectiva. En este lugar, cada elección tiene sus consecuencias."`,
      ];

      return {
        dialogue: fallbackActions[Math.floor(Math.random() * fallbackActions.length)],
        affinityChange: 1,
        newStatus: params.character.relationships?.[0]?.status || 'amistoso',
        opinionUpdate: 'Mantiene una postura atenta y curiosa.',
        newEpisodicMemory: null,
        retrievedMemories: retrieved.map((r) => ({
          id: r.memory.id,
          content: r.memory.content,
          category: r.memory.category,
          importance: r.memory.importance,
          reason: r.reason,
          score: r.score,
        })),
        activatedLore: activeLore.map((a) => ({
          id: a.lore.id,
          title: a.lore.title,
          matchedKeywords: a.matchedKeywords,
        })),
      };
    }
  },

  async triggerAutonomousTurn(params: {
    characters: Character[];
    universe?: Universe;
    messages: Message[];
    scenarioNotes?: string;
  }): Promise<AutonomousTurnResult> {
    try {
      const response = await fetch('/api/chat/autonomous-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      const char = params.characters[0];
      const other = params.characters[1];
      return {
        speakingCharacterId: char.id,
        speakingCharacterName: char.name,
        dialogue: `*${char.name} se gira hacia ${other ? other.name : 'los demás'} cruzándose de brazos.* "No deberíamos confiarnos. Las cosas pueden cambiar de un momento a otro."`,
        targetCharacterName: other ? other.name : 'el grupo',
        newEpisodicMemory: null,
      };
    }
  },

  async checkHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
      return { status: 'fallback', hasApiKey: false, model: 'local' };
    } catch {
      return { status: 'offline', hasApiKey: false, model: 'local' };
    }
  },
};
