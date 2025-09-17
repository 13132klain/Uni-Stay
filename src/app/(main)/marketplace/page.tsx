'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ShoppingBagIcon, 
  SearchIcon, 
  FilterIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addToCart } from '@/lib/firestore-helpers';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  sellerName: string;
  sellerPhone: string;
  imageUrl: string;
  images: string[]; // Multiple images for item detail view
  postedDate: string;
  isNegotiable: boolean;
  tags: string[];
  stock: number;
  inStock: boolean;
}

const categories = [
  { value: 'all', label: 'All Items', icon: '🛍️' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'utensils', label: 'Utensils', icon: '🍽️' },
  { value: 'books', label: 'Books', icon: '📚' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'other', label: 'Other', icon: '📦' }
];

const mockItems: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Study Desk with Drawers',
    description: 'Perfect study desk with 3 drawers. Great condition, perfect for students. Solid wood construction.',
    price: 2500,
    category: 'furniture',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '2 days ago',
    isNegotiable: false,
    tags: ['study', 'desk', 'drawers', 'wood'],
    stock: 5,
    inStock: true
  },
  {
    id: '2',
    title: 'Samsung Galaxy A32',
    description: 'Samsung Galaxy A32 in excellent condition. Comes with charger, case, and screen protector.',
    price: 15000,
    category: 'electronics',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '1 day ago',
    isNegotiable: false,
    tags: ['phone', 'samsung', 'android', 'smartphone'],
    stock: 3,
    inStock: true
  },
  {
    id: '3',
    title: 'Complete Kitchen Utensil Set',
    description: 'Full set of kitchen utensils including pots, pans, plates, and cutlery. Everything you need to cook.',
    price: 3000,
    category: 'utensils',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '3 days ago',
    isNegotiable: false,
    tags: ['kitchen', 'cooking', 'complete set', 'utensils'],
    stock: 8,
    inStock: true
  },
  {
    id: '4',
    title: 'Engineering Textbooks Bundle',
    description: 'Collection of engineering textbooks for various courses. Great for students. Latest editions.',
    price: 2000,
    category: 'books',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '5 days ago',
    isNegotiable: false,
    tags: ['engineering', 'textbooks', 'academic', 'study'],
    stock: 12,
    inStock: true
  },
  {
    id: '5',
    title: 'Football Boots - Size 42',
    description: 'Nike football boots in good condition. Perfect for campus football. Barely used.',
    price: 1500,
    category: 'sports',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '1 week ago',
    isNegotiable: false,
    tags: ['football', 'nike', 'boots', 'sports'],
    stock: 0,
    inStock: false
  },
  {
    id: '6',
    title: 'Winter Jacket Collection',
    description: '3 winter jackets in various sizes. Perfect for cold weather. Warm and stylish.',
    price: 4000,
    category: 'clothing',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '4 days ago',
    isNegotiable: false,
    tags: ['winter', 'jackets', 'warm', 'clothing'],
    stock: 6,
    inStock: true
  },
  {
    id: '7',
    title: 'Laptop Stand - Adjustable',
    description: 'Adjustable laptop stand for better ergonomics. Perfect for studying and working.',
    price: 800,
    category: 'electronics',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '6 hours ago',
    isNegotiable: false,
    tags: ['laptop', 'stand', 'ergonomic', 'study'],
    stock: 15,
    inStock: true
  },
  {
    id: '8',
    title: 'Coffee Maker - 4 Cups',
    description: 'Small coffee maker perfect for dorm rooms. Makes great coffee for studying sessions.',
    price: 1200,
    category: 'utensils',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '1 day ago',
    isNegotiable: false,
    tags: ['coffee', 'maker', 'kitchen', 'dorm'],
    stock: 4,
    inStock: true
  },
  {
    id: '9',
    title: 'Basketball - Official Size',
    description: 'Official size basketball in good condition. Perfect for campus basketball games.',
    price: 800,
    category: 'sports',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '3 days ago',
    isNegotiable: false,
    tags: ['basketball', 'sports', 'official', 'games'],
    stock: 7,
    inStock: true
  },
  {
    id: '10',
    title: 'Study Lamp - LED',
    description: 'Bright LED study lamp with adjustable brightness. Perfect for late-night studying.',
    price: 600,
    category: 'electronics',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '2 days ago',
    isNegotiable: false,
    tags: ['lamp', 'led', 'study', 'bright'],
    stock: 10,
    inStock: true
  },
  {
    id: '11',
    title: 'Backpack - Laptop Compatible',
    description: 'Spacious backpack with laptop compartment. Perfect for carrying books and laptop.',
    price: 1800,
    category: 'clothing',
    condition: 'excellent',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '5 days ago',
    isNegotiable: false,
    tags: ['backpack', 'laptop', 'books', 'travel'],
    stock: 9,
    inStock: true
  },
  {
    id: '12',
    title: 'Mathematics Textbooks Set',
    description: 'Complete set of mathematics textbooks for first and second year students.',
    price: 1500,
    category: 'books',
    condition: 'good',
    location: 'UniStay Store',
    sellerName: 'UniStay',
    sellerPhone: '0700 000 000',
    imageUrl: 'https://placehold.co/300x200.png',
    images: [
      'https://placehold.co/600x400.png',
      'https://placehold.co/600x400.png'
    ],
    postedDate: '1 week ago',
    isNegotiable: false,
    tags: ['mathematics', 'textbooks', 'academic', 'study'],
    stock: 20,
    inStock: true
  }
];

const conditionColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = () => {
      try {
        // Check if Firebase is properly configured
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        // If Firebase config is missing, show mock data
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your_')) {
          console.log('⚠️ Firebase not configured, showing mock data');
          setItems(mockItems);
          setIsLoading(false);
          return;
        }

        const itemsQuery = query(
          collection(db, 'marketplace'),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
          const itemsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MarketplaceItem[];
          
          // Use real Firebase data if available, otherwise fall back to mock data
          if (itemsData.length > 0) {
          setItems(itemsData);
          } else {
            console.log('📦 No Firebase data, showing mock data');
            setItems(mockItems);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('❌ Error listening to marketplace items:', error);
          console.log('🔄 Falling back to mock data due to Firebase error');
          setItems(mockItems);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('❌ Error setting up real-time listener:', error);
        console.log('🔄 Falling back to mock data due to setup error');
        setItems(mockItems);
        setIsLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    return matchesCategory && matchesSearch && matchesPrice && matchesCondition;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      default:
        return 0;
    }
  });

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist.",
      });
    } else {
      newFavorites.add(itemId);
      toast({
        title: "Added to wishlist",
        description: "Item added to your wishlist.",
      });
    }
    setFavorites(newFavorites);
  };

  const handleAddToCart = async (item: MarketplaceItem) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    if (!item.inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart(user.uid, item.id, 1);
      toast({
        title: "Added to Cart",
        description: `${item.title} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewItem = (item: MarketplaceItem) => {
    // Navigate to item detail page
    window.location.href = `/marketplace/item/${item.id}`;
  };

    return (
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <ShoppingBagIcon className="h-10 w-10 text-primary" />
            Second-Hand Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Shop quality second-hand items at UniStay Store. Find great deals on furniture, electronics, books, and more for Meru University students!
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items, sellers, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="condition">Best Condition</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="w-12"
                >
                  {viewMode === 'grid' ? '⊞' : '☰'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Condition</Label>
                    <Select value={conditionFilter} onValueChange={setConditionFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All conditions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPriceRange([0, 50000]);
                        setConditionFilter('all');
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex flex-col items-center gap-1 p-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-xs hidden md:block">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Items Display */}
      <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'} mb-8`}>
        {sortedItems.map((item) => (
          <Card key={item.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
            <div className={`${viewMode === 'list' ? 'w-32 h-24' : 'aspect-[4/3]'} relative`}>
                <img
                src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 p-1 h-6 w-6"
                onClick={() => toggleFavorite(item.id)}
              >
                <HeartIcon 
                  className={`h-3 w-3 ${
                    favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-white'
                  }`} 
                />
              </Button>
              <Badge className={`absolute top-1 left-1 text-xs px-1 py-0 ${conditionColors[item.condition]}`}>
                {item.condition}
              </Badge>
            </div>
            
            <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm line-clamp-1 font-medium">{item.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-1 text-muted-foreground">{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      Ksh {item.price.toLocaleString()}
                    </span>
                    {item.inStock ? (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0">
                        {item.stock}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 px-1 py-0">
                        Out
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPinIcon className="h-3 w-3" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      size="sm"
                      className="flex-1 text-xs h-7" 
                      onClick={() => handleViewItem(item)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                    >
                      <ShoppingBagIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Results Counter */}
      {sortedItems.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {sortedItems.length} of {items.length} items
          </p>
        </div>
      )}

      {/* No Results */}
      {sortedItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBagIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse different categories
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setPriceRange([0, 50000]);
                setConditionFilter('all');
              }}>
                Clear All Filters
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Adjust Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Information */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-semibold mb-2">UniStay Store</h3>
          <p className="text-muted-foreground mb-4">
            Quality second-hand items for Meru University students. All items are inspected and guaranteed.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Contact Store
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Visit Store
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Safety Tips for Buyers & Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">For Buyers:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Meet in public places for transactions</li>
                <li>• Inspect items before payment</li>
                <li>• Use secure payment methods</li>
                <li>• Trust your instincts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Sellers:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Provide clear, honest descriptions</li>
                <li>• Include good quality photos</li>
                <li>• Set reasonable prices</li>
                <li>• Respond promptly to inquiries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
