import type { VisionResult } from './types';

const ANIMAL_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'turtle', 'snake', 'lizard', 'parrot', 'guinea pig', 'ferret', 'horse', 'chicken'];

interface VisionLabel {
  description: string;
  score: number;
}

interface VisionAnnotation {
  name: string;
  score: number;
}

interface VisionResponse {
  responses: Array<{
    labelAnnotations?: VisionLabel[];
    localizedObjectAnnotations?: VisionAnnotation[];
    error?: { message: string };
  }>;
}

export async function analyzeImage(base64Image: string): Promise<VisionResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY is not configured');
  }

  // Strip data URL prefix if present
  const imageContent = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = {
    requests: [
      {
        image: { content: imageContent },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 15 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        ],
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API error (${response.status}): ${errorText}`);
  }

  const data: VisionResponse = await response.json();
  const result = data.responses[0];

  if (result.error) {
    throw new Error(`Vision API error: ${result.error.message}`);
  }

  const labels = (result.labelAnnotations ?? []).map((l) => l.description);
  const objects = (result.localizedObjectAnnotations ?? []).map((o) => o.name);

  // Combined labels for potential future use
  const _allLabels = [...labels, ...objects].map((l) => l.toLowerCase());
  void _allLabels;

  // Try to find species
  let species = 'unknown';
  let confidence = 0;

  for (const label of result.labelAnnotations ?? []) {
    const lower = label.description.toLowerCase();
    if (ANIMAL_SPECIES.includes(lower)) {
      species = label.description;
      confidence = label.score;
      break;
    }
  }

  // Also check object annotations for species
  if (species === 'unknown') {
    for (const obj of result.localizedObjectAnnotations ?? []) {
      const lower = obj.name.toLowerCase();
      if (ANIMAL_SPECIES.includes(lower)) {
        species = obj.name;
        confidence = obj.score;
        break;
      }
    }
  }

  // Determine breed — look for more specific labels
  let breed = 'Mixed';
  const speciesLower = species.toLowerCase();

  for (const label of result.labelAnnotations ?? []) {
    const lower = label.description.toLowerCase();
    // Skip generic labels, look for breed-specific ones
    if (
      lower !== speciesLower &&
      !ANIMAL_SPECIES.includes(lower) &&
      lower !== 'animal' &&
      lower !== 'pet' &&
      lower !== 'mammal' &&
      lower !== 'vertebrate' &&
      lower !== 'carnivore' &&
      (lower.includes(speciesLower) || label.score > 0.7)
    ) {
      // This might be a breed label
      if (lower !== 'snout' && lower !== 'whiskers' && lower !== 'fur' && lower !== 'tail') {
        breed = label.description;
        break;
      }
    }
  }

  return {
    labels: labels.slice(0, 10),
    breed,
    species: species.charAt(0).toUpperCase() + species.slice(1),
    confidence: Math.round(confidence * 100) / 100,
  };
}
