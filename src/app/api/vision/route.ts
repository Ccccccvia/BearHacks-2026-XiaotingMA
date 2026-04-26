import { NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/vision';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "image" field. Expected a base64 encoded string.' },
        { status: 400 }
      );
    }

    const result = await analyzeImage(image);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vision API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
