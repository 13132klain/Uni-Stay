
'use client';

import { useState, useEffect, useCallback } from 'react';
import HouseCard from '@/components/listings/house-card';
import type { House } from '@/lib/mock-data'; // Keep House type from mock-data
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SearchIcon, FilterIcon, XIcon, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, type DocumentData, collection, getDocs, query, orderBy, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData extends DocumentData {
  favoriteHouseIds?: string[];
}

export default function ListingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState('any');
  const [selectedMaxPrice, setSelectedMaxPrice] = useState('any');
  
  const [allHouses, setAllHouses] = useState<House[]>([]); // Stores all fetched houses
  const [displayedHouses, setDisplayedHouses] = useState<House[]>([]); // Stores filtered houses
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const housesCollectionRef = collection(db, 'houses');
      // Consider adding orderBy('createdAt', 'desc') if you have that field and an index
      const q = query(housesCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedHouses = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          address: data.address,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          imageUrl: data.imageUrl,
          imageAiHint: data.imageAiHint,
          description: data.description,
          amenities: data.amenities || [],
          agent: data.agent || { name: 'N/A', phone: 'N/A' },
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(), // Convert Timestamp
        } as House;
      });
      setAllHouses(fetchedHouses);
      setDisplayedHouses(fetchedHouses); // Initially display all
    } catch (error) {
      console.error("Error fetching listings from Firestore:", error);
      toast({ title: "Error", description: "Could not fetch listings.", variant: "destructive" });
      setAllHouses([]);
      setDisplayedHouses([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfileData;
          setUserFavorites(userData.favoriteHouseIds || []);
        } else {
          setUserFavorites([]);
        }
      } else {
        setUserFavorites([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleFavorite = async (houseId: string) => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You need to be logged in to manage favorites.", variant: "destructive" });
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    const isCurrentlyFavorite = userFavorites.includes(houseId);

    try {
      if (isCurrentlyFavorite) {
        await updateDoc(userDocRef, { favoriteHouseIds: arrayRemove(houseId) });
        setUserFavorites(prev => prev.filter(id => id !== houseId));
        toast({ title: "Removed from Favorites" });
      } else {
        await updateDoc(userDocRef, { favoriteHouseIds: arrayUnion(houseId) });
        setUserFavorites(prev => [...prev, houseId]);
        toast({ title: "Added to Favorites" });
      }
    } catch (e: any) {
      console.error("Error updating favorites:", e);
      toast({ title: "Update Failed", description: e.message || "Could not update favorites.", variant: "destructive" });
    }
  };

  const handleApplyFilters = () => {
    let filtered = [...allHouses]; // Start with all fetched houses

    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (house) =>
          house.name.toLowerCase().includes(lowerSearchTerm) ||
          house.address.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (selectedBedrooms !== 'any') {
      const numBedrooms = parseInt(selectedBedrooms, 10);
      if (selectedBedrooms === '3') { 
        filtered = filtered.filter((house) => house.bedrooms >= numBedrooms);
      } else {
        filtered = filtered.filter((house) => house.bedrooms === numBedrooms);
      }
    }

    if (selectedMaxPrice !== 'any') {
      const maxPriceValue = parseInt(selectedMaxPrice, 10);
      filtered = filtered.filter((house) => house.price <= maxPriceValue);
    }
    setDisplayedHouses(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBedrooms('any');
    setSelectedMaxPrice('any');
    setDisplayedHouses([...allHouses]); // Reset to all fetched houses
  };

  const filtersApplied = searchTerm !== '' || selectedBedrooms !== 'any' || selectedMaxPrice !== 'any';

  if (authLoading || isLoadingListings) {
     return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Find Your Next Home</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our curated list of student rentals. Use the filters to narrow down your search.
        </p>
      </div>

      <div className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search by Name/Address</label>
            <Input 
              id="search" 
              placeholder="e.g., Modern Studio, University Rd" 
              className="bg-background" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-muted-foreground mb-1">Bedrooms</label>
            <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
              <SelectTrigger id="bedrooms" className="bg-background">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="0">Bedsitter / Studio</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-muted-foreground mb-1">Max Price</label>
             <Select value={selectedMaxPrice} onValueChange={setSelectedMaxPrice}>
              <SelectTrigger id="price" className="bg-background">
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Price</SelectItem>
                <SelectItem value="5000">Up to Ksh 5,000</SelectItem>
                <SelectItem value="7500">Up to Ksh 7,500</SelectItem>
                <SelectItem value="10000">Up to Ksh 10,000</SelectItem>
                <SelectItem value="12500">Up to Ksh 12,500</SelectItem>
                <SelectItem value="15000">Up to Ksh 15,000</SelectItem>
                <SelectItem value="20000">Up to Ksh 20,000</SelectItem>
                <SelectItem value="30000">Up to Ksh 30,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleApplyFilters} className="w-full">
              <SearchIcon className="mr-2 h-4 w-4" /> Apply
            </Button>
            {filtersApplied && (
              <Button onClick={handleResetFilters} variant="outline" className="w-auto" title="Reset Filters">
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {displayedHouses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedHouses.map((house) => (
            <HouseCard 
              key={house.id} 
              house={house}
              userId={currentUser?.uid}
              isFavorite={userFavorites.includes(house.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FilterIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Listings Found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
}

    