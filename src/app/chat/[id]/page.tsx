'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePetStore } from '@/lib/pet-store';
import { stripMarkdown } from '@/lib/utils';
import type { PetProfile, ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  ArrowUp,
  Volume2,
  Loader2,
  RotateCcw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Waveform Bars – mini visualizer for playing audio                 */
/* ------------------------------------------------------------------ */
function MiniWaveform() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3 ml-1" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-primary/70"
          style={{
            animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator – three bouncing dots                            */
/* ------------------------------------------------------------------ */
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 animate-chat-in">
      <div className="w-8 h-8 shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground ml-1">{name} is typing...</span>
        <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message Bubble                                                    */
/* ------------------------------------------------------------------ */
function MessageBubble({
  message,
  pet,
  playingId,
  loadingVoiceId,
  onPlayAudio,
}: {
  message: ChatMessage;
  pet: PetProfile;
  playingId: string | null;
  loadingVoiceId: string | null;
  onPlayAudio: (msg: ChatMessage) => void;
}) {
  const isUser = message.role === 'user';
  const isPlaying = playingId === message.id;
  const isLoadingVoice = loadingVoiceId === message.id;

  if (isUser) {
    return (
      <div className="flex justify-end animate-chat-in">
        <div className="max-w-[75%] sm:max-w-[65%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-[15px] leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 animate-chat-in">
      <Avatar size="sm" className="shrink-0 mb-1">
        <AvatarImage src={pet.imageUrl} />
        <AvatarFallback>{pet.name[0]}</AvatarFallback>
      </Avatar>
      <div className="max-w-[75%] sm:max-w-[65%]">
        <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-[15px] leading-relaxed text-foreground">{stripMarkdown(message.content)}</p>
          <button
            onClick={() => onPlayAudio(message)}
            disabled={isLoadingVoice}
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:cursor-wait"
          >
            {isLoadingVoice ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : isPlaying ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <span>Playing</span><MiniWaveform />
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>Play voice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error Message Bubble                                              */
/* ------------------------------------------------------------------ */
function ErrorBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-end gap-2 animate-chat-in">
      <div className="w-8 h-8 shrink-0" />
      <div className="max-w-[75%] sm:max-w-[65%]">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-destructive/80">Couldn&apos;t get a response.</p>
          <button
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Tap to retry
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Chat Page                                                    */
/* ------------------------------------------------------------------ */
export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  /* ---- Store ---- */
  const pets = usePetStore((s) => s.pets);
  const addChatMessage = usePetStore((s) => s.addChatMessage);
  const getChatMessages = usePetStore((s) => s.getChatMessages);

  /* ---- Local state ---- */
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState('');
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);

  /* ---- Generate voice on demand for a specific message ---- */
  const generateVoiceForMessage = useCallback(async (text: string, petProfile: PetProfile, _messageId: string) => {
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: petProfile.voiceId, petId: petProfile.id }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error('[Chat] Voice API error:', res.status, errBody);
        return undefined;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('audio')) {
        console.error('[Chat] Voice API returned non-audio content-type:', ct);
        return undefined;
      }
      const blob = await res.blob();
      if (blob.size === 0) return undefined;
      const url = URL.createObjectURL(blob);
      blobUrls.current.push(url);
      return url;
    } catch (err) {
      console.error('[Chat] Voice generation error:', err);
      return undefined;
    }
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrls = useRef<string[]>([]);
  const greetingSent = useRef(false);

  /* ---- Scroll to bottom ---- */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  /* ---- Refs ---- */

  /* ---- Play audio (stops any previous playback first) ---- */
  const playAudio = useCallback((url: string, messageId: string) => {
    // Always stop previous audio before starting new
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingId(null);
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(messageId);
    audio.addEventListener('ended', () => {
      setPlayingId(null);
      audioRef.current = null;
    });
    audio.play().catch(() => setPlayingId(null));
  }, []);

  const handlePlayAudio = useCallback(async (msg: ChatMessage) => {
    // If already playing this message, stop it
    if (playingId === msg.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      audioRef.current = null;
      return;
    }

    // If audio already cached on message, just play it
    if (msg.audioUrl) {
      playAudio(msg.audioUrl, msg.id);
      return;
    }

    // Otherwise generate on demand
    if (!pet) return;
    setLoadingVoiceId(msg.id);
    const audioUrl = await generateVoiceForMessage(msg.content, pet, msg.id);
    setLoadingVoiceId(null);
    if (audioUrl) {
      const msgWithAudio = { ...msg, audioUrl };
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msgWithAudio : m)));
      playAudio(audioUrl, msg.id);
    }
  }, [playingId, playAudio, pet, generateVoiceForMessage]);

  /* ---- Send message flow ---- */
  const sendMessage = useCallback(async (userMessage: string, currentPet: PetProfile, currentMessages: ChatMessage[]) => {
    setShowError(false);
    setLastUserMsg(userMessage);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    addChatMessage(id, userMsg);
    setInputValue('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Call chat API — send only prior messages as context (userMessage is sent separately)
      const contextMessages = currentMessages.slice(-10);
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petProfile: currentPet,
          messages: contextMessages,
          userMessage,
        }),
      });

      if (!chatRes.ok) throw new Error('Chat API failed');
      const { reply } = await chatRes.json();

      // Create pet message
      const petMsg: ChatMessage = {
        id: `pet-${Date.now()}`,
        role: 'pet',
        content: reply,
        timestamp: Date.now(),
      };

      setIsLoading(false);
      const withPetMsg = [...updatedMessages, petMsg];
      setMessages(withPetMsg);
      addChatMessage(id, petMsg);
      scrollToBottom();

      // Voice is now click-to-play — no auto-generation
    } catch {
      setIsLoading(false);
      setShowError(true);
      scrollToBottom();
    }
  }, [id, addChatMessage, scrollToBottom]);

  /* ---- Send greeting ---- */
  const sendGreeting = useCallback(async (currentPet: PetProfile) => {
    setIsLoading(true);
    scrollToBottom();

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petProfile: currentPet,
          messages: [],
          userMessage: 'Greet your owner for the first time in a fun, enthusiastic way! Keep it short and sweet.',
        }),
      });

      if (!chatRes.ok) throw new Error('Greeting failed');
      const { reply } = await chatRes.json();

      const greetingMsg: ChatMessage = {
        id: `pet-greeting-${Date.now()}`,
        role: 'pet',
        content: reply,
        timestamp: Date.now(),
      };

      setIsLoading(false);
      setMessages([greetingMsg]);
      addChatMessage(id, greetingMsg);
      scrollToBottom();

      // Voice is now click-to-play — no auto-generation for greeting
    } catch {
      setIsLoading(false);
      // Use introText as fallback greeting
      const fallbackMsg: ChatMessage = {
        id: `pet-greeting-${Date.now()}`,
        role: 'pet',
        content: currentPet.introText,
        timestamp: Date.now(),
      };
      setMessages([fallbackMsg]);
      addChatMessage(id, fallbackMsg);
      scrollToBottom();
    }
  }, [id, addChatMessage, scrollToBottom]);

  /* ---- Mount: resolve pet and load history ---- */
  useEffect(() => {
    const init = () => {
      const found = pets.find((p) => p.id === id);
      if (!found) {
        router.replace('/scan');
        return;
      }
      setPet(found);

      // Load existing messages from store
      const existing = getChatMessages(id);
      if (existing.length > 0) {
        setMessages(existing);
      } else if (!greetingSent.current) {
        greetingSent.current = true;
        sendGreeting(found);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pets]);

  /* ---- Scroll on new messages ---- */
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  /* ---- Cleanup ---- */
  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /* ---- Handle submit ---- */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || !pet) return;
    sendMessage(trimmed, pet, messages);
  };

  /* ---- Retry last failed message ---- */
  const handleRetry = () => {
    if (!pet || !lastUserMsg) return;
    setShowError(false);
    // Remove the failed user message and resend
    const withoutLast = messages.filter((m) => m.content !== lastUserMsg || m.role !== 'user');
    setMessages(withoutLast);
    sendMessage(lastUserMsg, pet, withoutLast);
  };

  if (!pet) return null;

  /* ---- Render ---- */
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* ---- Context Bar / Header ---- */}
      <div className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 py-2.5">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/profile/${id}`)}
            aria-label="Back to profile"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar size="sm">
            <AvatarImage src={pet.imageUrl} />
            <AvatarFallback>{pet.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{pet.name}</h1>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{pet.breed}</Badge>
        </div>
      </div>

      {/* ---- Messages area ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {/* Welcome text when empty */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-muted-foreground text-sm">
                Starting a conversation with {pet.name}...
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              pet={pet}
              playingId={playingId}
              loadingVoiceId={loadingVoiceId}
              onPlayAudio={handlePlayAudio}
            />
          ))}

          {/* Error bubble */}
          {showError && <ErrorBubble onRetry={handleRetry} />}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator name={pet.name} />}

          {/* Scroll anchor */}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* ---- Input area ---- */}
      <div className="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-md px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Say something to ${pet.name}...`}
            disabled={isLoading}
            className="flex-1 h-10 rounded-full border border-input bg-card px-4 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="rounded-full shrink-0 h-10 w-10"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
