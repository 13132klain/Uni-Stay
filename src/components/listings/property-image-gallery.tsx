'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  showThumbnails?: boolean;
  maxThumbnails?: number;
}

export default function PropertyImageGallery({
  images,
  alt,
  className,
  showThumbnails = true,
  maxThumbnails = 4
}: PropertyImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const currentImage = images[currentImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const visibleThumbnails = images.slice(0, maxThumbnails);
  const remainingCount = images.length - maxThumbnails;

  return (
    <div className={cn("relative", className)}>
      {/* Main Image */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={currentImage}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          priority
        />
        
        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={prevImage}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={nextImage}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Fullscreen Button */}
        <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 bg-black/20 hover:bg-black/40 text-white"
            >
              <ZoomInIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh]">
              <Image
                src={currentImage}
                alt={alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                onClick={() => setIsFullscreenOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Thumbnails */}
      {showThumbnails && hasMultipleImages && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {visibleThumbnails.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                currentImageIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <Image
                src={image}
                alt={`${alt} ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
          
          {remainingCount > 0 && (
            <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
              +{remainingCount}
            </div>
          )}
        </div>
      )}

      {/* Dots Indicator */}
      {hasMultipleImages && !showThumbnails && (
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentImageIndex === index
                  ? "bg-primary"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
