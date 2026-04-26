"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Camera, Volume2, Heart, Sparkles, Cpu, Eye, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── Intersection Observer hook for fade-in ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in-up");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className={`opacity-0 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Floating paw prints decoration ─── */
function FloatingPaws() {
  const paws = [
    { top: "10%", left: "5%", size: 28, delay: "0s", duration: "6s" },
    { top: "20%", right: "8%", size: 22, delay: "1.5s", duration: "7s" },
    { top: "60%", left: "3%", size: 18, delay: "3s", duration: "8s" },
    { top: "75%", right: "6%", size: 24, delay: "0.8s", duration: "6.5s" },
    { top: "40%", left: "92%", size: 20, delay: "2s", duration: "7.5s" },
    { top: "85%", left: "15%", size: 16, delay: "4s", duration: "9s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {paws.map((p, i) => (
        <PawPrint
          key={i}
          className="absolute text-primary/10 animate-float"
          style={{
            top: p.top,
            left: p.left,
            right: (p as Record<string, unknown>).right as string | undefined,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Rotating Sponsor Display ─── */
const sponsorNames = ["ElevenLabs", "Google Cloud Vision", "Gemma 4"];

function RotatingSponsors() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const cycle = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % sponsorNames.length);
      setFading(false);
    }, 500);
  }, []);

  useEffect(() => {
    const id = setInterval(cycle, 2500);
    return () => clearInterval(id);
  }, [cycle]);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>Powered by</span>
      <span
        key={index}
        className={`inline-block font-semibold text-primary transition-none ${
          fading ? "animate-sponsor-out" : "animate-sponsor-in"
        }`}
      >
        {sponsorNames[index]}
      </span>
    </span>
  );
}

/* ─── Data ─── */
const steps = [
  {
    icon: Camera,
    title: "Snap",
    description: "Take a photo of your furry friend",
  },
  {
    icon: Volume2,
    title: "Listen",
    description: "Your pet introduces itself with AI voice",
  },
  {
    icon: Heart,
    title: "Learn",
    description: "Get personalized care tips for their breed",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI Voice Generation",
    badge: "ElevenLabs",
    description:
      "Give your pet a unique, natural-sounding voice that matches their personality and breed characteristics.",
  },
  {
    icon: Eye,
    title: "Breed Detection",
    badge: "Google Cloud Vision",
    description:
      "Instantly identify your pet's breed from a photo using state-of-the-art computer vision AI.",
  },
  {
    icon: Cpu,
    title: "Smart Pet Care",
    badge: "Gemma 4",
    description:
      "Receive tailored care advice, fun facts, and personality insights powered by advanced language AI.",
  },
];

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="relative">
      {/* ════════ HERO ════════ */}
      <section className="relative isolate overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, var(--background) 0%, var(--muted) 40%, var(--accent) 100%)",
          }}
        />
        <FloatingPaws />

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-medium animate-fade-in-up"
          >
            🐾 BearHacks 2026
          </Badge>

          <h1
            className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            What if your pet{" "}
            <span className="text-primary">could talk?</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-lg sm:text-xl text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Snap a photo. Hear their voice. Understand their world.
          </p>

          <div
            className="mt-10 animate-fade-in-up"
            style={{ animationDelay: "350ms" }}
          >
            <Link href="/scan">
              <Button
                size="lg"
                className="h-14 rounded-full px-10 text-lg font-semibold shadow-lg animate-pulse-glow transition-transform hover:scale-105"
              >
                Give Your Pet a Voice&nbsp;&rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Three simple steps to hear your pet&apos;s voice
            </p>
          </FadeSection>

          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <FadeSection key={step.title} delay={i * 120}>
                <Card className="group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex flex-col items-center text-center pt-8 pb-8 px-6">
                    {/* Step number */}
                    <Badge
                      variant="outline"
                      className="absolute top-4 right-4 h-7 w-7 items-center justify-center rounded-full border-primary/30 text-xs font-bold text-primary"
                    >
                      {i + 1}
                    </Badge>

                    {/* Icon circle */}
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <step.icon className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES / TECH ════════ */}
      <section
        className="py-20 sm:py-28"
        style={{
          background:
            "linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Powered by Cutting-Edge AI
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Built with industry-leading APIs for real results
            </p>
          </FadeSection>

          {/* Infinite marquee carousel */}
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused]">
              {[...features, ...features].map((feat, i) => (
                <Card
                  key={`${feat.title}-${i}`}
                  className="group w-[320px] shrink-0 border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardContent className="flex flex-col pt-8 pb-8 px-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary/20">
                      <feat.icon className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-bold mb-1">{feat.title}</h3>
                    <Badge
                      variant="secondary"
                      className="mb-3 w-fit text-xs font-medium animate-badge-glow group-hover:shadow-[0_0_12px_2px_rgba(249,115,22,0.35)] transition-shadow duration-300"
                    >
                      {feat.badge}
                    </Badge>
                    <p className="text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Features listed in alphabetical order
          </p>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Built with ❤️ for BearHacks 2026
          </p>
          <p className="text-xs text-muted-foreground">
            <RotatingSponsors />
          </p>
        </div>
      </footer>
    </div>
  );
}
