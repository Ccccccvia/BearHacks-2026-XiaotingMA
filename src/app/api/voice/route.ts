import { NextResponse } from 'next/server';
import { textToSpeech, getVoiceForPet } from '@/lib/elevenlabs';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

function getCachePath(text: string, voiceId: string): string {
  const hash = createHash('md5').update(text + voiceId).digest('hex');
  const cacheDir = path.join(process.cwd(), 'public', 'audio', 'cache');
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  return path.join(cacheDir, `${hash}.mp3`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voiceId, petId } = body as { text: string; voiceId?: string; petId?: string };

    if (!text || typeof text !== 'string') {
      console.warn('[Voice API] Missing or invalid text field');
      return NextResponse.json(
        { error: 'Missing or invalid "text" field.' },
        { status: 400 }
      );
    }

    // Resolve voiceId: explicit > petId-based > fallback handled by textToSpeech
    let resolvedVoiceId = voiceId || '';
    if (!resolvedVoiceId && petId) {
      resolvedVoiceId = await getVoiceForPet(petId);
    }

    // Check file cache (uses resolvedVoiceId or 'default' for hash)
    const cacheKey = resolvedVoiceId || 'default';
    const cachePath = getCachePath(text, cacheKey);

    if (existsSync(cachePath)) {
      console.log(`[Voice API] Cache HIT: ${path.basename(cachePath)}`);
      const cached = readFileSync(cachePath);
      return new Response(cached, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.byteLength.toString(),
        },
      });
    }

    console.log(`[Voice API] Cache MISS — generating speech: textLength=${text.length}, voiceId=${resolvedVoiceId || 'default'}, petId=${petId || 'none'}`);
    const audioBuffer = await textToSpeech(text, resolvedVoiceId || undefined, petId);

    // Save to cache
    try {
      writeFileSync(cachePath, Buffer.from(audioBuffer));
      console.log(`[Voice API] Cached: ${path.basename(cachePath)} (${audioBuffer.byteLength} bytes)`);
    } catch (writeErr) {
      console.warn('[Voice API] Failed to write cache:', writeErr);
    }

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Voice API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
