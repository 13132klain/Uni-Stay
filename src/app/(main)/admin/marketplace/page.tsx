'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  ShoppingBagIcon,
  FilterIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
  images: string[];
  postedDate: string;
  isNegotiable: boolean;
  tags: string[];
  stock: number;
  inStock: boolean;
}

// Mock data - in real app, this would come from API
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
  }
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'utensils', label: 'Utensils' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' }
];

const conditionColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export default function AdminMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const { toast } = useToast();

  const filteredItems = mockItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'stock-low':
        return a.stock - b.stock;
      case 'stock-high':
        return b.stock - a.stock;
      case 'newest':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      default:
        return 0;
    }
  });

  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    if (confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      toast({
        title: "Item Deleted",
        description: `${itemTitle} has been removed from the marketplace.`,
      });
    }
  };

  const handleToggleStock = (itemId: string, itemTitle: string, currentStock: number) => {
    const newStock = currentStock > 0 ? 0 : 10; // Toggle between 0 and 10
    toast({
      title: "Stock Updated",
      description: `${itemTitle} stock updated to ${newStock} items.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBagIcon className="h-8 w-8 text-primary" />
            Manage Marketplace
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and manage marketplace items for UniStay Store
          </p>
        </div>
        <Link href="/admin/marketplace/add">
          <Button className="bg-primary hover:bg-primary/90">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="stock-low">Stock: Low to High</SelectItem>
                <SelectItem value="stock-high">Stock: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{mockItems.length}</p>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockItems.filter(item => item.inStock).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockItems.filter(item => !item.inStock).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  Ksh {mockItems.reduce((sum, item) => sum + (item.price * item.stock), 0).toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">Ksh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Items</CardTitle>
          <CardDescription>
            Manage all items in the UniStay marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="w-16 h-16 relative overflow-hidden rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <Badge className={conditionColors[item.condition]}>
                      {item.condition}
                    </Badge>
                    {item.inStock ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        In Stock ({item.stock})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Ksh {item.price.toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>Posted {item.postedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/marketplace/item/${item.id}`}>
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/marketplace/edit/${item.id}`}>
                    <Button variant="outline" size="sm">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStock(item.id, item.title, item.stock)}
                  >
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {sortedItems.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first marketplace item'
                }
              </p>
              {(!searchQuery && selectedCategory === 'all') && (
                <Link href="/admin/marketplace/add">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
