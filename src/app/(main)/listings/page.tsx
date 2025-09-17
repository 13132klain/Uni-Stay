'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import HouseCard from '@/components/listings/house-card';
import type { House } from '@/lib/mock-data';
import AdvancedSearchFilters, { type SearchFilters } from '@/components/listings/advanced-search-filters';
import { Button } from '@/components/ui/button';
import { Loader2, GridIcon, ListIcon, SearchIcon } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, type DocumentData, collection, getDocs, query, orderBy, type Timestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserProfileData extends DocumentData {
  favoriteHouseIds?: string[];
}

export default function ListingsPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    priceRange: [0, 50000],
    bedrooms: 'any',
    bathrooms: 'any',
    location: 'All Locations',
    amenities: [],
    sortBy: 'newest'
  });
  
  const [allHouses, setAllHouses] = useState<House[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = useCallback(() => {
    setIsLoadingListings(true);
    try {
      const housesCollectionRef = collection(db, 'houses');
      const q = query(housesCollectionRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
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
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              status: data.status || 'available',
              availableUnits: data.availableUnits || 0,
              images: data.images || [data.imageUrl], // Support multiple images
            } as House;
          });
          // Only show available houses with availableUnits > 0
          const availableHouses = fetchedHouses.filter(house => house.status === 'available' && house.availableUnits > 0);
          setAllHouses(availableHouses);
          setIsLoadingListings(false);
        },
        (error) => {
          console.error("Error fetching listings from Firestore:", error);
          toast({ title: "Error", description: "Could not fetch listings.", variant: "destructive" });
          setAllHouses([]);
          setIsLoadingListings(false);
        }
      );
      
      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up listings listener:", error);
      toast({ title: "Error", description: "Could not set up listings listener.", variant: "destructive" });
      setAllHouses([]);
      setIsLoadingListings(false);
      return () => {}; // Return empty function
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchListings();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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

  // Filter and sort houses based on current filters
  const filteredHouses = useMemo(() => {
    let filtered = allHouses.filter(house => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          house.name.toLowerCase().includes(searchLower) ||
          house.address.toLowerCase().includes(searchLower) ||
          house.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Price range filter
      if (house.price < filters.priceRange[0] || house.price > filters.priceRange[1]) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms !== 'any' && house.bedrooms < parseInt(filters.bedrooms)) {
        return false;
      }

      // Bathrooms filter
      if (filters.bathrooms !== 'any' && house.bathrooms < parseInt(filters.bathrooms)) {
        return false;
      }

      // Location filter (basic implementation)
      if (filters.location !== 'All Locations') {
        const addressLower = house.address.toLowerCase();
        const locationLower = filters.location.toLowerCase();
        if (!addressLower.includes(locationLower)) {
          return false;
        }
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          house.amenities.some(houseAmenity => 
            houseAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'bedrooms':
          return b.bedrooms - a.bedrooms;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allHouses, filters]);

  const handleToggleFavorite = async (houseId: string) => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You need to be logged in to manage favorites.", variant: "destructive" });
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    const isCurrentlyFavorite = userFavorites.includes(houseId);
    
    try {
      if (isCurrentlyFavorite) {
        await updateDoc(userDocRef, {
          favoriteHouseIds: arrayRemove(houseId)
        });
        setUserFavorites(prev => prev.filter(id => id !== houseId));
        toast({ title: "Removed from favorites", description: "Property removed from your favorites list." });
      } else {
        await updateDoc(userDocRef, {
          favoriteHouseIds: arrayUnion(houseId)
        });
        setUserFavorites(prev => [...prev, houseId]);
        toast({ title: "Added to favorites", description: "Property added to your favorites list." });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast({ title: "Error", description: "Could not update favorites. Please try again.", variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      priceRange: [0, 50000],
      bedrooms: 'any',
      bathrooms: 'any',
      location: 'All Locations',
      amenities: [],
      sortBy: 'newest'
    });
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Available Properties</h1>
        <p className="text-muted-foreground">
          Find your perfect home near Meru University. Browse through our carefully curated selection of student-friendly accommodations.
        </p>
      </div>

      {/* Advanced Search Filters */}
      <div className="mb-8">
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          totalResults={filteredHouses.length}
        />
      </div>

      {/* View Mode Toggle and Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          Showing {filteredHouses.length} of {allHouses.length} properties
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties Grid/List */}
      {filteredHouses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p>Try adjusting your search criteria or filters to find more properties.</p>
          </div>
          <Button onClick={clearFilters} variant="outline">
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        }>
          {filteredHouses.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              isFavorite={userFavorites.includes(house.id)}
              onToggleFavorite={() => handleToggleFavorite(house.id)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}