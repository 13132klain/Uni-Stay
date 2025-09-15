
'use client';

import FavoritesDisplay from '@/components/profile/favorites-display';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ShieldAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/auth/login?redirect=/profile/favorites'); // Redirect if not logged in
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading your favorites...</p>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" />
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">You must be logged in to view your favorites.</p>
                    <Button asChild size="lg">
                        <Link href="/auth/login?redirect=/profile/favorites">Login to Continue</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <FavoritesDisplay userId={user.uid} />
    </div>
  );
}
