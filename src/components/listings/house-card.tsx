
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDoubleIcon, BathIcon, MapPinIcon, HeartIcon, Loader2 } from 'lucide-react'; // Removed DollarSignIcon
import type { House } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type HouseCardProps = {
  house: House;
  userId?: string | null; // Optional: current user's ID
  isFavorite?: boolean;   // Optional: if the house is favorited by the current user
  onToggleFavorite?: (houseId: string) => Promise<void>; // Optional: handler to toggle favorite
};

export default function HouseCard({ house, userId, isFavorite, onToggleFavorite }: HouseCardProps) {
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if the card itself is a link
    e.stopPropagation(); // Prevent event bubbling
    if (!userId || !onToggleFavorite) return;

    setIsLoadingFavorite(true);
    try {
      await onToggleFavorite(house.id);
    } catch (error) {
      console.error("Failed to toggle favorite from card", error);
      // Toast or error handling can be done by the parent
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full relative">
      {userId && onToggleFavorite && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/70 hover:bg-background/90 rounded-full h-9 w-9"
          onClick={handleFavoriteClick}
          disabled={isLoadingFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isLoadingFavorite ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <HeartIcon className={cn("h-5 w-5", isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
          )}
        </Button>
      )}
      <Link href={`/listings/${house.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0">
          <div className="aspect-[16/10] relative w-full">
            <Image
              src={house.imageUrl}
              alt={house.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={house.imageAiHint || "house exterior"}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg mb-1 truncate" title={house.name}>{house.name}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center mb-2">
            <MapPinIcon className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate" title={house.address}>{house.address}</span>
          </p>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center">
              <BedDoubleIcon className="h-4 w-4 mr-1 text-primary" /> {house.bedrooms} Beds
            </span>
            <span className="flex items-center">
              <BathIcon className="h-4 w-4 mr-1 text-primary" /> {house.bathrooms} {house.bathrooms === 0 ? 'Shared Bath' : 'Baths'}
            </span>
          </div>
           <p className="text-lg font-semibold text-primary">
            Ksh {house.price.toLocaleString()}/month
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto"> {/* mt-auto pushes footer to bottom */}
          <Button className="w-full">View Details</Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
