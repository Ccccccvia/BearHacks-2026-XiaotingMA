import { NextResponse } from 'next/server';
import { generateChatReply } from '@/lib/gemini';
import type { PetProfile, ChatMessage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { petProfile, messages, userMessage } = body as {
      petProfile: PetProfile;
      messages: ChatMessage[];
      userMessage: string;
    };

    console.log('[Chat API] Received request:', {
      hasPetProfile: !!petProfile,
      petName: petProfile?.name,
      messageCount: Array.isArray(messages) ? messages.length : 0,
      userMessage: userMessage?.slice(0, 80),
    });

    if (!petProfile || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: "petProfile" and "userMessage".' },
        { status: 400 }
      );
    }

    const chatMessages: ChatMessage[] = Array.isArray(messages) ? messages : [];
    const reply = await generateChatReply(petProfile, chatMessages, userMessage);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
