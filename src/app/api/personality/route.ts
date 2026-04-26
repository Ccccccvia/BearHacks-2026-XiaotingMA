import { NextResponse } from 'next/server';
import { generatePersonality } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { breed, species, visionLabels } = body;

    if (!breed || !species) {
      return NextResponse.json(
        { error: 'Missing required fields: "breed" and "species".' },
        { status: 400 }
      );
    }

    const labels: string[] = Array.isArray(visionLabels) ? visionLabels : [];

    const result = await generatePersonality(breed, species, labels);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Personality API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
