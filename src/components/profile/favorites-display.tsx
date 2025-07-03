
'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, type DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import HouseCard from '@/components/listings/house-card';
import { mockHouses, type House } from '@/lib/mock-data'; // Assuming mockHouses is comprehensive
import { Loader2, AlertTriangleIcon, HeartOffIcon, HeartIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '../ui/button';

type FavoritesDisplayProps = {
  userId: string;
};

interface UserProfileData extends DocumentData {
  favoriteHouseIds?: string[];
}

export default function FavoritesDisplay({ userId }: FavoritesDisplayProps) {
  const [favoriteHouses, setFavoriteHouses] = useState<House[]>([]);
  const [favoriteHouseIds, setFavoriteHouseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);


  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setError('User ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfileData;
        const currentFavoriteIds = userData.favoriteHouseIds || [];
        setFavoriteHouseIds(currentFavoriteIds);
        
        const fetchedHouses = mockHouses.filter(house => currentFavoriteIds.includes(house.id));
        setFavoriteHouses(fetchedHouses);
      } else {
        setFavoriteHouseIds([]);
        setFavoriteHouses([]);
        // No error, just means no favorites or no profile yet.
      }
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(`Failed to load favorites: ${err.message || 'Please try again later.'}`);
      setFavoriteHouseIds([]);
      setFavoriteHouses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (houseId: string) => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You need to be logged in to manage favorites.", variant: "destructive" });
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const isCurrentlyFavorite = favoriteHouseIds.includes(houseId);

    try {
      if (isCurrentlyFavorite) {
        await updateDoc(userDocRef, { favoriteHouseIds: arrayRemove(houseId) });
        setFavoriteHouseIds(prev => prev.filter(id => id !== houseId));
        setFavoriteHouses(prev => prev.filter(house => house.id !== houseId)); // Optimistically update UI
        toast({ title: "Removed from Favorites", description: "Property removed from your wishlist." });
      } else {
        // This case shouldn't happen often from the favorites page itself, but good for completeness
        await updateDoc(userDocRef, { favoriteHouseIds: arrayUnion(houseId) });
        setFavoriteHouseIds(prev => [...prev, houseId]);
        // Re-fetch or add to favoriteHouses if needed, though primary action here is removal
        toast({ title: "Added to Favorites", description: "Property added to your wishlist." });
        fetchFavorites(); // Re-fetch to ensure consistency if adding from another context
      }
    } catch (e: any) {
      console.error("Error updating favorites:", e);
      toast({ title: "Update Failed", description: e.message || "Could not update favorites.", variant: "destructive" });
      // Revert optimistic update if necessary or re-fetch
      fetchFavorites();
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your favorite listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <AlertTriangleIcon className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12 text-center">
        <HeartIcon className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight mb-3">My Favorite Listings</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Here are the properties you've saved. Click the heart again to remove them.
        </p>
      </div>

      {favoriteHouses.length === 0 ? (
        <div className="text-center py-12">
          <HeartOffIcon className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold mb-3">No Favorites Yet</h3>
          <p className="text-muted-foreground mb-6">You haven't added any properties to your favorites.</p>
          <Button asChild size="lg">
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteHouses.map((house) => (
            <HouseCard 
              key={house.id} 
              house={house} 
              userId={currentUser?.uid}
              isFavorite={favoriteHouseIds.includes(house.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
