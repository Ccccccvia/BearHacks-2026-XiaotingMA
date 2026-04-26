'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  UtensilsCrossed,
  Scissors,
  Dumbbell,
  HeartPulse,
  Users,
  ShieldAlert,
  Dog,
  Cat,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Category = 'food-safety' | 'grooming' | 'exercise' | 'health' | 'social' | 'home-safety';
type Species = 'dog' | 'cat' | 'all';
type Severity = 'danger' | 'warning' | 'info' | 'tip';

interface KnowledgeItem {
  id: string;
  category: Category;
  title: string;
  summary: string;
  detail: string;
  species: Species[];
  icon: string;
  severity?: Severity;
}

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */
const CATEGORIES: { key: Category; label: string; Icon: typeof UtensilsCrossed }[] = [
  { key: 'food-safety', label: 'Food Safety', Icon: UtensilsCrossed },
  { key: 'grooming', label: 'Grooming', Icon: Scissors },
  { key: 'exercise', label: 'Exercise & Activity', Icon: Dumbbell },
  { key: 'health', label: 'Health & Wellness', Icon: HeartPulse },
  { key: 'social', label: 'Social & Behavioral', Icon: Users },
  { key: 'home-safety', label: 'Home Safety', Icon: ShieldAlert },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  danger: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  tip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const SEVERITY_DOT: Record<Severity, string> = {
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  tip: 'bg-emerald-500',
};

/* ------------------------------------------------------------------ */
/*  Static knowledge data (32 items)                                   */
/* ------------------------------------------------------------------ */
const DATA: KnowledgeItem[] = [
  // ── Food Safety ──────────────────────────────────────────────────
  { id: 'fs-1', category: 'food-safety', title: 'Chocolate Is Toxic', summary: 'All types of chocolate are dangerous to pets.', detail: 'Chocolate contains theobromine which dogs and cats cannot metabolize efficiently. Dark chocolate and baking chocolate are the most dangerous. Symptoms include vomiting, diarrhea, rapid breathing, seizures, and potentially death. Even small amounts warrant a call to your vet.', species: ['all'], icon: '🍫', severity: 'danger' },
  { id: 'fs-2', category: 'food-safety', title: 'Grapes & Raisins', summary: 'Can cause acute kidney failure in dogs.', detail: 'Even a small number of grapes or raisins can be fatal to dogs. The toxic substance is still unknown but the effects are well-documented. Symptoms include vomiting, lethargy, and decreased urination. Seek emergency vet care immediately if your dog eats any.', species: ['dog'], icon: '🍇', severity: 'danger' },
  { id: 'fs-3', category: 'food-safety', title: 'Onions & Garlic', summary: 'Damage red blood cells in dogs and cats.', detail: 'Onions, garlic, chives, and leeks belong to the Allium family. They contain compounds that cause oxidative damage to red blood cells, leading to anemia. Cats are especially sensitive. Cooked, raw, or powdered forms are all dangerous.', species: ['all'], icon: '🧅', severity: 'danger' },
  { id: 'fs-4', category: 'food-safety', title: 'Xylitol (Sugar-Free Sweetener)', summary: 'Extremely toxic to dogs — found in gum, candy, peanut butter.', detail: 'Xylitol causes a rapid release of insulin in dogs, leading to hypoglycemia (low blood sugar). It can also cause liver failure. Always check ingredient labels on peanut butter, gum, candy, baked goods, and toothpaste before sharing with your dog.', species: ['dog'], icon: '🍬', severity: 'danger' },
  { id: 'fs-5', category: 'food-safety', title: 'Alcohol & Caffeine', summary: 'Both are highly dangerous to pets of all sizes.', detail: 'Alcohol causes vomiting, diarrhea, difficulty breathing, coma, and death in pets. Caffeine (found in coffee, tea, energy drinks, and some medications) can cause restlessness, rapid breathing, heart palpitations, and muscle tremors.', species: ['all'], icon: '☕', severity: 'danger' },
  { id: 'fs-6', category: 'food-safety', title: 'Macadamia Nuts', summary: 'Cause weakness, vomiting, and tremors in dogs.', detail: 'Within 12 hours of ingestion, dogs may experience weakness (especially hind legs), vomiting, tremors, and hyperthermia. While rarely fatal, the symptoms are distressing and require veterinary attention.', species: ['dog'], icon: '🥜', severity: 'warning' },
  { id: 'fs-7', category: 'food-safety', title: 'Safe Snacks: Carrots & Blueberries', summary: 'Healthy, low-calorie treats for dogs and cats.', detail: 'Carrots are great for dental health and low in calories. Blueberries are packed with antioxidants. Plain cooked chicken (no seasoning) and plain white rice are gentle on the stomach and perfect for dogs recovering from an upset tummy.', species: ['all'], icon: '🥕', severity: 'tip' },
  { id: 'fs-8', category: 'food-safety', title: "Cats & Cow's Milk", summary: "Most adult cats are lactose intolerant.", detail: "Despite the popular image of cats drinking milk, most adult cats lack the enzyme lactase needed to digest lactose. Cow's milk can cause stomach cramps, bloating, and diarrhea. Offer water or specially formulated cat milk instead.", species: ['cat'], icon: '🥛', severity: 'warning' },

  // ── Grooming ─────────────────────────────────────────────────────
  { id: 'gr-1', category: 'grooming', title: 'Bathing Temperature', summary: 'Use lukewarm water — never hot or cold.', detail: 'Water should be lukewarm (around 37°C / 98°F). Hot water can scald or stress your pet, while cold water is uncomfortable. Avoid getting water in their ears and eyes. Use pet-specific shampoo — human products disrupt the skin pH balance.', species: ['all'], icon: '🛁', severity: 'info' },
  { id: 'gr-2', category: 'grooming', title: 'How Often to Bathe', summary: 'Dogs every 4–8 weeks; cats rarely need baths.', detail: 'Most dogs need a bath every 4–8 weeks depending on breed and activity level. Over-bathing strips natural oils. Cats are self-grooming and rarely need baths unless they have a skin condition or got into something messy.', species: ['all'], icon: '🚿', severity: 'tip' },
  { id: 'gr-3', category: 'grooming', title: 'Brushing by Coat Type', summary: 'Long-haired breeds need daily brushing; short-haired weekly.', detail: 'Long-haired dogs and cats (e.g., Persians, Collies) need daily brushing to prevent painful mats. Short-haired breeds benefit from weekly brushing to remove loose fur and distribute skin oils. Use a slicker brush for tangles and a bristle brush for finishing.', species: ['all'], icon: '🪮', severity: 'tip' },
  { id: 'gr-4', category: 'grooming', title: 'Nail Trimming', summary: 'Trim every 3–4 weeks to prevent overgrowth and pain.', detail: 'Overgrown nails can curl into paw pads, causing pain and infection. Use a pet-specific clipper. Trim small amounts to avoid the quick (blood vessel inside the nail). If nails are dark, trim tiny slivers at a time. Have styptic powder on hand in case of bleeding.', species: ['all'], icon: '✂️', severity: 'info' },
  { id: 'gr-5', category: 'grooming', title: 'Dental Care Basics', summary: 'Brush teeth regularly to prevent periodontal disease.', detail: 'Over 80% of dogs and 70% of cats show signs of dental disease by age 3. Use pet-specific toothpaste (never human — fluoride is toxic). Brush 2–3 times per week minimum. Dental chews and water additives can help, but don\'t replace brushing.', species: ['all'], icon: '🦷', severity: 'info' },

  // ── Exercise & Activity ──────────────────────────────────────────
  { id: 'ex-1', category: 'exercise', title: 'Dog Walking Needs by Size', summary: 'Small dogs: 30 min; medium: 1 hr; large/working: 1–2 hrs daily.', detail: 'Small breeds like Chihuahuas need about 30 minutes. Medium breeds like Beagles need about an hour. Large and working breeds like Huskies or Border Collies may need 1–2 hours of vigorous exercise daily. Always adjust for age and health conditions.', species: ['dog'], icon: '🚶', severity: 'info' },
  { id: 'ex-2', category: 'exercise', title: 'Mental Stimulation for Dogs', summary: 'Puzzle toys and training prevent boredom and destructive behavior.', detail: 'Dogs need mental exercise as much as physical. Puzzle feeders, snuffle mats, hide-and-seek games, and short training sessions (10–15 min) keep their minds sharp. A bored dog is a destructive dog — chewing, digging, and barking often stem from under-stimulation.', species: ['dog'], icon: '🧩', severity: 'tip' },
  { id: 'ex-3', category: 'exercise', title: 'Indoor Play for Cats', summary: 'Climbing trees, tunnels, and interactive toys are essential.', detail: 'Cats need 15–30 minutes of active play daily. Cat trees give them vertical space to climb and survey their territory. Tunnel toys stimulate hunting instincts. Rotate toys weekly to keep things fresh. Wand toys with feathers are universally loved.', species: ['cat'], icon: '🐱', severity: 'tip' },
  { id: 'ex-4', category: 'exercise', title: 'Laser Pointer Caution', summary: 'Fun but can cause frustration — always end with a real treat.', detail: 'Laser pointers provide great exercise for cats but can cause anxiety because the cat never "catches" the prey. Always end a laser session by directing the dot to a treat or toy so your cat gets the satisfaction of a successful hunt.', species: ['cat'], icon: '🔴', severity: 'warning' },
  { id: 'ex-5', category: 'exercise', title: 'Signs of Over-Exercise', summary: 'Excessive panting, limping, or reluctance to move.', detail: 'Watch for excessive panting that doesn\'t subside, limping, reluctance to continue walking, or lying down during walks. Puppies and senior dogs are especially vulnerable. In hot weather, exercise early morning or evening and always carry water.', species: ['all'], icon: '⚠️', severity: 'warning' },

  // ── Health & Wellness ────────────────────────────────────────────
  { id: 'hw-1', category: 'health', title: 'Vaccination Schedules', summary: 'Core vaccines protect against deadly diseases.', detail: 'Dogs: DHPP (distemper, hepatitis, parvovirus, parainfluenza) and rabies are core vaccines. Cats: FVRCP (feline viral rhinotracheitis, calicivirus, panleukopenia) and rabies. Puppies/kittens start at 6–8 weeks with boosters every 3–4 weeks until 16 weeks. Annual or triennial boosters follow.', species: ['all'], icon: '💉', severity: 'info' },
  { id: 'hw-2', category: 'health', title: 'When to Visit the Vet', summary: 'Know the emergency signs that need immediate attention.', detail: 'Seek immediate vet care for: difficulty breathing, seizures, uncontrolled bleeding, inability to urinate, bloated/hard abdomen, collapse, ingestion of toxins, or severe vomiting/diarrhea lasting over 24 hours. Annual wellness exams catch problems early.', species: ['all'], icon: '🏥', severity: 'danger' },
  { id: 'hw-3', category: 'health', title: 'Parasite Prevention', summary: 'Year-round flea, tick, and worm prevention is essential.', detail: 'Fleas cause itching, allergies, and can transmit tapeworms. Ticks carry Lyme disease and other serious illnesses. Heartworm (transmitted by mosquitoes) is potentially fatal. Use vet-recommended monthly preventatives year-round — not just in warm months.', species: ['all'], icon: '🛡️', severity: 'info' },
  { id: 'hw-4', category: 'health', title: 'Common Symptoms to Watch For', summary: 'Changes in appetite, energy, or bathroom habits signal trouble.', detail: 'Watch for: sudden weight loss or gain, changes in appetite or water intake, lethargy, coughing, sneezing, discharge from eyes/nose, changes in stool or urination, lumps or bumps, bad breath, or behavioral changes. Keep a log to share with your vet.', species: ['all'], icon: '🔍', severity: 'warning' },

  // ── Social & Behavioral ──────────────────────────────────────────
  { id: 'sb-1', category: 'social', title: 'Puppy Socialization Window', summary: 'Critical period is 3–14 weeks — expose to many experiences.', detail: 'The socialization window (3–14 weeks) is when puppies are most receptive to new experiences. Safely expose them to different people, animals, sounds, surfaces, and environments. Positive experiences during this window prevent fear-based aggression later in life.', species: ['dog'], icon: '🐶', severity: 'info' },
  { id: 'sb-2', category: 'social', title: 'Kitten Socialization', summary: 'Handle kittens gently and frequently from 2–7 weeks.', detail: 'Kittens socialized between 2–7 weeks grow into friendlier, more confident cats. Gently handle them daily, expose them to different people, and introduce household sounds gradually. Kittens not socialized early may become fearful or aggressive adults.', species: ['cat'], icon: '🐈', severity: 'info' },
  { id: 'sb-3', category: 'social', title: 'Signs of Stress & Anxiety', summary: 'Pacing, excessive licking, hiding, or destructive behavior.', detail: 'Dogs show stress through panting, pacing, whining, trembling, excessive drooling, and destructive behavior. Cats may hide, over-groom (causing bald patches), refuse food, or urinate outside the litter box. Identify and address the stressor — consult a behaviorist if needed.', species: ['all'], icon: '😰', severity: 'warning' },
  { id: 'sb-4', category: 'social', title: 'Understanding Body Language', summary: 'Tail, ears, and posture tell you how your pet feels.', detail: 'Dogs: a wagging tail doesn\'t always mean happy — a low, slow wag can signal uncertainty. Ears pinned back indicate fear. A play bow (front down, rear up) means "let\'s play!" Cats: slow blinks mean trust and affection. Flattened ears signal fear or aggression. A puffed tail means extreme fear or arousal.', species: ['all'], icon: '👀', severity: 'tip' },
  { id: 'sb-5', category: 'social', title: 'Separation Anxiety Management', summary: 'Gradual desensitization and routine help anxious pets.', detail: 'Start with short absences and gradually increase duration. Leave a worn piece of clothing for comfort. Don\'t make departures dramatic. Puzzle toys and calming music can help. For severe cases, consult your vet about behavioral therapy or anti-anxiety medication.', species: ['all'], icon: '💔', severity: 'tip' },

  // ── Home Safety ──────────────────────────────────────────────────
  { id: 'hs-1', category: 'home-safety', title: 'Toxic Houseplants', summary: 'Lilies, pothos, and sago palms can be deadly.', detail: 'Lilies are extremely toxic to cats — even small amounts can cause kidney failure. Pothos and philodendron cause mouth/throat irritation. Sago palms are fatal to dogs. Safe alternatives include spider plants, Boston ferns, and African violets. Check the ASPCA toxic plant database before buying.', species: ['all'], icon: '🪴', severity: 'danger' },
  { id: 'hs-2', category: 'home-safety', title: 'Dangerous Household Items', summary: 'Medications, cleaning products, and small objects are hazards.', detail: 'Human medications (NSAIDs, acetaminophen, antidepressants) are a top cause of pet poisoning. Keep cleaning products locked away. Small objects (rubber bands, hair ties, coins) can cause intestinal blockages. Electrical cords should be covered or sprayed with bitter deterrent.', species: ['all'], icon: '⚡', severity: 'danger' },
  { id: 'hs-3', category: 'home-safety', title: 'Pet-Proofing Your Home', summary: 'Secure trash, cords, and accessible cabinets.', detail: 'Use child-proof locks on cabinets with chemicals or medications. Secure trash cans with lids. Tuck or cover electrical cords. Remove or secure blinds with dangling cords (strangulation risk for cats). Keep toilet lids closed if your pet drinks from them.', species: ['all'], icon: '🏠', severity: 'tip' },
  { id: 'hs-4', category: 'home-safety', title: 'Hot Car Danger', summary: 'NEVER leave pets in a parked car — temperatures soar within minutes.', detail: 'On a 25°C (77°F) day, a car interior can reach 46°C (115°F) in just 30 minutes. Dogs and cats cannot regulate heat as effectively as humans. Heatstroke can occur within 15 minutes and is often fatal. Cracking windows does virtually nothing. If you see a pet in a hot car, call authorities immediately.', species: ['all'], icon: '🚗', severity: 'danger' },
  { id: 'hs-5', category: 'home-safety', title: 'Cold Weather Safety', summary: 'Short-haired breeds and small pets need extra protection.', detail: 'Small dogs, short-haired breeds, puppies, and senior dogs are vulnerable to cold. Limit time outdoors below 0°C (32°F). Use dog coats for sensitive breeds. Wipe paws after walks to remove salt and de-icers (toxic if licked). Antifreeze has a sweet taste but is deadly — clean spills immediately.', species: ['dog'], icon: '❄️', severity: 'warning' },
];

/* ------------------------------------------------------------------ */
/*  Helper: Highlight search matches                                   */
/* ------------------------------------------------------------------ */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function KnowledgePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<Species | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DATA.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (speciesFilter !== 'all' && !item.species.includes(speciesFilter) && !item.species.includes('all')) return false;
      if (q && !(item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [search, activeCategory, speciesFilter]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8 animate-fade-in-up text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pet Care Knowledge Base</h1>
        <p className="mt-2 text-muted-foreground">Everything you need to keep your furry friends happy, healthy, and safe.</p>
      </div>

      {/* ── Search & Species Filter ─────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-2">
          {([['all', '🐾 All'], ['dog', '🐕 Dogs'], ['cat', '🐈 Cats']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSpeciesFilter(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                speciesFilter === key
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Chips ──────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Results count ───────────────────────────────────────── */}
      <p className="mb-4 text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {DATA.length} articles
      </p>

      {/* ── Card Grid ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">No results found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) => {
            const isOpen = expanded.has(item.id);
            const cat = CATEGORIES.find((c) => c.key === item.category);
            return (
              <Card
                key={item.id}
                className="hover-lift cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${0.04 * idx}s` }}
                onClick={() => toggle(item.id)}
              >
                <CardContent className="space-y-3">
                  {/* Top row: icon + severity */}
                  <div className="flex items-start justify-between">
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <div className="flex items-center gap-1.5">
                      {item.species.map((s) => (
                        <span key={s} className="text-muted-foreground">
                          {s === 'dog' && <Dog className="h-4 w-4" />}
                          {s === 'cat' && <Cat className="h-4 w-4" />}
                          {s === 'all' && (
                            <span className="flex gap-0.5">
                              <Dog className="h-4 w-4" />
                              <Cat className="h-4 w-4" />
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold leading-snug">
                    <Highlight text={item.title} query={search} />
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.severity && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[item.severity]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[item.severity]}`} />
                        {item.severity}
                      </span>
                    )}
                    {cat && (
                      <Badge variant="outline" className="text-[11px]">
                        <cat.Icon className="mr-0.5 h-3 w-3" />
                        {cat.label}
                      </Badge>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <Highlight text={item.summary} query={search} />
                  </p>

                  {/* Expand / Collapse */}
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <span>{isOpen ? 'Show less' : 'Read more'}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isOpen && (
                    <p className="animate-fade-in-up text-sm leading-relaxed text-foreground/80 border-t border-border/50 pt-3">
                      <Highlight text={item.detail} query={search} />
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
