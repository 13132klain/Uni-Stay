'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UploadIcon, 
  XIcon, 
  ImageIcon, 
  PlusIcon, 
  Loader2,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  AlertCircleIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ImageUpload {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
  error?: string;
  uploaded?: boolean;
}

interface MultipleImageUploadProps {
  images: ImageUpload[];
  onImagesChange: (images: ImageUpload[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  autoUpload?: boolean;
}

export default function MultipleImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  className,
  disabled = false,
  autoUpload = true
}: MultipleImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageToFirebase = async (file: File, imageId: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `property-images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageUpload[] = [];
    const remainingSlots = maxImages - images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          const id = `temp-${Date.now()}-${i}`;
          const url = URL.createObjectURL(file);
          newImages.push({
            id,
            url,
            file,
            uploading: false,
            error: 'File too large (max 10MB)'
          });
          continue;
        }

        const id = `temp-${Date.now()}-${i}`;
        const url = URL.createObjectURL(file);
        const newImage: ImageUpload = {
          id,
          url,
          file,
          uploading: autoUpload
        };
        
        newImages.push(newImage);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);

      // Auto-upload if enabled
      if (autoUpload) {
        for (const image of newImages) {
          if (image.file && !image.error) {
            try {
              // Update the image to show uploading state
              const updatedImage = { ...image, uploading: true };
              const updatedImagesList = updatedImages.map(img => 
                img.id === image.id ? updatedImage : img
              );
              onImagesChange(updatedImagesList);

              // Upload to Firebase
              const downloadURL = await uploadImageToFirebase(image.file, image.id);
              
              // Update with the uploaded URL
              const finalImage = { 
                ...updatedImage, 
                url: downloadURL, 
                uploading: false, 
                uploaded: true 
              };
              const finalImagesList = updatedImagesList.map(img => 
                img.id === image.id ? finalImage : img
              );
              onImagesChange(finalImagesList);
            } catch (error: any) {
              // Update with error state
              const errorImage = { 
                ...image, 
                uploading: false, 
                error: error.message || 'Upload failed' 
              };
              const errorImagesList = updatedImages.map(img => 
                img.id === image.id ? errorImage : img
              );
              onImagesChange(errorImagesList);
            }
          }
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
  };

  const retryUpload = async (image: ImageUpload) => {
    if (!image.file) return;
    
    try {
      // Update to uploading state
      const updatedImage = { ...image, uploading: true, error: undefined };
      const updatedImages = images.map(img => img.id === image.id ? updatedImage : img);
      onImagesChange(updatedImages);

      // Upload to Firebase
      const downloadURL = await uploadImageToFirebase(image.file, image.id);
      
      // Update with success
      const finalImage = { 
        ...updatedImage, 
        url: downloadURL, 
        uploading: false, 
        uploaded: true 
      };
      const finalImages = updatedImages.map(img => img.id === image.id ? finalImage : img);
      onImagesChange(finalImages);
    } catch (error: any) {
      // Update with error
      const errorImage = { 
        ...image, 
        uploading: false, 
        error: error.message || 'Upload failed' 
      };
      const errorImages = images.map(img => img.id === image.id ? errorImage : img);
      onImagesChange(errorImages);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {canAddMore && (
        <Card 
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={disabled ? undefined : openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center space-y-2">
              <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Drop images here or click to browse</p>
                <p className="text-xs">Supports JPG, PNG, WebP (max {maxImages} images, 10MB each)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploaded Images ({images.length}/{maxImages})</h4>
            {images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImagesChange([])}
                disabled={disabled}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  
                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement preview modal
                        }}
                        disabled={disabled}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 bg-red-500/90 hover:bg-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                        disabled={disabled}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-xs">Uploading...</p>
                      </div>
                    </div>
                  )}
                  
                  {image.uploaded && !image.uploading && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500 text-white h-5 w-5 p-0 flex items-center justify-center">
                        <CheckIcon className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                  
                  {image.error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 flex items-center gap-1">
                      <AlertCircleIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate flex-1">{image.error}</span>
                      {image.file && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-white hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryUpload(image);
                          }}
                          disabled={disabled}
                        >
                          <UploadIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Image Number Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 left-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {index + 1}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add More Button */}
      {canAddMore && images.length > 0 && (
        <Button
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add More Images ({maxImages - images.length} remaining)
        </Button>
      )}
    </div>
  );
}
