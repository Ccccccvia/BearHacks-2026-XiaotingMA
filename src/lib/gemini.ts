import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PersonalityResult } from './types';
import { getPersonalityPrompt, getChatSystemPrompt } from './prompts';
import type { PetProfile, ChatMessage } from './types';

const PRIMARY_MODEL = 'gemma-3-27b-it';
const FALLBACK_MODEL = 'gemini-2.0-flash';

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

async function generateWithFallback(prompt: string, systemInstruction?: string): Promise<string> {
  const client = getClient();
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

  for (const modelName of models) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}`);
      const model = client.getGenerativeModel({
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {}),
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[Gemini] Success with model: ${modelName}, response length: ${text.length}`);
      return text;
    } catch (error) {
      console.error(`[Gemini] Model ${modelName} failed:`, error instanceof Error ? error.message : error);
      if (modelName === FALLBACK_MODEL) {
        throw error; // No more fallbacks
      }
      console.warn(`[Gemini] Falling back to ${FALLBACK_MODEL}`);
    }
  }

  throw new Error('All models failed');
}

export async function generatePersonality(
  breed: string,
  species: string,
  labels: string[]
): Promise<PersonalityResult> {
  const prompt = getPersonalityPrompt(breed, species, labels);
  const text = await generateWithFallback(prompt);

  // Extract JSON from the response (handle possible markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as PersonalityResult;

  // Validate required fields
  if (!parsed.name || !parsed.personality || !parsed.traits || !parsed.introText || !parsed.careAdvice) {
    throw new Error('Incomplete personality data from Gemini');
  }

  return parsed;
}

export async function generateChatReply(
  petProfile: PetProfile,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = getChatSystemPrompt({
    name: petProfile.name,
    breed: petProfile.breed,
    species: petProfile.species,
    personality: petProfile.personality,
    traits: petProfile.traits,
  });

  // Build conversation context
  const conversationHistory = messages
    .slice(-10) // Keep last 10 messages for context
    .map((m) => `${m.role === 'user' ? 'Human' : petProfile.name}: ${m.content}`)
    .join('\n');

  // Embed system prompt directly in the prompt text for maximum model compatibility
  // (gemma-3-27b-it does not reliably support the systemInstruction parameter)
  const fullPrompt = [
    `[System Instructions]\n${systemPrompt}\n`,
    '[Conversation]',
    conversationHistory,
    `Human: ${userMessage}`,
    `${petProfile.name}:`,
  ].filter(Boolean).join('\n');

  console.log('[Gemini Chat] Sending prompt length:', fullPrompt.length);

  try {
    const reply = await generateWithFallback(fullPrompt);
    // Strip any accidental prefix the model might echo back
    const cleaned = reply
      .replace(new RegExp(`^\\s*${petProfile.name}:\\s*`, 'i'), '')
      .trim();
    return cleaned || reply.trim();
  } catch (error) {
    console.error('[Gemini Chat] generateChatReply failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
