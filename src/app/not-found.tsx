import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Camera } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl animate-fade-in-up border-0">
        <CardContent className="p-8 text-center space-y-5">
          <div className="text-6xl">🐾</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Looks like this trail went cold. Let&apos;s get you back on track!
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button className="w-full gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/scan">
              <Button variant="outline" className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Scan a Pet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
