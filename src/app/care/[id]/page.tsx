'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePetStore } from '@/lib/pet-store';
import type { PetProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { stripMarkdown } from '@/lib/utils';
import {
  ArrowLeft,
  Heart,
  Utensils,
  Activity,
  Scissors,
  Users,
  RotateCcw,
  Sparkles,
  Pen,
  Plus,
  Star,
  X,
  StickyNote,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG = [
  { label: 'Health', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { label: 'Feeding', icon: Utensils, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { label: 'Exercise', icon: Activity, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { label: 'Grooming', icon: Scissors, color: 'text-violet-500 bg-violet-50 border-violet-200' },
  { label: 'Social', icon: Users, color: 'text-sky-500 bg-sky-50 border-sky-200' },
];

const DAILY_TASKS: Record<string, string[]> = {
  dog: ['Morning walk', 'Fresh water', 'Meal time', 'Play session', 'Evening walk', 'Brushing'],
  cat: ['Fresh water', 'Clean litter box', 'Meal time', 'Play session', 'Grooming', 'Cuddle time'],
  default: ['Fresh water', 'Meal time', 'Play session', 'Clean living area', 'Health check', 'Bonding time'],
};

const GENERIC_TIPS = [
  'Provide fresh water daily and keep food bowls clean.',
  'Regular exercise keeps your pet healthy and happy.',
  'Schedule annual vet check-ups for preventive care.',
  'Groom your pet regularly to maintain coat health.',
  'Spend quality time socializing with your pet every day.',
];

const FUN_FACTS = [
  'Pets can reduce stress levels and lower blood pressure in their owners.',
  'Dogs can understand up to 250 words and gestures.',
  'A cat\'s purr vibrates at a frequency that can promote healing.',
  'Playing with your pet for just 15 minutes a day strengthens your bond significantly.',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStorageKey(petId: string) {
  return `petspeak-care-${petId}`;
}

function loadChecklist(petId: string, length: number): boolean[] {
  try {
    const raw = localStorage.getItem(getStorageKey(petId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === length) return parsed;
    }
  } catch {
    // localStorage unavailable or corrupt — fall through
  }
  return new Array(length).fill(false);
}

function saveChecklist(petId: string, items: boolean[]) {
  try {
    localStorage.setItem(getStorageKey(petId), JSON.stringify(items));
  } catch {
    // silent fail if storage unavailable
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

function getEmoji(pct: number) {
  if (pct === 0) return '😢';
  if (pct <= 33) return '😿';
  if (pct <= 66) return '😐';
  if (pct < 100) return '😊';
  return '🥰';
}

function getProgressColor(pct: number) {
  if (pct <= 33) return 'bg-rose-500';
  if (pct <= 66) return 'bg-amber-400';
  return 'bg-emerald-500';
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CarePage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const pets = usePetStore((s) => s.pets);
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  /* ---- Custom user data ---- */
  const [notes, setNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const [customTasks, setCustomTasks] = useState<string[]>([]);
  const [customTaskChecks, setCustomTaskChecks] = useState<boolean[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  const [customFacts, setCustomFacts] = useState<string[]>([]);
  const [factInput, setFactInput] = useState('');
  const [showFactInput, setShowFactInput] = useState(false);

  /* ---- Resolve pet on mount ---- */
  useEffect(() => {
    const init = () => {
      const found = pets.find((p) => p.id === petId);
      if (!found) {
        router.replace('/scan');
        return;
      }
      setPet(found);

      const species = found.species.toLowerCase();
      const dailyTasks = DAILY_TASKS[species] ?? DAILY_TASKS.default;
      setTasks(dailyTasks);
      setChecklist(loadChecklist(petId, dailyTasks.length));

      // Load custom user data
      setNotes(loadFromStorage<string[]>(`petspeak-notes-${petId}`, []));
      const ct = loadFromStorage<string[]>(`petspeak-custom-tasks-${petId}`, []);
      setCustomTasks(ct);
      setCustomTaskChecks(loadFromStorage<boolean[]>(`petspeak-custom-checks-${petId}`, new Array(ct.length).fill(false)));
      setCustomFacts(loadFromStorage<string[]>(`petspeak-facts-${petId}`, []));

      setMounted(true);
    };
    init();
  }, [petId, pets, router]);

  /* ---- Toggle a checklist item ---- */
  const toggle = useCallback(
    (index: number) => {
      setChecklist((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        saveChecklist(petId, next);
        return next;
      });
    },
    [petId],
  );

  /* ---- Reset checklist ---- */
  const resetChecklist = useCallback(() => {
    const cleared = new Array(tasks.length).fill(false);
    setChecklist(cleared);
    saveChecklist(petId, cleared);
    const customCleared = new Array(customTasks.length).fill(false);
    setCustomTaskChecks(customCleared);
    saveToStorage(`petspeak-custom-checks-${petId}`, customCleared);
  }, [petId, tasks.length, customTasks.length]);

  /* ---- Custom notes helpers ---- */
  const addNote = useCallback(() => {
    const text = noteInput.trim();
    if (!text) return;
    const next = [...notes, text];
    setNotes(next);
    saveToStorage(`petspeak-notes-${petId}`, next);
    setNoteInput('');
  }, [noteInput, notes, petId]);

  const removeNote = useCallback((i: number) => {
    const next = notes.filter((_, idx) => idx !== i);
    setNotes(next);
    saveToStorage(`petspeak-notes-${petId}`, next);
  }, [notes, petId]);

  /* ---- Custom task helpers ---- */
  const addCustomTask = useCallback(() => {
    const text = taskInput.trim();
    if (!text) return;
    const nextTasks = [...customTasks, text];
    const nextChecks = [...customTaskChecks, false];
    setCustomTasks(nextTasks);
    setCustomTaskChecks(nextChecks);
    saveToStorage(`petspeak-custom-tasks-${petId}`, nextTasks);
    saveToStorage(`petspeak-custom-checks-${petId}`, nextChecks);
    setTaskInput('');
  }, [taskInput, customTasks, customTaskChecks, petId]);

  const removeCustomTask = useCallback((i: number) => {
    const nextTasks = customTasks.filter((_, idx) => idx !== i);
    const nextChecks = customTaskChecks.filter((_, idx) => idx !== i);
    setCustomTasks(nextTasks);
    setCustomTaskChecks(nextChecks);
    saveToStorage(`petspeak-custom-tasks-${petId}`, nextTasks);
    saveToStorage(`petspeak-custom-checks-${petId}`, nextChecks);
  }, [customTasks, customTaskChecks, petId]);

  const toggleCustomTask = useCallback((i: number) => {
    const next = [...customTaskChecks];
    next[i] = !next[i];
    setCustomTaskChecks(next);
    saveToStorage(`petspeak-custom-checks-${petId}`, next);
  }, [customTaskChecks, petId]);

  /* ---- Custom fact helpers ---- */
  const addFact = useCallback(() => {
    const text = factInput.trim();
    if (!text) return;
    const next = [...customFacts, text];
    setCustomFacts(next);
    saveToStorage(`petspeak-facts-${petId}`, next);
    setFactInput('');
  }, [factInput, customFacts, petId]);

  const removeFact = useCallback((i: number) => {
    const next = customFacts.filter((_, idx) => idx !== i);
    setCustomFacts(next);
    saveToStorage(`petspeak-facts-${petId}`, next);
  }, [customFacts, petId]);

  if (!pet || !mounted) return null;

  /* ---- Derived values ---- */
  const tips = pet.careAdvice.length > 0 ? pet.careAdvice : GENERIC_TIPS;
  const totalChecked = checklist.filter(Boolean).length + customTaskChecks.filter(Boolean).length;
  const totalTasks = tasks.length + customTasks.length;
  const pct = totalTasks > 0 ? Math.round((totalChecked / totalTasks) * 100) : 0;

  return (
    <div className="pb-16">
      {/* ---- Sub-header ---- */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/profile/${petId}`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold truncate leading-tight">
              Care Guide for {pet.name}
            </h1>
            <Badge variant="secondary" className="text-[11px] px-2 py-0">
              {pet.breed}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        {/* ============================================================ */}
        {/*  Pet Happiness Meter                                         */}
        {/* ============================================================ */}
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: '0.05s' }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">Pet Happiness</span>
                <span className="text-2xl" role="img" aria-label="mood">
                  {getEmoji(pct)}
                </span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${getProgressColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right tabular-nums">
                {pct}% — {totalChecked}/{totalTasks} tasks done
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/*  Care Tips Card Grid                                         */}
        {/* ============================================================ */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Breed-Specific Care Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map((tip, i) => {
              const cat = CATEGORY_CONFIG[i % CATEGORY_CONFIG.length];
              const Icon = cat.icon;
              return (
                <Card
                  key={i}
                  className={`border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-fade-in-up`}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${cat.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {cat.label}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {stripMarkdown(tip)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/*  Daily Care Checklist                                        */}
        {/* ============================================================ */}
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Daily Care Checklist</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChecklist}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-2">
              {tasks.map((task, i) => {
                const checked = checklist[i] ?? false;
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggle(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      checked
                        ? 'bg-emerald-50 scale-[0.99]'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(i)}
                      className="pointer-events-none"
                    />
                    <span
                      className={`text-sm transition-all duration-200 ${
                        checked
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {task}
                    </span>
                    {checked && (
                      <span className="ml-auto text-emerald-500 text-xs font-medium">
                        Done ✓
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom tasks */}
              {customTasks.map((task, i) => {
                const checked = customTaskChecks[i] ?? false;
                return (
                  <div
                    key={`custom-${i}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 animate-fade-in-up ${
                      checked ? 'bg-emerald-50 scale-[0.99]' : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCustomTask(i)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <Pen className="h-3 w-3 text-primary/50 shrink-0" />
                      <span className={`text-sm transition-all duration-200 ${
                        checked ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task}
                      </span>
                      {checked && (
                        <span className="ml-auto text-emerald-500 text-xs font-medium">Done ✓</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomTask(i)}
                      className="p-1 rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Add custom task */}
          <div className="mt-3">
            {showTaskInput ? (
              <div className="flex gap-2 animate-fade-in-up">
                <Input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                  placeholder="e.g. Brush teeth, Trim nails…"
                  className="flex-1 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={addCustomTask} disabled={!taskInput.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowTaskInput(false); setTaskInput(''); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTaskInput(true)}
                className="w-full border-dashed text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Custom Task
              </Button>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/*  Fun Pet Facts                                               */}
        {/* ============================================================ */}
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: '0.55s' }}
        >
          <h2 className="text-lg font-bold mb-4">Fun Pet Facts 💡</h2>
          <div className="space-y-3">
            {/* Custom facts first */}
            {customFacts.map((fact, i) => (
              <div
                key={`custom-fact-${i}`}
                className="flex gap-3 items-start bg-amber-50/60 rounded-xl px-4 py-3 border border-amber-200/60 animate-fade-in-up"
              >
                <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 fill-amber-400" />
                <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                  {fact}
                </p>
                <button
                  type="button"
                  onClick={() => removeFact(i)}
                  className="p-1 rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Generic facts */}
            {FUN_FACTS.map((fact, i) => (
              <div
                key={i}
                className="flex gap-3 items-start bg-muted/40 rounded-xl px-4 py-3 border border-border/50"
              >
                <span className="text-primary font-bold text-lg leading-none mt-0.5">
                  {customFacts.length + i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {fact}
                </p>
              </div>
            ))}

            {/* Add custom fact */}
            {showFactInput ? (
              <div className="flex gap-2 animate-fade-in-up">
                <Input
                  value={factInput}
                  onChange={(e) => setFactInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFact()}
                  placeholder={`Fun fact about ${pet.name}…`}
                  className="flex-1 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={addFact} disabled={!factInput.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowFactInput(false); setFactInput(''); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFactInput(true)}
                className="w-full border-dashed text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add your own fun fact about {pet.name}
              </Button>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/*  Personal Notes                                              */}
        {/* ============================================================ */}
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: '0.65s' }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Personal Notes about {pet.name}
          </h2>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 space-y-2">
              {notes.length === 0 && !showNoteInput && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No notes yet — add something special about {pet.name}!
                </p>
              )}

              {notes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-muted/40 rounded-xl px-4 py-3 border border-border/50 animate-fade-in-up"
                >
                  <Pen className="h-3.5 w-3.5 text-primary/50 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/90 leading-relaxed flex-1">{note}</p>
                  <button
                    type="button"
                    onClick={() => removeNote(i)}
                    className="p-1 rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {showNoteInput ? (
                <div className="flex gap-2 animate-fade-in-up">
                  <Input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder={`e.g. ${pet.name} loves watching Korean dramas with me`}
                    className="flex-1 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={addNote} disabled={!noteInput.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNoteInput(false); setNoteInput(''); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNoteInput(true)}
                  className="w-full border-dashed text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add a Note
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ---- Bottom nav ---- */}
        <div className="flex gap-3 pt-2 pb-4 animate-fade-in-up" style={{ animationDelay: '0.75s' }}>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/profile/${petId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push(`/chat/${petId}`)}
          >
            Chat with {pet.name}
          </Button>
        </div>
      </main>
    </div>
  );
}
