
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HeartIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, type DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ListingFavoriteButtonProps {
  houseId: string;
  className?: string;
}

interface UserProfileData extends DocumentData {
  favoriteHouseIds?: string[];
}

export default function ListingFavoriteButton({ houseId, className }: ListingFavoriteButtonProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial fetch and toggle action
  const { toast } = useToast();

  const fetchFavoriteStatus = useCallback(async (user: User | null) => {
    if (!user) {
      setIsFavorite(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfileData;
        setIsFavorite((userData.favoriteHouseIds || []).includes(houseId));
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error("Error fetching favorite status:", error);
      setIsFavorite(false); // Default to not favorite on error
    } finally {
      setIsLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      fetchFavoriteStatus(user);
    });
    return () => unsubscribe();
  }, [fetchFavoriteStatus]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You need to be logged in to manage favorites.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      if (isFavorite) {
        await updateDoc(userDocRef, { favoriteHouseIds: arrayRemove(houseId) });
        setIsFavorite(false);
        toast({ title: "Removed from Favorites" });
      } else {
        await updateDoc(userDocRef, { favoriteHouseIds: arrayUnion(houseId) });
        setIsFavorite(true);
        toast({ title: "Added to Favorites" });
      }
    } catch (e: any) {
      console.error("Error updating favorite:", e);
      toast({ title: "Update Failed", description: e.message || "Could not update favorite status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    // Optionally render a disabled button or nothing if user is not logged in
    return (
        <Button variant="outline" size="lg" className={cn("flex items-center gap-2", className)} disabled>
            <HeartIcon className="h-5 w-5 text-muted-foreground" />
            <span>Login to Favorite</span>
        </Button>
    );
  }
  
  if (isLoading && !currentUser) { // Initial loading check before user is known
      return (
        <Button variant="outline" size="lg" className={cn("flex items-center gap-2", className)} disabled>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
        </Button>
    );
  }


  return (
    <Button
      variant="outline"
      size="lg"
      className={cn("flex items-center gap-2", className)}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <HeartIcon className={cn("h-5 w-5", isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
      )}
      <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
    </Button>
  );
}
