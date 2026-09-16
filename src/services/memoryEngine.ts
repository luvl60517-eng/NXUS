import {
  Character,
  Universe,
  Message,
  CharacterMemory,
  LoreEntry,
  CharacterRelationship,
  RetrievedMemoryInfo,
  ActivatedLoreInfo,
  ContextAwareMemoryBundle,
} from '../types';

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u',
  'a', 'en', 'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta', 'hacia', 'desde',
  'que', 'se', 'es', 'son', 'era', 'fue', 'ser', 'estar', 'ha', 'han', 'hay', 'te',
  'me', 'nos', 'os', 'le', 'les', 'lo', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'como',
  'pero', 'mas', 'si', 'no', 'ya', 'muy', 'del', 'al', 'este', 'esta', 'estos', 'estas',
  'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquello', 'algo', 'nada', 'todo',
  'bien', 'mal', 'tan', 'donde', 'cuando', 'quien', 'cual', 'esto', 'eso', 'aqui', 'ahi',
  'alla', 'ahora', 'despues', 'antes', 'mas', 'menos'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();
}

export function extractContextTokens(texts: string[]): string[] {
  const combined = texts.join(' ');
  const clean = normalizeText(combined);
  const words = clean.split(/\s+/);
  return Array.from(
    new Set(
      words.filter((w) => w.length >= 3 && !SPANISH_STOPWORDS.has(w))
    )
  );
}

export function extractProperNouns(texts: string[]): string[] {
  const combined = texts.join('\n');
  // Match capitalized words that may be names, places, or factions
  const matches = combined.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b/g) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

/**
 * Retrieve the most contextually relevant episodic memories for a character.
 * Prioritizes significant events (promises, fights, secrets, revelations) and high importance,
 * as well as direct topic matching with the active conversation.
 * Resilient to deleted messages because memories reside permanently in the character record.
 */
export function retrieveRelevantMemories(
  character: Character,
  recentMessages: Message[],
  targetName?: string,
  scenarioNotes?: string,
  limit: number = 5
): RetrievedMemoryInfo[] {
  if (!character.memories || character.memories.length === 0) {
    return [];
  }

  // Extract conversational context (focusing heavily on the last 3-4 messages)
  const lastFewMessages = recentMessages.slice(-4);
  const contextTexts = [
    ...lastFewMessages.map((m) => m.text),
    scenarioNotes || '',
  ].filter(Boolean);

  const contextTokens = extractContextTokens(contextTexts);
  const contextTokenSet = new Set(contextTokens);
  const properNouns = extractProperNouns(contextTexts);
  const fullContextNormalized = normalizeText(contextTexts.join(' '));

  // Category specific triggers
  const mentionsPromise = /\b(promesa|prometo|prometiste|juro|juramento|palabra|acuerdo|pacto)\b/i.test(
    fullContextNormalized
  );
  const mentionsSecret = /\b(secreto|oculto|verdad|confesar|mentira|revelar|misterio|callar)\b/i.test(
    fullContextNormalized
  );
  const mentionsConflict = /\b(pelea|conflicto|traicion|amenaza|espada|arma|odio|ataque|luchar|pelear)\b/i.test(
    fullContextNormalized
  );
  const mentionsRevelation = /\b(descubr|origen|pasado|revel|conocer|saber|verdad|identidad)\b/i.test(
    fullContextNormalized
  );

  const scoredMemories: RetrievedMemoryInfo[] = character.memories.map((memory) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Intrinsic Importance (base score from 0.4 to 4.0)
    const importance = memory.importance || 5;
    score += importance * 0.45;
    if (importance >= 8) {
      reasons.push(`Alta importancia (${importance}/10)`);
    }

    // 2. Pinned / Core Memory status
    if (memory.pinned) {
      score += 3.5;
      reasons.push('Memoria nuclear fijada');
    }

    // 3. Category contextual boost
    if (memory.category === 'promesa' && mentionsPromise) {
      score += 3.0;
      reasons.push('Relevante a promesa/pacto mencionado');
    } else if (memory.category === 'secreto' && mentionsSecret) {
      score += 3.0;
      reasons.push('Relevante a secreto/revelación activa');
    } else if (memory.category === 'pelea' && mentionsConflict) {
      score += 3.0;
      reasons.push('Relevante a conflicto/tensión');
    } else if (memory.category === 'revelacion' && mentionsRevelation) {
      score += 2.5;
      reasons.push('Relevante a revelación/origen');
    }

    // 4. Content token matching (Semantic overlap)
    const memoryTokens = extractContextTokens([memory.content, ...(memory.tags || [])]);
    const matchedTokens: string[] = [];

    for (const token of memoryTokens) {
      if (contextTokenSet.has(token)) {
        score += token.length > 5 ? 2.0 : 1.3;
        matchedTokens.push(token);
      }
    }

    // Check proper nouns mentioned in memory
    const memoryProperNouns = extractProperNouns([memory.content]);
    for (const pn of memoryProperNouns) {
      if (properNouns.includes(pn)) {
        score += 2.5;
        matchedTokens.push(pn);
      }
    }

    if (matchedTokens.length > 0) {
      const topMatched = Array.from(new Set(matchedTokens)).slice(0, 3);
      reasons.push(`Coincide con términos: "${topMatched.join(', ')}"`);
    }

    // 5. Interlocutor direct mention in memory
    if (targetName) {
      const targetNormalized = normalizeText(targetName);
      if (normalizeText(memory.content).includes(targetNormalized)) {
        score += 1.5;
        reasons.push(`Alude a ${targetName}`);
      }
    }

    // 6. Recency subtle adjustment
    const daysOld = (Date.now() - (memory.timestamp || Date.now())) / (1000 * 60 * 60 * 24);
    if (daysOld < 2) {
      score += 0.5; // Fresh memory
    }

    return {
      memory,
      score,
      reason: reasons.length > 0 ? reasons.join(' • ') : `Evento archivado (${memory.category || 'hecho'})`,
    };
  });

  // Sort descending by calculated contextual score
  scoredMemories.sort((a, b) => b.score - a.score);

  return scoredMemories.slice(0, limit);
}

/**
 * Retrieve universe lore entries relevant to the active context.
 * Matches lorebook keywords, titles, and lore content.
 */
export function retrieveRelevantLore(
  universe?: Universe,
  recentMessages: Message[] = [],
  scenarioNotes?: string,
  limit: number = 4
): ActivatedLoreInfo[] {
  if (!universe || !universe.lore || universe.lore.length === 0) {
    return [];
  }

  const contextTexts = [
    ...recentMessages.slice(-5).map((m) => m.text),
    scenarioNotes || '',
  ].filter(Boolean);

  const contextTokens = extractContextTokens(contextTexts);
  const contextTokenSet = new Set(contextTokens);
  const fullContextNormalized = normalizeText(contextTexts.join(' '));

  const scoredLore: ActivatedLoreInfo[] = universe.lore.map((lore) => {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 1. Exact or normalized keyword matches
    if (Array.isArray(lore.keywords)) {
      for (const kw of lore.keywords) {
        if (!kw) continue;
        const kwNorm = normalizeText(kw);
        if (kwNorm.length >= 3) {
          // Check whole word or substring in context
          if (fullContextNormalized.includes(kwNorm)) {
            score += 3.5;
            matchedKeywords.push(kw);
          } else if (contextTokenSet.has(kwNorm)) {
            score += 2.5;
            matchedKeywords.push(kw);
          }
        }
      }
    }

    // 2. Title match
    const titleNorm = normalizeText(lore.title);
    if (fullContextNormalized.includes(titleNorm)) {
      score += 4.0;
      matchedKeywords.push(lore.title);
    } else {
      const titleTokens = extractContextTokens([lore.title]);
      for (const t of titleTokens) {
        if (contextTokenSet.has(t)) {
          score += 2.0;
          matchedKeywords.push(t);
        }
      }
    }

    // 3. Content tokens overlap
    const loreContentTokens = extractContextTokens([lore.content]);
    for (const t of loreContentTokens) {
      if (contextTokenSet.has(t)) {
        score += 0.4;
      }
    }

    return {
      lore,
      score,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
    };
  });

  // Filter only lore with actual match score or fallback to top general lore if none matched
  const matched = scoredLore.filter((l) => l.score > 0);
  matched.sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    return matched.slice(0, limit);
  }

  // If no specific lore keywords were triggered, provide the first 2 foundational entries
  return universe.lore.slice(0, Math.min(2, limit)).map((lore) => ({
    lore,
    score: 0.1,
    matchedKeywords: ['Fundamento general del mundo'],
  }));
}

/**
 * Retrieve dynamic relationships relevant to the active context.
 * Fetches the speaking character's relationship with the interlocutor (user or character),
 * plus relationships with any third-party characters mentioned in recent dialogue!
 */
export function retrieveRelevantRelationships(
  character: Character,
  allCharacters: Character[],
  targetId: string,
  recentMessages: Message[] = []
): CharacterRelationship[] {
  const rels = character.relationships || [];
  const result: CharacterRelationship[] = [];

  // 1. Direct relationship with interlocutor
  const directRel = rels.find((r) => r.targetId === targetId) || {
    targetId,
    targetType: targetId === 'user' ? 'user' : 'character',
    targetName: targetId === 'user' ? 'Usuario' : (allCharacters.find((c) => c.id === targetId)?.name || 'Personaje'),
    status: 'indiferente',
    affinity: 0,
    notes: 'Aún no os conocéis.',
  };
  result.push(directRel);

  // 2. Pre-established relationships with other characters from the start
  // (e.g. family ties, alliances, rivalries, debts, romances defined from creation)
  for (const rel of rels) {
    if (rel.targetType === 'character' && rel.targetId !== targetId) {
      if (!result.some((r) => r.targetId === rel.targetId)) {
        const foundName = allCharacters.find((c) => c.id === rel.targetId)?.name;
        result.push({
          ...rel,
          targetName: rel.targetName || foundName || 'Personaje',
        });
      }
    }
  }

  // 3. Identify if any other unlinked characters are mentioned in recent dialogue
  const contextTextNormalized = normalizeText(recentMessages.slice(-4).map((m) => m.text).join(' '));

  for (const otherChar of allCharacters) {
    if (otherChar.id === character.id || otherChar.id === targetId) continue;
    if (result.some((r) => r.targetId === otherChar.id)) continue;

    const nameNorm = normalizeText(otherChar.name);
    if (nameNorm.length >= 3 && contextTextNormalized.includes(nameNorm)) {
      result.push({
        targetId: otherChar.id,
        targetType: 'character',
        targetName: otherChar.name,
        status: 'conocido',
        affinity: 0,
        notes: `Conoce a ${otherChar.name} en este universo.`,
      });
    }
  }

  return result;
}

/**
 * Assemble a complete, context-aware memory bundle for prompt generation.
 */
export function buildContextAwareBundle(params: {
  character: Character;
  universe?: Universe;
  messages: Message[];
  allCharacters: Character[];
  targetId: string;
  targetName?: string;
  scenarioNotes?: string;
}): ContextAwareMemoryBundle {
  const { character, universe, messages, allCharacters, targetId, targetName, scenarioNotes } = params;

  const retrievedMemories = retrieveRelevantMemories(
    character,
    messages,
    targetName,
    scenarioNotes,
    5
  );

  const activatedLore = retrieveRelevantLore(
    universe,
    messages,
    scenarioNotes,
    4
  );

  const relevantRelationships = retrieveRelevantRelationships(
    character,
    allCharacters,
    targetId,
    messages
  );

  let explanation = '';
  if (retrievedMemories.length > 0) {
    explanation += `${retrievedMemories.length} recuerdo(s) relevante(s) evocados. `;
  }
  if (activatedLore.length > 0) {
    explanation += `${activatedLore.length} entrada(s) de lore activadas.`;
  }

  return {
    retrievedMemories,
    activatedLore,
    relevantRelationships,
    contextExplanation: explanation.trim(),
  };
}
