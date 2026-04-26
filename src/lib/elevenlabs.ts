let cachedVoices: Array<{ voice_id: string; name: string; category?: string }> = [];

interface VoiceEntry {
  voice_id: string;
  name: string;
  category?: string;
}

async function fetchAvailableVoices(
  apiKey: string
): Promise<VoiceEntry[]> {
  if (cachedVoices.length > 0) return cachedVoices;

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices (${response.status})`);
  }

  const data = await response.json();
  const allVoices: VoiceEntry[] = (data.voices || []).map(
    (v: { voice_id: string; name: string; category?: string }) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
    })
  );

  // Prefer a diverse set: prioritise premade & professional voices,
  // then fill with any remaining. This gives the hash-based picker
  // a richer pool to choose from.
  const preferred = allVoices.filter(
    (v) => v.category === 'premade' || v.category === 'professional'
  );
  const rest = allVoices.filter(
    (v) => v.category !== 'premade' && v.category !== 'professional'
  );
  cachedVoices = [...preferred, ...rest];

  console.log(
    `[ElevenLabs] ${cachedVoices.length} voices loaded (${preferred.length} premade/professional). Names: ${cachedVoices.map((v) => v.name).join(', ')}`
  );
  return cachedVoices;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministic per-pet voice settings for expressive character delivery.
 */
function getVoiceSettings(petId: string) {
  const hash = hashString(petId);
  return {
    stability: 0.3 + (hash % 20) / 100,           // 0.30 – 0.49
    similarity_boost: 0.65 + (hash % 15) / 100,    // 0.65 – 0.79
    style: 0.5 + (hash % 30) / 100,                // 0.50 – 0.79
    use_speaker_boost: true,
  };
}

export async function getVoiceForPet(petId: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');
  const voices = await fetchAvailableVoices(apiKey);
  if (voices.length === 0) throw new Error('No voices available');
  const index = hashString(petId) % voices.length;
  const settings = getVoiceSettings(petId);
  console.log(
    `[ElevenLabs] Pet ${petId} → voice: "${voices[index].name}" (stability: ${settings.stability.toFixed(2)}, similarity: ${settings.similarity_boost.toFixed(2)}, style: ${settings.style.toFixed(2)})`
  );
  return voices[index].voice_id;
}

// Simple serial queue for voice requests — prevents concurrent API calls
let voiceRequestQueue: Promise<ArrayBuffer> = Promise.resolve(
  new ArrayBuffer(0)
);

export async function textToSpeech(
  text: string,
  voiceId?: string,
  petId?: string
): Promise<ArrayBuffer> {
  // Queue requests so only one runs at a time
  const result = await (voiceRequestQueue = voiceRequestQueue
    .catch(() => {}) // Don't let previous failures block the queue
    .then(() => _textToSpeechInternal(text, voiceId, petId)));
  return result;
}

async function _textToSpeechInternal(
  text: string,
  voiceId?: string,
  petId?: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  // Resolve voice: explicit voiceId > petId-based > first available
  let vid = voiceId;
  if (!vid && petId) {
    vid = await getVoiceForPet(petId);
  }
  if (!vid) {
    const voices = await fetchAvailableVoices(apiKey);
    if (voices.length === 0) throw new Error('No voices available');
    vid = voices[0].voice_id;
  }

  console.log(
    `[ElevenLabs] Requesting TTS: voice=${vid}, textLength=${text.length}, model=eleven_multilingual_v2`
  );

  const doFetch = async () => {
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: petId
            ? getVoiceSettings(petId)
            : { stability: 0.4, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
        }),
      }
    );
  };

  let response = await doFetch();

  // Retry once on 429 rate-limit
  if (response.status === 429) {
    console.log('[ElevenLabs] Rate limited, waiting 2s and retrying...');
    await new Promise((r) => setTimeout(r, 2000));
    response = await doFetch();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ElevenLabs] API error (${response.status}):`, errorText);
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorText}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  console.log(`[ElevenLabs] TTS response content-type: ${contentType}`);

  // Guard: if the API returned JSON instead of audio, it's an error payload
  if (contentType.includes('application/json')) {
    const errorText = await response.text();
    console.error('[ElevenLabs] Received JSON instead of audio:', errorText);
    throw new Error(`ElevenLabs returned JSON error: ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('ElevenLabs returned empty audio buffer');
  }

  console.log(
    `[ElevenLabs] TTS success, audio size: ${buffer.byteLength} bytes`
  );
  return buffer;
}
