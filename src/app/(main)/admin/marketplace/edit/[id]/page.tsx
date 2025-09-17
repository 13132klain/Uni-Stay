'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeftIcon,
  PlusIcon,
  XIcon,
  SaveIcon,
  TrashIcon
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
  }
];

const categories = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'utensils', label: 'Utensils' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' }
];

const conditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

export default function EditMarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    stock: '',
    tags: [] as string[],
    images: [] as string[],
    isNegotiable: false,
    inStock: true
  });
  
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    const itemId = params.id as string;
    const foundItem = mockItems.find(i => i.id === itemId);
    
    if (foundItem) {
      setItem(foundItem);
      setFormData({
        title: foundItem.title,
        description: foundItem.description,
        price: foundItem.price.toString(),
        category: foundItem.category,
        condition: foundItem.condition,
        stock: foundItem.stock.toString(),
        tags: [...foundItem.tags],
        images: [...foundItem.images],
        isNegotiable: foundItem.isNegotiable,
        inStock: foundItem.inStock
      });
    }
    setIsLoading(false);
  }, [params.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please add at least one image for the item.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Item Updated Successfully",
        description: `${formData.title} has been updated.`,
      });
      
      router.push('/admin/marketplace');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    if (confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Item Deleted",
          description: `${item.title} has been removed from the marketplace.`,
        });
        
        router.push('/admin/marketplace');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
          <p className="text-muted-foreground mb-4">The item you're trying to edit doesn't exist.</p>
          <Link href="/admin/marketplace">
            <Button>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/marketplace">
            <Button variant="ghost">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Marketplace Item</h1>
            <p className="text-muted-foreground">
              Update item details for {item.title}
            </p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete Item
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about the item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Study Desk with Drawers"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the item in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (Ksh) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="2500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="5"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images and Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Images & Tags</CardTitle>
              <CardDescription>
                Add images and tags for better discoverability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Images */}
              <div>
                <Label>Images *</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Image URL"
                    />
                    <Button type="button" onClick={handleAddImage} size="sm">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <img src={image} alt={`Preview ${index + 1}`} className="w-12 h-12 object-cover rounded" />
                        <span className="flex-1 text-sm truncate">{image}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(image)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Item Settings</CardTitle>
            <CardDescription>
              Configure additional item options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inStock">Item is in stock</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle whether this item is available for purchase
                </p>
              </div>
              <Switch
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) => handleInputChange('inStock', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-8">
          <Link href="/admin/marketplace">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Item...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Update Item
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
