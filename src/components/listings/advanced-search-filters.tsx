'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  SearchIcon, 
  FilterIcon, 
  XIcon, 
  MapPinIcon, 
  DollarSignIcon, 
  BedIcon, 
  BathIcon,
  WifiIcon,
  CarIcon,
  ShieldCheckIcon,
  UtensilsIcon,
  WashingMachineIcon,
  SparklesIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  searchTerm: string;
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  location: string;
  amenities: string[];
  sortBy: string;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  totalResults: number;
  className?: string;
}

const amenityOptions = [
  { value: 'WiFi', label: 'WiFi', icon: WifiIcon },
  { value: 'Parking', label: 'Parking', icon: CarIcon },
  { value: 'Security', label: 'Security', icon: ShieldCheckIcon },
  { value: 'Kitchen', label: 'Kitchen', icon: UtensilsIcon },
  { value: 'Laundry', label: 'Laundry', icon: WashingMachineIcon },
  { value: 'Furnished', label: 'Furnished', icon: SparklesIcon },
  { value: 'Water', label: 'Water' },
  { value: 'Electricity', label: 'Electricity' },
  { value: 'Balcony', label: 'Balcony' },
  { value: 'Garden', label: 'Garden' },
];

const locationOptions = [
  'All Locations',
  'Near Campus',
  'Town Center',
  'Residential Area',
  'Near Shopping',
  'Quiet Area'
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'bedrooms', label: 'Most Bedrooms' },
  { value: 'name', label: 'Name A-Z' },
];

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  className
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    updateFilter('amenities', newAmenities);
  };

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000 ||
    filters.bedrooms !== 'any' ||
    filters.bathrooms !== 'any' ||
    filters.location !== 'All Locations' ||
    filters.amenities.length > 0 ||
    filters.sortBy !== 'newest';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Search Properties
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalResults} properties found
            </span>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-8"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property name, address, or description..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="location" className="text-sm font-medium">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Location
              </Label>
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-sm font-medium">
                <DollarSignIcon className="h-4 w-4 inline mr-1" />
                Sort By
              </Label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filters.amenities.length + 
                 (filters.bedrooms !== 'any' ? 1 : 0) + 
                 (filters.bathrooms !== 'any' ? 1 : 0) + 
                 (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                <DollarSignIcon className="h-4 w-4 inline mr-1" />
                Price Range (Ksh/month)
              </Label>
              <div className="px-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  max={50000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>Ksh {filters.priceRange[0].toLocaleString()}</span>
                  <span>Ksh {filters.priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  <BedIcon className="h-4 w-4 inline mr-1" />
                  Bedrooms
                </Label>
                <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  <BathIcon className="h-4 w-4 inline mr-1" />
                  Bathrooms
                </Label>
                <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amenities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenityOptions.map((amenity) => {
                  const IconComponent = amenity.icon;
                  return (
                    <div key={amenity.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.value}
                        checked={filters.amenities.includes(amenity.value)}
                        onCheckedChange={() => toggleAmenity(amenity.value)}
                      />
                      <Label
                        htmlFor={amenity.value}
                        className="text-sm font-normal cursor-pointer flex items-center gap-1"
                      >
                        {IconComponent && <IconComponent className="h-3 w-3" />}
                        {amenity.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: {filters.searchTerm}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('searchTerm', '')}
                      />
                    </Badge>
                  )}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Price: Ksh {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('priceRange', [0, 50000])}
                      />
                    </Badge>
                  )}
                  {filters.bedrooms !== 'any' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.bedrooms}+ Bedrooms
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('bedrooms', 'any')}
                      />
                    </Badge>
                  )}
                  {filters.bathrooms !== 'any' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.bathrooms}+ Bathrooms
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('bathrooms', 'any')}
                      />
                    </Badge>
                  )}
                  {filters.location !== 'All Locations' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.location}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('location', 'All Locations')}
                      />
                    </Badge>
                  )}
                  {filters.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <XIcon 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleAmenity(amenity)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
