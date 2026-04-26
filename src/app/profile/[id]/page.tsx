'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePetStore } from '@/lib/pet-store';
import { stripMarkdown } from '@/lib/utils';
import { speakWithBrowserTTS, stopBrowserTTS } from '@/lib/browser-tts';
import type { PetProfile, PersonalityResult } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Volume2,
  Loader2,
  MessageCircle,
  Camera,
  ArrowRight,
  Heart,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Waveform Bars – CSS-animated fake visualizer                      */
/* ------------------------------------------------------------------ */
function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8" aria-hidden>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary/80 transition-all"
          style={{
            height: playing ? undefined : '6px',
            animation: playing
              ? `waveform 0.8s ease-in-out ${i * 0.08}s infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                  */
/* ------------------------------------------------------------------ */
function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-[600px] overflow-hidden shadow-xl animate-fade-in-up">
        <CardContent className="p-8 space-y-6">
          {/* Image skeleton */}
          <div className="flex justify-center">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
          {/* Name */}
          <Skeleton className="h-10 w-3/5 mx-auto rounded-lg" />
          {/* Badges */}
          <div className="flex justify-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {/* Personality text */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          {/* Traits */}
          <div className="flex gap-2 justify-center flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          {/* Loading text */}
          <p className="text-center text-muted-foreground text-sm animate-pulse">
            Your pet is finding their voice...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const currentVisionResult = usePetStore((s) => s.currentVisionResult);
  const currentImageUrl = usePetStore((s) => s.currentImageUrl);
  const addPet = usePetStore((s) => s.addPet);
  const pets = usePetStore((s) => s.pets);
  const setVoiceCache = usePetStore((s) => s.setVoiceCache);

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPetIdRef = useRef<string | null>(null);
  const browserTTSActiveRef = useRef(false);

  /* ---- Generate voice for a given pet (click-to-play) ---- */
  const generateAndPlayVoice = useCallback(async (text: string, petId: string, voiceId?: string) => {
    setVoiceLoading(true);
    setVoiceError(false);

    // Check cache first
    const cached = usePetStore.getState().getVoiceCache(petId);
    if (cached) {
      console.log('[Profile] Using cached voice for pet:', petId);
      setAudioUrl(cached);
      setVoiceLoading(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(cached);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setIsPlaying(false));
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    try {
      console.log('[Profile] Generating voice for text length:', text.length);
      const voiceRes = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, petId }),
      });

      const ct = voiceRes.headers.get('content-type') || '';

      // Check if server signalled browser TTS fallback
      if (ct.includes('application/json')) {
        const data = await voiceRes.json();
        if (data.fallback) {
          console.log('[Profile] Using browser TTS fallback');
          setVoiceLoading(false);
          setIsPlaying(true);
          browserTTSActiveRef.current = true;
          try {
            await speakWithBrowserTTS(data.text || text);
          } finally {
            browserTTSActiveRef.current = false;
            setIsPlaying(false);
          }
          return;
        }
        // Non-fallback JSON means error
        throw new Error(data.error || 'Voice generation failed');
      }

      if (!voiceRes.ok) {
        throw new Error(`Voice generation failed (${voiceRes.status})`);
      }

      if (!ct.includes('audio')) {
        throw new Error('Voice API returned non-audio response');
      }

      const blob = await voiceRes.blob();
      if (blob.size === 0) {
        throw new Error('Voice API returned empty audio');
      }

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setVoiceCache(petId, url);
      setVoiceLoading(false);

      // Auto-play after generation
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setIsPlaying(false));

      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('[Profile] Voice generation failed:', err);
      setVoiceError(true);
      setVoiceLoading(false);
    }
  }, [setVoiceCache]);

  /* ---- Fetch personality ---- */
  const fetchProfile = useCallback(async () => {
    if (!currentVisionResult || !currentImageUrl) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Generate personality
      const personalityRes = await fetch('/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed: currentVisionResult.breed,
          species: currentVisionResult.species,
          visionLabels: currentVisionResult.labels,
        }),
      });

      if (!personalityRes.ok) {
        const err = await personalityRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate personality');
      }

      const personality: PersonalityResult = await personalityRes.json();

      // 2. Build PetProfile
      const newPet: PetProfile = {
        id: Date.now().toString(),
        name: personality.name,
        breed: currentVisionResult.breed,
        species: currentVisionResult.species,
        personality: personality.personality,
        traits: personality.traits,
        imageUrl: currentImageUrl,
        introText: personality.introText,
        careAdvice: personality.careAdvice,
      };

      addPet(newPet);
      setPet(newPet);
      setLoading(false);

      // Replace URL so back-navigation won't re-trigger generation
      router.replace(`/profile/${newPet.id}`);

      // Voice will be generated on user click (click-to-play)
      const cached = usePetStore.getState().getVoiceCache(newPet.id);
      if (cached) setAudioUrl(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }, [currentVisionResult, currentImageUrl, addPet, router]);

  /* ---- Mount logic ---- */
  useEffect(() => {
    // Reset audio state when petId changes
    if (lastPetIdRef.current !== id) {
      setAudioUrl(null);
      setIsPlaying(false);
      setVoiceError(false);
      setVoiceLoading(false);
      lastPetIdRef.current = id;
    }

    const init = () => {
      if (id === 'new') {
        if (!currentVisionResult || !currentImageUrl) {
          router.replace('/scan');
          return;
        }
        fetchProfile();
      } else {
        // Look up existing pet
        const found = pets.find((p) => p.id === id);
        if (found) {
          setPet(found);
          setLoading(false);

          // Pre-load cached voice URL if available (no auto-generate)
          const cached = usePetStore.getState().getVoiceCache(found.id);
          if (cached) setAudioUrl(cached);
        } else {
          router.replace('/scan');
        }
      }
    };
    init();

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopBrowserTTS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---- Cleanup blob URL ---- */
  // NOTE: Don't revoke blob URLs here — they are cached in the store
  // for reuse across navigations. They will be cleaned up on session end.

  /* ---- Play / Pause toggle ---- */
  const toggleAudio = () => {
    // Handle browser TTS stop
    if (browserTTSActiveRef.current && isPlaying) {
      stopBrowserTTS();
      browserTTSActiveRef.current = false;
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setIsPlaying(false));
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  /* ---- Loading state ---- */
  if (loading) return <ProfileSkeleton />;

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md shadow-xl animate-fade-in-up">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-5xl">😿</div>
            <h2 className="text-xl font-bold text-foreground">Oops!</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchProfile} className="w-full">
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/scan')}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              Back to Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pet) return null;

  /* ---- Trait color palette ---- */
  const traitColors = [
    'bg-primary/15 text-primary border-primary/20',
    'bg-secondary/15 text-secondary border-secondary/20',
    'bg-chart-3/15 text-chart-3 border-chart-3/20',
    'bg-chart-4/15 text-chart-4 border-chart-4/20',
    'bg-chart-5/15 text-chart-5 border-chart-5/20',
  ];

  /* ---- Profile card ---- */
  return (
    <div className="flex flex-col items-center justify-center p-4 py-8">
      <Card className="w-full max-w-[600px] overflow-hidden shadow-2xl animate-fade-in-up border-0">
        <CardContent className="p-0">
          {/* Hero image section */}
          <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 flex justify-center pt-10 pb-6">
            <div className="relative">
              <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-primary/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Paw badge */}
              <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-md text-lg">
                🐾
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 pt-4 space-y-6">
            {/* Name */}
            <h1
              className="text-3xl sm:text-4xl font-bold text-center text-foreground animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Meet {pet.name}! 🐾
            </h1>

            {/* Breed + Species badges */}
            <div
              className="flex justify-center gap-2 flex-wrap animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <Badge variant="default">{pet.breed}</Badge>
              <Badge variant="secondary">{pet.species}</Badge>
            </div>

            {/* Personality */}
            <div
              className="bg-muted/60 rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <p className="text-foreground/90 leading-relaxed text-[15px]">
                {stripMarkdown(pet.personality)}
              </p>
            </div>

            {/* Traits */}
            <div
              className="flex flex-wrap gap-2 justify-center animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {pet.traits.map((trait, i) => (
                <Badge
                  key={trait}
                  variant="outline"
                  className={`px-3 py-1 text-sm font-medium ${
                    traitColors[i % traitColors.length]
                  }`}
                >
                  {trait}
                </Badge>
              ))}
            </div>

            {/* Voice introduction — click-to-play */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              {voiceError ? (
                <button
                  onClick={() => {
                    setVoiceError(false);
                    generateAndPlayVoice(pet.introText, pet.id, pet.voiceId);
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors cursor-pointer"
                >
                  <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground/80">
                    Tap to retry voice
                  </span>
                </button>
              ) : voiceLoading ? (
                <div className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary/5 border border-primary/10">
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  <span className="text-sm text-foreground/80">Generating voice...</span>
                </div>
              ) : audioUrl ? (
                <button
                  onClick={toggleAudio}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Volume2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <WaveformBars playing={isPlaying} />
                  <span className="text-sm text-foreground/80">
                    {isPlaying ? 'Playing...' : `Listen to ${pet.name}'s introduction`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => generateAndPlayVoice(pet.introText, pet.id, pet.voiceId)}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors cursor-pointer"
                >
                  <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground/80">
                    🔊 Tap to hear {pet.name} speak
                  </span>
                </button>
              )}
            </div>

            {/* Intro text */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.55s' }}
            >
              <p className="text-muted-foreground text-sm italic text-center leading-relaxed">
                &ldquo;{stripMarkdown(pet.introText)}&rdquo;
              </p>
            </div>

            {/* Action buttons */}
            <div
              className="space-y-3 pt-2 animate-fade-in-up"
              style={{ animationDelay: '0.6s' }}
            >
              <Button
                size="lg"
                className="w-full text-base font-semibold animate-pulse-glow"
                onClick={() => router.push(`/chat/${pet.id}`)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat with {pet.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/scan')}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scan Another
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/care/${pet.id}`)}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Care Tips
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
