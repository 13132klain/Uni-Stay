
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OldAdminBookingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal/manage-bookings');
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-lg text-muted-foreground">Redirecting to the new admin page...</p>
    </div>
  );
}
