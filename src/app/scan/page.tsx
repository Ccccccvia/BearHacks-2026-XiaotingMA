'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Camera,
  Upload,
  Loader2,
  PawPrint,
  ArrowRight,
  RefreshCw,
  X,
  ImageIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePetStore } from '@/lib/pet-store';
import type { VisionResult } from '@/lib/types';

type PageState = 'input' | 'preview' | 'analyzing' | 'result' | 'error';

export default function ScanPage() {
  const router = useRouter();
  const setVisionResult = usePetStore((s) => s.setVisionResult);

  const [pageState, setPageState] = useState<PageState>('input');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // ---------- Camera ----------
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera access was denied. Please allow camera permissions or upload a photo instead.'
      );
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImageDataUrl(dataUrl);
    setPageState('preview');
    stopCamera();
  }, [stopCamera]);

  // Wire stream to video element after it mounts
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ---------- File Upload ----------
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setPageState('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  // ---------- Sample Image ----------
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleSampleImage = useCallback(
    async (imagePath: string, petName: string) => {
      setLoadingSample(petName);
      try {
        const response = await fetch(imagePath);
        if (!response.ok) {
          throw new Error(`Image not found: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error('Invalid image response — expected an image file');
        }
        const blob = await response.blob();
        const file = new File([blob], `${petName}.jpg`, { type: 'image/jpeg' });
        handleFile(file);
      } catch (error) {
        console.error('Failed to load sample image:', error);
        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Failed to load sample image. Please try uploading your own photo.'
        );
        setPageState('error');
      } finally {
        setLoadingSample(null);
      }
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ---------- Analyze ----------
  const analyze = useCallback(async () => {
    if (!imageDataUrl) return;
    setPageState('analyzing');
    setErrorMsg('');
    try {
      const base64 = imageDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      // Guard: ensure we received JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error(
          `Server returned an unexpected response (${res.status}). Please try again.`
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data as VisionResult);
      setPageState('result');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPageState('error');
    }
  }, [imageDataUrl]);

  const resetAll = useCallback(() => {
    setImageDataUrl(null);
    setResult(null);
    setErrorMsg('');
    setPageState('input');
  }, []);

  const proceedToProfile = useCallback(() => {
    if (result && imageDataUrl) {
      setVisionResult(result, imageDataUrl);
      router.push('/profile/new');
    }
  }, [result, imageDataUrl, setVisionResult, router]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      {/* Page title */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <PawPrint className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pet Scanner</h1>
        <p className="mt-2 text-muted-foreground">
          Snap a photo or upload one — we&apos;ll identify your pet&apos;s breed instantly.
        </p>
      </div>

      {/* -------- INPUT STATE -------- */}
      {pageState === 'input' && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Camera section */}
          <Card className="overflow-hidden border-border/60 shadow-sm">
            {cameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-t-xl bg-black aspect-video object-cover"
                />
                <div className="flex gap-3 justify-center p-4">
                  <Button size="lg" onClick={captureFrame} className="animate-pulse-glow">
                    <Camera className="mr-2 h-5 w-5" />
                    Capture
                  </Button>
                  <Button size="lg" variant="outline" onClick={stopCamera}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={startCamera}
                className="flex w-full flex-col items-center gap-3 p-8 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <span className="text-lg font-semibold">Open Camera</span>
                <span className="text-sm text-muted-foreground">
                  Take a photo of your pet right now
                </span>
              </button>
            )}
            {cameraError && (
              <div className="flex items-center gap-2 border-t bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {cameraError}
              </div>
            )}
          </Card>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Drag & drop / upload */}
          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
            } flex flex-col items-center gap-3 p-10 text-center`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
              <Upload className="h-7 w-7 text-secondary" />
            </div>
            <span className="text-lg font-semibold">
              {isDragging ? 'Drop it here!' : 'Upload a Photo'}
            </span>
            <span className="text-sm text-muted-foreground">
              Drag & drop or click to browse — JPG, PNG, WebP
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </Card>

          {/* Sample pets divider */}
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Or try with our sample pets
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Sample pet cards */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { path: '/test_pics/xiaolin.jpg', name: 'Xiaolin' },
              { path: '/test_pics/zhangyuanyuan.jpg', name: 'Zhang Yuanyuan' },
            ].map((pet) => (
              <button
                key={pet.name}
                onClick={() => handleSampleImage(pet.path, pet.name)}
                disabled={loadingSample !== null}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-b from-orange-50/60 to-amber-50/40 dark:from-orange-950/20 dark:to-amber-950/10 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <div className="relative h-40 w-40 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                  {loadingSample === pet.name ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Image
                      src={pet.path}
                      alt={pet.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="160px"
                    />
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">
                  {pet.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------- PREVIEW STATE -------- */}
      {pageState === 'preview' && imageDataUrl && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="overflow-hidden shadow-sm">
            <div className="relative aspect-video w-full bg-muted">
              <Image
                src={imageDataUrl}
                alt="Pet preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={resetAll}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Choose Different Photo
            </Button>
            <Button size="lg" className="flex-1 animate-pulse-glow" onClick={analyze}>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyze My Pet
            </Button>
          </div>
        </div>
      )}

      {/* -------- ANALYZING STATE -------- */}
      {pageState === 'analyzing' && (
        <div className="flex flex-col items-center gap-6 py-16 animate-fade-in-up">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <PawPrint className="absolute h-7 w-7 text-primary animate-bounce" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">Analyzing your pet...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is studying every adorable detail
            </p>
          </div>
        </div>
      )}

      {/* -------- RESULT STATE -------- */}
      {pageState === 'result' && result && imageDataUrl && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="overflow-hidden shadow-md">
            {/* Image */}
            <div className="relative aspect-video w-full bg-muted">
              <Image
                src={imageDataUrl}
                alt="Your pet"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-secondary text-secondary-foreground text-sm px-3 py-1">
                  {result.species}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 border-primary/30 text-primary"
                >
                  {Math.round(result.confidence * 100)}% confident
                </Badge>
              </div>

              <h2 className="text-2xl font-bold tracking-tight">{result.breed}</h2>

              {result.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="sm:flex-none" onClick={resetAll}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Another
            </Button>
            <Button size="lg" className="flex-1 animate-pulse-glow" onClick={proceedToProfile}>
              <ImageIcon className="mr-2 h-5 w-5" />
              Generate {result.species}&apos;s Voice
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* -------- ERROR STATE -------- */}
      {pageState === 'error' && (
        <div className="animate-fade-in-up">
          <Card className="flex flex-col items-center gap-4 p-8 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Couldn&apos;t Identify a Pet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {errorMsg || 'We couldn\'t detect a pet in this photo. Try a clearer image with your pet in focus.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={resetAll}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => {
                  setPageState('preview');
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Analysis
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
