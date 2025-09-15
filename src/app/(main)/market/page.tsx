'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingBagIcon, 
  SearchIcon, 
  FilterIcon, 
  HeartIcon, 
  MapPinIcon, 
  ClockIcon,
  UserIcon,
  PlusIcon,
  Loader2Icon,
  StarIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  sellerName: string;
  sellerPhone: string;
  location: string;
  images: string[];
  createdAt: any;
  userId: string;
  isAvailable: boolean;
}

const categories = [
  'Electronics',
  'Books & Study Materials',
  'Clothing & Accessories',
  'Furniture & Home',
  'Sports & Fitness',
  'Beauty & Personal Care',
  'Kitchen & Dining',
  'Other'
];

const conditions = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-500' },
  { value: 'good', label: 'Good', color: 'bg-blue-500' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-500' },
  { value: 'poor', label: 'Poor', color: 'bg-red-500' }
];

export default function MarketPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showListingForm, setShowListingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'good' as const,
    location: '',
    contactPhone: '',
    images: [] as string[]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadMarketItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory, selectedCondition, sortBy]);

  const loadMarketItems = async () => {
    try {
      const itemsRef = collection(db, 'marketItems');
      const q = query(itemsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketItem[];
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading market items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load market items. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by condition
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    // Sort items
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
        break;
      default: // newest
        filtered.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    }

    setFilteredItems(filtered);
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to list items for sale.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'marketItems'), {
        ...listingData,
        price: parseFloat(listingData.price),
        sellerName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        sellerPhone: listingData.contactPhone,
        userId: user.uid,
        isAvailable: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: 'Item Listed Successfully!',
        description: 'Your item has been added to the marketplace.',
      });

      // Reset form and reload items
      setListingData({
        title: '',
        description: '',
        price: '',
        category: '',
        condition: 'good',
        location: '',
        contactPhone: '',
        images: []
      });
      setShowListingForm(false);
      loadMarketItems();
    } catch (error) {
      console.error('Listing error:', error);
      toast({
        title: 'Listing Failed',
        description: 'There was an error listing your item. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConditionBadge = (condition: string) => {
    const conditionData = conditions.find(c => c.value === condition);
    if (!conditionData) return null;
    
    return (
      <Badge className={`${conditionData.color} text-white`}>
        {conditionData.label}
      </Badge>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold">Student Marketplace</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Buy and sell second-hand items with fellow Meru University students. 
          Find great deals on textbooks, electronics, furniture, and more!
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-muted/50 rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger>
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {conditions.map(condition => (
                <SelectItem key={condition.value} value={condition.value}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </p>
          <Button 
            onClick={() => setShowListingForm(true)}
            disabled={!user}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {user ? 'List an Item' : 'Login to List'}
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBagIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedCondition !== 'all'
              ? 'Try adjusting your search filters'
              : 'Be the first to list an item!'}
          </p>
          {user && (
            <Button onClick={() => setShowListingForm(true)}>
              List Your First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  {getConditionBadge(item.condition)}
                </div>
                <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                <div className="text-2xl font-bold text-primary">
                  KES {item.price.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 line-clamp-3">
                  {item.description}
                </CardDescription>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {item.sellerName}
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {item.location}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {formatDate(item.createdAt)}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    asChild
                  >
                    <Link href={`tel:${item.sellerPhone}`}>
                      Contact Seller
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <HeartIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Listing Form Modal */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>List an Item for Sale</CardTitle>
              <CardDescription>
                Share your items with fellow students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleListingSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Item Title *</label>
                    <Input
                      required
                      value={listingData.title}
                      onChange={(e) => setListingData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., MacBook Pro 13-inch"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price (KES) *</label>
                    <Input
                      required
                      type="number"
                      value={listingData.price}
                      onChange={(e) => setListingData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="50000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select
                      value={listingData.category}
                      onValueChange={(value) => setListingData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Condition *</label>
                    <Select
                      value={listingData.condition}
                      onValueChange={(value: any) => setListingData(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map(condition => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    required
                    value={listingData.description}
                    onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your item in detail..."
                    className="w-full p-2 border rounded-md mt-1 h-24 resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Location *</label>
                    <Input
                      required
                      value={listingData.location}
                      onChange={(e) => setListingData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Near Campus Gate"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Phone *</label>
                    <Input
                      required
                      type="tel"
                      value={listingData.contactPhone}
                      onChange={(e) => setListingData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="+254 700 000 000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowListingForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                        Listing...
                      </>
                    ) : (
                      'List Item'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-muted/50 rounded-lg p-6 mt-12">
        <h3 className="text-xl font-semibold mb-4">Marketplace Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">For Sellers:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Provide accurate descriptions and photos</li>
              <li>• Set fair prices for your items</li>
              <li>• Respond promptly to buyer inquiries</li>
              <li>• Meet in safe, public locations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Buyers:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Inspect items before purchasing</li>
              <li>• Negotiate respectfully with sellers</li>
              <li>• Meet in safe, public locations</li>
              <li>• Report any suspicious activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
