'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDoubleIcon, BathIcon, MapPinIcon, HeartIcon, Loader2, UsersIcon } from 'lucide-react';
import type { House } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type HouseCardProps = {
  house: House;
  userId?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: (houseId: string) => Promise<void>;
  viewMode?: 'grid' | 'list';
};

export default function HouseCard({ 
  house, 
  userId, 
  isFavorite, 
  onToggleFavorite, 
  viewMode = 'grid' 
}: HouseCardProps) {
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || !onToggleFavorite) return;

    setIsLoadingFavorite(true);
    try {
      await onToggleFavorite(house.id);
    } catch (error) {
      console.error("Failed to toggle favorite from card", error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
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
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HeartIcon className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            )}
          </Button>
        )}
        
        <Link href={`/listings/${house.id}`} className="block">
          <div className="flex">
            <div className="w-64 h-48 relative overflow-hidden flex-shrink-0">
              <Image
                src={house.images?.[0] || house.imageUrl}
                alt={house.name}
                fill
                sizes="256px"
                className="object-cover transition-transform duration-300 hover:scale-105"
                priority={false}
                data-ai-hint={house.imageAiHint || "house exterior"}
              />
              {house.images && house.images.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {house.images.length} photos
                </div>
              )}
            </div>
            
            <CardContent className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-3">
                <CardTitle className="text-xl font-semibold">{house.name}</CardTitle>
                <div className="text-2xl font-bold text-primary">
                  Ksh {house.price.toLocaleString()}/month
                </div>
              </div>
              
              <p className="text-muted-foreground flex items-center mb-4">
                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{house.address}</span>
              </p>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                <span className="flex items-center">
                  <BedDoubleIcon className="h-4 w-4 mr-2" />
                  {house.bedrooms} Bedrooms
                </span>
                <span className="flex items-center">
                  <BathIcon className="h-4 w-4 mr-2" />
                  {house.bathrooms} Bathrooms
                </span>
                {typeof house.availableUnits === 'number' && house.availableUnits > 0 && (
                  <span className="flex items-center">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    {house.availableUnits} Units Available
                  </span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {house.description}
              </p>
            </CardContent>
          </div>
        </Link>
      </Card>
    );
  }

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
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HeartIcon className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          )}
        </Button>
      )}
      
      <Link href={`/listings/${house.id}`} className="block">
        <div className="aspect-[16/10] relative overflow-hidden">
          <Image
            src={house.images?.[0] || house.imageUrl}
            alt={house.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={false}
            data-ai-hint={house.imageAiHint || "house exterior"}
          />
          {house.images && house.images.length > 1 && (
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {house.images.length} photos
            </div>
          )}
        </div>
        
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-semibold mb-2 line-clamp-1">{house.name}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center mb-3">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{house.address}</span>
          </p>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center">
                <BedDoubleIcon className="h-4 w-4 mr-1" />
                {house.bedrooms}
              </span>
              <span className="flex items-center">
                <BathIcon className="h-4 w-4 mr-1" />
                {house.bathrooms}
              </span>
            </div>
            {typeof house.availableUnits === 'number' && house.availableUnits > 0 && (
              <span className="flex items-center text-xs">
                <UsersIcon className="h-3 w-3 mr-1" />
                {house.availableUnits} available
              </span>
            )}
          </div>
          
          <div className="text-lg font-bold text-primary">
            Ksh {house.price.toLocaleString()}/month
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/listings/${house.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}