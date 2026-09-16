export interface CharacterRelationship {
  targetId: string; // 'user' or characterId
  targetType: 'user' | 'character';
  targetName: string;
  status: 'amistoso' | 'hostil' | 'romantico' | 'indiferente' | 'rival' | 'desconfiado' | 'leal' | 'protector' | string;
  affinity: number; // -100 to +100
  notes: string;
  lastUpdated?: number;
}

export interface CharacterMemory {
  id: string;
  timestamp: number;
  content: string;
  importance: number; // 1 to 10
  category?: 'promesa' | 'pelea' | 'revelacion' | 'secreto' | 'hecho';
  pinned?: boolean; // Pinned memories are high-priority core memories
  tags?: string[];
  relatedCharacterId?: string;
  sourceSessionId?: string;
}

export interface RetrievedMemoryInfo {
  memory: CharacterMemory;
  score: number;
  reason: string;
}

export interface ActivatedLoreInfo {
  lore: LoreEntry;
  score: number;
  matchedKeywords: string[];
}

export interface ContextAwareMemoryBundle {
  retrievedMemories: RetrievedMemoryInfo[];
  activatedLore: ActivatedLoreInfo[];
  relevantRelationships: CharacterRelationship[];
  contextExplanation?: string;
}

export interface Character {
  id: string;
  universeId?: string;
  name: string;
  avatar: string;
  tagline: string;
  backstory: string;
  personality: string;
  speechStyle: string;
  personalObjectives: string;
  privateKnowledge: string;
  blindSpots: string;
  greetingMessage: string;
  relationships: CharacterRelationship[];
  memories: CharacterMemory[];
  createdAt: number;
}

export interface LoreEntry {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

export interface Universe {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image?: string; // Profile picture / cover from gallery or preset
  rules: string;
  secrets: string;
  lore: LoreEntry[];
  locations: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string; // 'user' or characterId
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  isAutonomous?: boolean;
  targetCharacterId?: string;
  affinityDelta?: {
    characterId: string;
    delta: number;
    newStatus?: string;
    reason?: string;
  };
  recalledMemories?: string[];
  activatedLoreTitles?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  type: 'individual' | 'group';
  universeId?: string;
  characterIds: string[];
  messages: Message[];
  scenarioNotes?: string;
  lastActivity: number;
}

export interface UserProfile {
  name: string;
  persona: string;
  avatar: string;
}
