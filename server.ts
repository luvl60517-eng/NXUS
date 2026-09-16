import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  buildContextAwareBundle,
  retrieveRelevantMemories,
  retrieveRelevantLore,
  retrieveRelevantRelationships,
} from "./src/services/memoryEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Google Gen AI helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.8-flash",
  });
});

// Chat endpoint with Context-Aware Memory Retrieval
app.post("/api/chat/respond", async (req, res) => {
  try {
    const {
      character,
      universe,
      messages = [],
      targetCharacter,
      otherCharacters = [],
      isGroupChat = false,
      scenarioNotes = "",
      userProfile = { name: "Usuario" },
    } = req.body;

    if (!character || !character.name) {
      return res.status(400).json({ error: "Faltan datos del personaje" });
    }

    const allContextCharacters = [
      character,
      ...(otherCharacters || []),
      ...(targetCharacter ? [targetCharacter] : []),
    ];
    const targetId = targetCharacter ? targetCharacter.id : "user";
    const targetName = targetCharacter ? targetCharacter.name : (userProfile.name || "Usuario");

    // 1. Run Context-Aware Retrieval Engine
    const memoryBundle = buildContextAwareBundle({
      character,
      universe,
      messages,
      allCharacters: allContextCharacters,
      targetId,
      targetName,
      scenarioNotes,
    });

    const primaryRel = memoryBundle.relevantRelationships[0] || {
      status: "indiferente",
      affinity: 0,
      notes: "Aún no os conocéis en profundidad",
    };

    const secondaryRels = memoryBundle.relevantRelationships.slice(1);

    // Formulate Context Sections
    const retrievedMemoriesSection =
      memoryBundle.retrievedMemories.length > 0
        ? memoryBundle.retrievedMemories
            .map(
              (rm) =>
                `• [Memoria Evocada - ${rm.memory.category?.toUpperCase() || 'HECHO'}, Importancia: ${rm.memory.importance}/10]: "${rm.memory.content}"\n  (Activada por: ${rm.reason})`
            )
            .join("\n")
        : "Sin recuerdos específicos evocados en este turno. Mantén coherencia general con tu historia.";

    const activatedLoreSection =
      memoryBundle.activatedLore.length > 0
        ? memoryBundle.activatedLore
            .map(
              (al) =>
                `• [${al.lore.title}] (Activado por: ${al.matchedKeywords.join(', ')}):\n  ${al.lore.content}`
            )
            .join("\n")
        : (universe?.description ? `Mundo general: ${universe.description}` : "Sin lore específico.");

    // Format compact, efficient chat history (resilient to message deletions)
    const recentMessages = messages.slice(-10).map((m: any) => {
      const sender =
        m.senderId === "user" ? userProfile.name || "Usuario" : m.senderName;
      return `${sender}: ${m.text}`;
    });

    const historySection =
      recentMessages.length > 0
        ? recentMessages.join("\n")
        : "[El historial de mensajes está vacío o fue reiniciado por el usuario. Continúa la interacción basándote en tu memoria a largo plazo y tu rol.]";

    const promptInstruction = `
Eres "${character.name}", un personaje con vida propia, convicciones, objetivos y limitaciones en este universo.
ESTRICTAMENTE EN ESPAÑOL.

=== PERFIL DE TU PERSONAJE ===
Nombre: ${character.name}
Título / Ocupación: ${character.tagline || "Habitante del universo"}
Historia personal (Backstory): ${character.backstory || "Un pasado enigmático."}
Personalidad y conducta: ${character.personality || "Coherente con su historia."}
Estilo de habla y tono: ${character.speechStyle || "Natural y expresivo."}
Objetivos personales actuales: ${character.personalObjectives || "Sobrevivir y alcanzar sus metas."}

=== BASE DE CONOCIMIENTOS ÚNICA (ASIMETRÍA DE INFORMACIÓN) ===
LO QUE TÚ SABES (Información privada):
${character.privateKnowledge || "Conoces tu entorno y tu oficio."}

LO QUE TÚ DESCONOCES (Puntos ciegos / Blind spots):
${character.blindSpots || "Desconoces secretos que otros no te hayan contado directamente. NUNCA asumas conocimiento omnisciente."}
*REGLA CRÍTICA DE ASIMETRÍA*: NUNCA reveles ni actúes sobre información clasificada en tus puntos ciegos a menos que te la hayan revelado explícitamente en el diálogo.

=== SISTEMA DE MEMORIA SENSIBLE AL CONTEXTO (RECUPERACIÓN INTELIGENTE) ===
Las siguientes memorias han sido recuperadas de tu cerebro a largo plazo por coincidir con la situación actual, promesas previas o conflictos pasados (incluso si el usuario borró mensajes del chat, tu memoria persiste):
${retrievedMemoriesSection}

=== LOREBOOK Y REGLAS ACTIVADAS POR EL CONTEXTO ===
Universo: "${universe?.name || 'NEXUS'}"
${activatedLoreSection}
${universe?.rules ? `Reglas del mundo: ${universe.rules}` : ''}
${universe?.secrets ? `Secretos del mundo (úsalo solo si los conoces): ${universe.secrets}` : ''}

=== DINÁMICA DE RELACIONES Y VÍNCULOS ===
Relación con ${targetName}:
- Estado actual: "${primaryRel.status || "indiferente"}"
- Afinidad (-100 a +100): ${primaryRel.affinity ?? 0}
- Tu opinión íntima: "${primaryRel.notes || "Neutro"}"
${
  secondaryRels.length > 0
    ? `Otras relaciones interpersonales aludidas en la escena:\n${secondaryRels
        .map(
          (r) =>
            `- Con ${r.targetName}: Estado "${r.status}" (Afinidad: ${r.affinity}) • "${r.notes}"`
        )
        .join("\n")}`
    : ""
}

${
  isGroupChat
    ? `=== ESCENA GRUPAL ===
Personajes presentes: ${otherCharacters
        .map((c: any) => `${c.name} (${c.tagline || "presente"})`)
        .join(", ")}.
Puedes interactuar directamente con ellos o reaccionar a lo que dijeron.`
    : ""
}

${scenarioNotes ? `ESCENARIO ACTUAL: ${scenarioNotes}` : ""}

=== FILOSOFÍA DE ROLEPLAY DE NEXUS ===
1. Inmersión total: Habla y actúa 100% como ${character.name}. No rompas la cuarta pared.
2. Formato: Escribe tus acciones, gestos y descripciones físicas entre asteriscos (*da un paso al frente con una mirada suspicaz*), y tus palabras habladas de forma directa.
3. Libertad creativa y madurez: Sigue el roleplay sin emitir discursos moralistas o sermones fuera de personaje. Si eres hostil, actúa hostil; si eres cariñoso o misterioso, refléjalo fielmente.
4. Coherencia de Memoria: Si recuerdas una promesa, traición, secreto o pacto previo recuperado arriba, mantén esa actitud con total coherencia.
5. Extracción de Nuevos Recuerdos: Si durante este turno ocurre un hito relevante (un acuerdo, una pelea, un pacto, una promesa o una confesión), regístralo para archivarlo en tu memoria a largo plazo.

=== FORMATO DE SALIDA REQUERIDO ===
Debes responder en formato JSON válido con la siguiente estructura exacta:
{
  "dialogue": "Tu respuesta completa aquí, con acciones entre *asteriscos* y diálogo.",
  "affinityChange": 0, // Número entero entre -8 y +8 según cómo afectó esta interacción a tu afinidad. 0 si no hubo cambio notable.
  "newStatus": "${primaryRel.status || "indiferente"}", // Estado de relación sugerido si ha cambiado (ej: "amistoso", "cómplice", "rival", "desconfiado", "romántico", etc.)
  "opinionUpdate": "Breve pensamiento interno sobre el usuario/interlocutor si cambió algo.",
  "newEpisodicMemory": {
    "content": "Resumen conciso del hecho significativo ocurrido si lo hubo (ej: 'El usuario me juró proteger el relicario familiar'), o null si fue charla casual.",
    "importance": 8, // Escala de 1 a 10
    "category": "promesa" // una de: "promesa", "pelea", "revelacion", "secreto", "hecho"
  }
}
`;

    const ai = getGeminiClient();

    if (ai) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${promptInstruction}\n\n=== HISTORIAL RECIENTE DE DIÁLOGO ===\n${historySection}\n\nGenera la respuesta como ${character.name} en formato JSON:`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.9,
          },
        });

        const rawText = geminiRes.text || "{}";
        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const clean = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsed = JSON.parse(clean);
        }

        // Normalize newEpisodicMemory if returned as string or object
        let formattedNewMemory = null;
        if (parsed.newEpisodicMemory) {
          if (typeof parsed.newEpisodicMemory === "string") {
            formattedNewMemory = {
              content: parsed.newEpisodicMemory,
              importance: 7,
              category: "hecho",
            };
          } else if (parsed.newEpisodicMemory.content) {
            formattedNewMemory = {
              content: parsed.newEpisodicMemory.content,
              importance: Number(parsed.newEpisodicMemory.importance) || 7,
              category: parsed.newEpisodicMemory.category || "hecho",
            };
          }
        }

        return res.json({
          dialogue: parsed.dialogue || `*${character.name} te mira en silencio, evaluando la situación.*`,
          affinityChange: Number(parsed.affinityChange) || 0,
          newStatus: parsed.newStatus || primaryRel.status,
          opinionUpdate: parsed.opinionUpdate || null,
          newEpisodicMemory: formattedNewMemory,
          retrievedMemories: memoryBundle.retrievedMemories.map((rm) => ({
            id: rm.memory.id,
            content: rm.memory.content,
            category: rm.memory.category,
            importance: rm.memory.importance,
            reason: rm.reason,
            score: rm.score,
          })),
          activatedLore: memoryBundle.activatedLore.map((al) => ({
            id: al.lore.id,
            title: al.lore.title,
            matchedKeywords: al.matchedKeywords,
          })),
        });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, generating fallback response:", geminiError?.message);
      }
    }

    // Smart Fallback when API key is missing or quota reached
    const fallbackResponses = [
      `*${character.name} observa fijamente a su interlocutor, acomodándose con serenidad.* "No suelo prestar atención a cualquiera, pero lo que acabas de decir resulta intrigante. Dime más."`,
      `*Cruza los brazos y sonríe con una ceja arqueada.* "Vaya, no esperaba esa jugada de tu parte. Supongo que tendremos que ver hasta dónde llega esto."`,
      `*Examina el entorno con cautela antes de fijar la mirada.* "En este universo las palabras tienen peso. Asegúrate de recordar lo que has prometido aquí."`,
    ];
    const pickedFallback =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return res.json({
      dialogue: pickedFallback,
      affinityChange: 1,
      newStatus: primaryRel.status || "interesado",
      opinionUpdate: "Encuentra la interacción llamativa.",
      newEpisodicMemory: {
        content: `Conversó con ${userProfile.name || "el interlocutor"} sobre los acontecimientos recientes.`,
        importance: 6,
        category: "hecho",
      },
      retrievedMemories: memoryBundle.retrievedMemories.map((rm) => ({
        id: rm.memory.id,
        content: rm.memory.content,
        category: rm.memory.category,
        importance: rm.memory.importance,
        reason: rm.reason,
        score: rm.score,
      })),
      activatedLore: memoryBundle.activatedLore.map((al) => ({
        id: al.lore.id,
        title: al.lore.title,
        matchedKeywords: al.matchedKeywords,
      })),
    });
  } catch (error: any) {
    console.error("Error in /api/chat/respond:", error);
    res.status(500).json({ error: error.message || "Error al procesar respuesta" });
  }
});

// Autonomous multi-character turn endpoint
app.post("/api/chat/autonomous-turn", async (req, res) => {
  try {
    const {
      characters = [],
      universe,
      messages = [],
      scenarioNotes = "",
    } = req.body;

    if (!characters.length) {
      return res.status(400).json({ error: "No hay personajes disponibles" });
    }

    // Pick speaking character
    const candidate = characters[Math.floor(Math.random() * characters.length)];
    const otherChars = characters.filter((c: any) => c.id !== candidate.id);

    // Retrieve context-aware memories & lore for autonomous candidate
    const memoryBundle = buildContextAwareBundle({
      character: candidate,
      universe,
      messages,
      allCharacters: characters,
      targetId: otherChars[0]?.id || "group",
      targetName: otherChars[0]?.name || "los demás",
      scenarioNotes,
    });

    const retrievedMemoriesSection =
      memoryBundle.retrievedMemories.length > 0
        ? memoryBundle.retrievedMemories
            .map((rm) => `• [Memoria: ${rm.memory.content}] (Motivo: ${rm.reason})`)
            .join("\n")
        : "Sin memorias previas directas.";

    const prompt = `
En una escena de roleplay grupal en el universo "${universe?.name || "NEXUS"}",
los personajes presentes son: ${characters.map((c: any) => c.name).join(", ")}.
El último mensaje fue: "${messages[messages.length - 1]?.text || "El silencio llena la sala"}".

Haz que "${candidate.name}" tome la iniciativa de forma espontánea y coherente con sus recuerdos y convicciones:
Personalidad: ${candidate.personality || "Natural"}
Estilo: ${candidate.speechStyle || "Expresivo"}
Base de conocimientos privados: ${candidate.privateKnowledge || "Conoce sus propios asuntos"}
Puntos ciegos: ${candidate.blindSpots || "No sabe lo que piensan los demás"}

=== MEMORIAS EVOCADAS POR EL CONTEXTO ===
${retrievedMemoriesSection}

Devuelve JSON con:
{
  "speakingCharacterId": "${candidate.id}",
  "speakingCharacterName": "${candidate.name}",
  "dialogue": "Acción y diálogo entre *asteriscos* y comillas.",
  "targetCharacterName": "${otherChars[0]?.name || "el grupo"}",
  "newEpisodicMemory": null
}
`;

    const ai = getGeminiClient();
    if (ai) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json", temperature: 0.95 },
        });
        const parsed = JSON.parse(geminiRes.text || "{}");
        return res.json({
          speakingCharacterId: candidate.id,
          speakingCharacterName: candidate.name,
          dialogue: parsed.dialogue,
          targetCharacterName: parsed.targetCharacterName || otherChars[0]?.name,
          newEpisodicMemory: parsed.newEpisodicMemory,
          retrievedMemories: memoryBundle.retrievedMemories.map((rm) => ({
            id: rm.memory.id,
            content: rm.memory.content,
            reason: rm.reason,
          })),
        });
      } catch (err: any) {
        console.warn("Autonomous turn gemini fallback:", err?.message);
      }
    }

    // Fallback autonomous turn
    const targetName = otherChars[0]?.name || "los presentes";
    res.json({
      speakingCharacterId: candidate.id,
      speakingCharacterName: candidate.name,
      dialogue: `*${candidate.name} intercambia una mirada significativa con ${targetName} y da un paso adelante.* "¿De verdad pensáis quedaros de brazos cruzados mientras la situación se complica?"`,
      targetCharacterName: targetName,
      newEpisodicMemory: null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEXUS server running on http://localhost:${PORT}`);
  });
}

startServer();
