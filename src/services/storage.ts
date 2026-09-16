import { Character, Universe, ChatSession, UserProfile } from '../types';
import { STARTER_UNIVERSES, STARTER_CHARACTERS, STARTER_CHARACTER_IDS } from './starterData';

const STORAGE_KEYS = {
  UNIVERSES: 'nexus_universes_v1',
  CHARACTERS: 'nexus_characters_v1',
  CHATS: 'nexus_chats_v1',
  USER_PROFILE: 'nexus_user_profile_v1',
};

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Aventurero',
  persona: 'Un viajero perspicaz que recorre diferentes realidades.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const StorageService = {
  getUniverses(): Universe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNIVERSES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Seed starter universes if empty
      this.saveUniverses(STARTER_UNIVERSES);
      return STARTER_UNIVERSES;
    } catch {
      return STARTER_UNIVERSES;
    }
  },

  saveUniverses(universes: Universe[]) {
    localStorage.setItem(STORAGE_KEYS.UNIVERSES, JSON.stringify(universes));
  },

  getCharacters(): Character[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Remove any default starter characters so they do not appear
          const cleaned = parsed.filter(
            (c: Character) => c && !STARTER_CHARACTER_IDS.includes(c.id)
          );
          if (cleaned.length !== parsed.length) {
            this.saveCharacters(cleaned);
          }
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveCharacters(characters: Character[]) {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  },

  resetToStarterData() {
    this.saveUniverses(STARTER_UNIVERSES);
    this.saveCharacters([]);
    return {
      universes: STARTER_UNIVERSES,
      characters: [],
    };
  },

  getChats(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (data) {
        const parsed: ChatSession[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out chats that exclusively belonged to the deleted starter characters
          const cleaned = parsed.filter((c) => {
            const hasNonStarter = c.characterIds.some((id) => !STARTER_CHARACTER_IDS.includes(id));
            return hasNonStarter;
          });
          if (cleaned.length !== parsed.length) {
            this.saveChats(cleaned);
          }
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveChats(chats: ChatSession[]) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  },

  saveUserProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  exportAllData() {
    return JSON.stringify({
      universes: this.getUniverses(),
      characters: this.getCharacters(),
      chats: this.getChats(),
      userProfile: this.getUserProfile(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  importData(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.universes)) this.saveUniverses(data.universes);
      if (Array.isArray(data.characters)) this.saveCharacters(data.characters);
      if (Array.isArray(data.chats)) this.saveChats(data.chats);
      if (data.userProfile) this.saveUserProfile(data.userProfile);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.UNIVERSES);
    localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
  }
};
