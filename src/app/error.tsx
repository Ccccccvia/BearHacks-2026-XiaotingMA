'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl animate-fade-in-up border-0">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Oops! Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our pet translator hit a snag. Don&apos;t worry — your furry friend is still here!
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
