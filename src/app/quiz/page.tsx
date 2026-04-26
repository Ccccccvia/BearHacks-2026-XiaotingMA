'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RotateCcw, BookOpen, ArrowRight, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Question types & data                                              */
/* ------------------------------------------------------------------ */
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTION_POOL: QuizQuestion[] = [
  // ── Food Safety ─────────────────────────────────────────────────
  { question: 'True or False: Chocolate is safe for dogs in small amounts.', options: ['True', 'False'], correctIndex: 1, explanation: 'All types of chocolate are toxic to dogs. Dark and baking chocolate are the most dangerous due to theobromine.' },
  { question: 'True or False: Grapes and raisins can cause kidney failure in dogs.', options: ['True', 'False'], correctIndex: 0, explanation: 'Even a small number of grapes or raisins can be fatal to dogs by causing acute kidney failure.' },
  { question: 'Which of these foods is toxic to both dogs AND cats?', options: ['Carrots', 'Blueberries', 'Onions & Garlic', 'Plain rice'], correctIndex: 2, explanation: 'Onions and garlic damage red blood cells in both dogs and cats, leading to anemia.' },
  { question: 'Xylitol (a sugar-free sweetener) is most dangerous to which pet?', options: ['Cats', 'Dogs', 'Both equally', 'Neither — it\'s safe'], correctIndex: 1, explanation: 'Xylitol causes rapid insulin release and liver failure in dogs. Check labels on peanut butter and gum!' },
  { question: 'True or False: Most adult cats can safely drink cow\'s milk.', options: ['True', 'False'], correctIndex: 1, explanation: 'Most adult cats are lactose intolerant. Cow\'s milk can cause stomach cramps, bloating, and diarrhea.' },
  { question: 'Which of these is a SAFE snack for dogs?', options: ['Macadamia nuts', 'Chocolate chip cookies', 'Carrots', 'Grapes'], correctIndex: 2, explanation: 'Carrots are great low-calorie treats that are also good for dental health!' },
  { question: 'True or False: Caffeine is safe for pets.', options: ['True', 'False'], correctIndex: 1, explanation: 'Caffeine can cause restlessness, rapid breathing, heart palpitations, and muscle tremors in pets.' },
  { question: 'Macadamia nuts can cause which symptom in dogs?', options: ['Better coat quality', 'Weakness in hind legs', 'Improved digestion', 'Increased energy'], correctIndex: 1, explanation: 'Within 12 hours, dogs may experience weakness (especially hind legs), vomiting, and tremors.' },

  // ── Grooming ─────────────────────────────────────────────────────
  { question: 'What temperature should bathwater be for your pet?', options: ['Cold', 'Hot', 'Lukewarm (~37°C / 98°F)', 'Room temperature'], correctIndex: 2, explanation: 'Lukewarm water is best. Hot water can scald and cold water is uncomfortable for pets.' },
  { question: 'How often do most dogs need a bath?', options: ['Every day', 'Every week', 'Every 4–8 weeks', 'Once a year'], correctIndex: 2, explanation: 'Most dogs need a bath every 4–8 weeks. Over-bathing strips natural oils from their coat.' },
  { question: 'How often should long-haired breeds be brushed?', options: ['Monthly', 'Weekly', 'Daily', 'Never — they self-groom'], correctIndex: 2, explanation: 'Long-haired breeds need daily brushing to prevent painful mats and tangles.' },
  { question: 'True or False: You should use human shampoo on your dog.', options: ['True', 'False'], correctIndex: 1, explanation: 'Human shampoo disrupts pets\' skin pH balance. Always use pet-specific shampoo.' },
  { question: 'How often should you trim your pet\'s nails?', options: ['Every 3–4 weeks', 'Once a year', 'Every 6 months', 'Only when they break'], correctIndex: 0, explanation: 'Overgrown nails can curl into paw pads, causing pain and infection. Trim every 3–4 weeks.' },
  { question: 'What percentage of dogs show dental disease by age 3?', options: ['20%', '50%', 'Over 80%', '10%'], correctIndex: 2, explanation: 'Over 80% of dogs and 70% of cats show signs of dental disease by age 3. Brush regularly!' },

  // ── Exercise ─────────────────────────────────────────────────────
  { question: 'How much daily exercise does a large/working dog breed need?', options: ['10 minutes', '30 minutes', '1–2 hours', '5 minutes'], correctIndex: 2, explanation: 'Large and working breeds like Huskies or Border Collies may need 1–2 hours of vigorous exercise daily.' },
  { question: 'True or False: Mental stimulation is just as important as physical exercise for dogs.', options: ['True', 'False'], correctIndex: 0, explanation: 'Puzzle feeders, training sessions, and hide-and-seek games keep dogs mentally sharp and prevent destructive behavior.' },
  { question: 'How much active play do cats need daily?', options: ['None — cats exercise themselves', '15–30 minutes', '2 hours', '5 minutes'], correctIndex: 1, explanation: 'Cats need 15–30 minutes of active play daily. Cat trees and wand toys are universally loved.' },
  { question: 'Why should you end a laser pointer session with a real treat?', options: ['Cats get hungry', 'To prevent frustration from never catching "prey"', 'The laser runs out of battery', 'It\'s tradition'], correctIndex: 1, explanation: 'Laser pointers can cause anxiety because the cat never catches the prey. End with a treat for satisfaction.' },
  { question: 'Which is a sign of over-exercise in dogs?', options: ['Wagging tail', 'Excessive panting that won\'t stop', 'Playful barking', 'Rolling over'], correctIndex: 1, explanation: 'Excessive panting, limping, or reluctance to continue walking are signs your dog has had too much exercise.' },

  // ── Health ───────────────────────────────────────────────────────
  { question: 'At what age do puppies start their core vaccinations?', options: ['1 year old', '6 months', '6–8 weeks', 'Birth'], correctIndex: 2, explanation: 'Puppies start core vaccinations (like DHPP) at 6–8 weeks with boosters every 3–4 weeks until 16 weeks.' },
  { question: 'True or False: Parasite prevention is only needed in summer months.', options: ['True', 'False'], correctIndex: 1, explanation: 'Year-round flea, tick, and worm prevention is essential — not just in warm months.' },
  { question: 'Which is an emergency sign requiring immediate vet care?', options: ['Mild sneezing', 'Difficulty breathing', 'Wagging slowly', 'Sleeping more than usual'], correctIndex: 1, explanation: 'Difficulty breathing, seizures, uncontrolled bleeding, and inability to urinate need immediate vet care.' },
  { question: 'True or False: Annual wellness exams are unnecessary if your pet seems healthy.', options: ['True', 'False'], correctIndex: 1, explanation: 'Annual wellness exams catch problems early, even when your pet appears healthy.' },

  // ── Social & Behavioral ─────────────────────────────────────────
  { question: 'What is the critical socialization window for puppies?', options: ['6–12 months', '3–14 weeks', '1–2 years', 'Any age works equally'], correctIndex: 1, explanation: 'The 3–14 week window is when puppies are most receptive to new experiences. Positive exposure prevents fear-based aggression later.' },
  { question: 'True or False: A wagging tail always means a dog is happy.', options: ['True', 'False'], correctIndex: 1, explanation: 'A low, slow wag can signal uncertainty. Body language is complex — look at ears, posture, and context too.' },
  { question: 'What does a slow blink from a cat mean?', options: ['They\'re tired', 'Trust and affection', 'They want food', 'They\'re annoyed'], correctIndex: 1, explanation: 'Slow blinks from a cat are a sign of trust and affection — try slow-blinking back!' },
  { question: 'Which is a sign of stress in cats?', options: ['Purring', 'Over-grooming (bald patches)', 'Slow blinking', 'Kneading'], correctIndex: 1, explanation: 'Cats may over-groom, hide, refuse food, or urinate outside the litter box when stressed.' },
  { question: 'What can help a dog with separation anxiety?', options: ['Dramatic goodbyes', 'Leaving a worn piece of clothing', 'Punishment when you return', 'Loud music'], correctIndex: 1, explanation: 'Leave a worn piece of clothing for comfort. Don\'t make departures dramatic. Gradual desensitization helps.' },

  // ── Home Safety ─────────────────────────────────────────────────
  { question: 'Which houseplant is extremely toxic to cats?', options: ['Spider plant', 'Boston fern', 'Lily', 'African violet'], correctIndex: 2, explanation: 'Lilies are extremely toxic to cats — even small amounts can cause kidney failure.' },
  { question: 'True or False: Cracking car windows prevents pets from overheating.', options: ['True', 'False'], correctIndex: 1, explanation: 'Cracking windows does virtually nothing. A car can reach 46°C (115°F) in 30 minutes on a 25°C day.' },
  { question: 'What is the #1 cause of pet poisoning at home?', options: ['Chocolate', 'Human medications', 'Cleaning products', 'Houseplants'], correctIndex: 1, explanation: 'Human medications (NSAIDs, acetaminophen, antidepressants) are a top cause of pet poisoning.' },
  { question: 'Why should you wipe your dog\'s paws after winter walks?', options: ['To keep floors clean', 'To remove toxic salt and de-icers', 'Just for fun', 'To check for ticks'], correctIndex: 1, explanation: 'Road salt and de-icers are toxic if licked. Antifreeze has a sweet taste but is deadly — clean spills immediately.' },
];

const QUESTIONS_PER_GAME = 10;
const SECONDS_PER_QUESTION = 15;

/* ------------------------------------------------------------------ */
/*  Fisher-Yates shuffle                                               */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Score titles                                                       */
/* ------------------------------------------------------------------ */
function getScoreTitle(score: number): { title: string; emoji: string } {
  if (score === 10) return { title: 'Pet Whisperer', emoji: '🏆' };
  if (score >= 8) return { title: 'Fur-st Class Expert', emoji: '🌟' };
  if (score >= 6) return { title: 'Paw-some Learner', emoji: '🐾' };
  if (score >= 4) return { title: 'Getting There!', emoji: '📚' };
  return { title: 'Time to Visit the Knowledge Base!', emoji: '📖' };
}

/* ------------------------------------------------------------------ */
/*  Confetti component (CSS-only)                                      */
/* ------------------------------------------------------------------ */
function useConfettiPieces() {
  const [pieces] = useState(() => {
    const colors = ['#F97316', '#14B8A6', '#FBBF24', '#A78BFA', '#FB7185', '#34D399'];
    return Array.from({ length: 50 }).map((_, i) => ({
      color: colors[i % colors.length],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      size: 6 + Math.random() * 8,
      duration: 2 + Math.random() * 2,
    }));
  });
  return pieces;
}

function Confetti() {
  const pieces = useConfettiPieces();
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Quiz Page                                                     */
/* ------------------------------------------------------------------ */
type GameState = 'welcome' | 'playing' | 'feedback' | 'results';

export default function QuizPage() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = useCallback(() => {
    const shuffled = shuffle(QUESTION_POOL).slice(0, QUESTIONS_PER_GAME);
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setTimeLeft(SECONDS_PER_QUESTION);
    setGameState('playing');
  }, []);

  // Timer logic — uses a ref to track remaining time and syncs to state via requestAnimationFrame
  const timeLeftRef = useRef(SECONDS_PER_QUESTION);

  useEffect(() => {
    if (gameState !== 'playing') {
      clearTimer();
      return;
    }
    // Reset ref to match state
    timeLeftRef.current = SECONDS_PER_QUESTION;
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const remaining = timeLeftRef.current;
      if (remaining <= 0) {
        clearTimer();
        setTimeLeft(0);
        setSelectedAnswer(-1);
        setAnswers((a) => [...a, null]);
        setGameState('feedback');
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentQ]);

  const handleAnswer = (index: number) => {
    if (gameState !== 'playing') return;
    clearTimer();
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQ].correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, index]);
    setGameState('feedback');
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= QUESTIONS_PER_GAME) {
      setGameState('results');
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      setGameState('playing');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Welcome Screen                                                   */
  /* ---------------------------------------------------------------- */
  if (gameState === 'welcome') {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="animate-fade-in-up">
          <span className="mb-4 block text-7xl">🐾</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How Well Do You Know
            <br />
            <span className="text-primary">Your Pets?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Test your pet care knowledge with {QUESTIONS_PER_GAME} fun questions.
            Can you get a perfect score?
          </p>
          <Button
            onClick={startGame}
            size="lg"
            className="mt-8 animate-pulse-glow gap-2 text-lg px-8 py-6"
          >
            <Trophy className="h-5 w-5" />
            Start Quiz
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            {SECONDS_PER_QUESTION}s per question &bull; {QUESTION_POOL.length} questions in the pool
          </p>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Results Screen                                                   */
  /* ---------------------------------------------------------------- */
  if (gameState === 'results') {
    const { title, emoji } = getScoreTitle(score);
    const isPerfect = score === QUESTIONS_PER_GAME;

    return (
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        {isPerfect && <Confetti />}
        <div className="animate-fade-in-up">
          <span className="mb-4 block text-7xl">{emoji}</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-6xl font-bold text-primary">{score}</span>
            <span className="text-2xl text-muted-foreground">/ {QUESTIONS_PER_GAME}</span>
          </div>
          <p className="mt-3 text-muted-foreground">
            {isPerfect
              ? 'Amazing! You\'re a true pet care expert!'
              : score >= 6
                ? 'Great job! You really care about your furry friends.'
                : 'Keep learning — your pets will thank you!'}
          </p>

          {/* Review answers */}
          <div className="mx-auto mt-8 max-w-md space-y-2 text-left">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div>
                    <span className="font-medium">Q{i + 1}:</span>{' '}
                    <span className="text-muted-foreground">{q.question}</span>
                    {!isCorrect && (
                      <p className="mt-1 text-xs text-red-600">
                        Correct: {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={startGame} size="lg" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
            <Link href="/knowledge">
              <Button variant="outline" size="lg" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Knowledge Base
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Playing / Feedback Screen                                        */
  /* ---------------------------------------------------------------- */
  const q = questions[currentQ];
  const isCorrect = selectedAnswer === q.correctIndex;
  const timedOut = selectedAnswer === -1;
  const timerPercent = (timeLeft / SECONDS_PER_QUESTION) * 100;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Top bar: progress + score */}
      <div className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentQ + 1}/{QUESTIONS_PER_GAME}
          </span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQ + (gameState === 'feedback' ? 1 : 0)) / QUESTIONS_PER_GAME) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Trophy className="h-4 w-4" />
          {score}
        </div>
      </div>

      {/* Timer bar */}
      {gameState === 'playing' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-1000 linear ${
                timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Question card */}
      <Card className="animate-fade-in-up mb-6">
        <CardContent className="pt-2">
          <p className="text-lg font-semibold leading-relaxed sm:text-xl">{q.question}</p>
        </CardContent>
      </Card>

      {/* Answer options */}
      <div className="grid gap-3">
        {q.options.map((option, idx) => {
          let btnClass = 'border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5';

          if (gameState === 'feedback') {
            if (idx === q.correctIndex) {
              btnClass = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 scale-[1.02]';
            } else if (idx === selectedAnswer && !isCorrect) {
              btnClass = 'border-2 border-red-400 bg-red-50 text-red-900';
            } else {
              btnClass = 'border-2 border-border bg-card opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={gameState === 'feedback'}
              className={`flex items-center gap-3 rounded-xl px-5 py-4 text-left text-base font-medium transition-all duration-200 ${btnClass} animate-fade-in-up`}
              style={{ animationDelay: `${0.05 * idx}s` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
              {gameState === 'feedback' && idx === q.correctIndex && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              {gameState === 'feedback' && idx === selectedAnswer && !isCorrect && idx !== q.correctIndex && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback panel */}
      {gameState === 'feedback' && (
        <div className="mt-6 animate-fade-in-up">
          <div
            className={`rounded-xl border-2 p-4 ${
              timedOut
                ? 'border-amber-300 bg-amber-50'
                : isCorrect
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-red-300 bg-red-50'
            }`}
          >
            <p className="font-semibold">
              {timedOut ? '⏱️ Time\'s up!' : isCorrect ? '🎉 Correct!' : '❌ Not quite!'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{q.explanation}</p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={nextQuestion} className="gap-2">
              {currentQ + 1 >= QUESTIONS_PER_GAME ? 'See Results' : 'Next Question'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
