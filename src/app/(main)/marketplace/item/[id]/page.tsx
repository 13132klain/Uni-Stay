'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeftIcon,
  HeartIcon,
  ShoppingBagIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { addToWishlist, removeFromWishlist, getWishlistItems } from '@/lib/firestore-helpers';

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
  imageUrl?: string;
  images?: string[];
  postedDate?: string;
  isNegotiable?: boolean;
  tags?: string[];
  stock?: number;
  inStock?: boolean;
}


const conditionColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const itemId = params.id as string;
        const itemDoc = await getDoc(doc(db, 'marketplace', itemId));
        
        if (itemDoc.exists()) {
          const itemData = itemDoc.data();
          const itemWithId = {
            id: itemDoc.id,
            ...itemData
          } as MarketplaceItem;
          setItem(itemWithId);

          // Check if item is in user's wishlist
          if (user) {
            try {
              const wishlistItems = await getWishlistItems(user.uid);
              const isInWishlist = wishlistItems.some(wishlistItem => wishlistItem.itemId === itemId);
              setIsInWishlist(isInWishlist);
            } catch (error) {
              console.error('Error checking wishlist:', error);
            }
          }
        } else {
          setItem(null);
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        setItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [params.id, user]);

  const handleAddToCart = () => {
    if (!item) return;

    if (!item.inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    if (quantity > (item.stock || 0)) {
      toast({
        title: "Stock Limit Reached",
        description: `Only ${item.stock || 0} items available in stock.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${item.title} has been added to your cart.`,
    });
  };

  const handleAddToWishlist = async () => {
    if (!item || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist(user.uid, item.id);
        setIsInWishlist(false);
        toast({
          title: "Removed from Wishlist",
          description: `${item.title} removed from your wishlist.`,
        });
      } else {
        await addToWishlist(user.uid, item.id);
        setIsInWishlist(true);
        toast({
          title: "Added to Wishlist",
          description: `${item.title} added to your wishlist.`,
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = () => {
    if (!item) return;

    if (item.inStock === false) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Proceeding to Checkout",
      description: `You are about to purchase ${quantity}x ${item.title} for Ksh ${(item.price * quantity).toLocaleString()}`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4"></div>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="aspect-square sm:aspect-[4/3] lg:aspect-square bg-gray-200 rounded"></div>
            <div className="space-y-3 sm:space-y-4">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Item Not Found</h1>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">The item you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4 sm:mb-6"
        size="sm"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Image Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-square sm:aspect-[4/3] lg:aspect-square relative overflow-hidden rounded-lg border">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[selectedImage]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-500 text-sm">No image available</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative overflow-hidden rounded-md border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${item.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={conditionColors[item.condition]}>
                {item.condition}
              </Badge>
              {item.inStock !== false ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  In Stock ({item.stock || 0})
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XIcon className="h-3 w-3 mr-1" />
                  Out of Stock
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{item.title}</h1>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-3">
              Ksh {item.price.toLocaleString()}
            </p>
            
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {item.description}
            </p>
          </div>

          <Separator />

          {/* Product Info */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span>Posted {item.postedDate || 'Recently'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span>Sold by {item.sellerName}</span>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Tags</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Quantity and Actions */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-2 w-fit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(item.stock || 0, quantity + 1))}
                  disabled={quantity >= (item.stock || 0)}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={item.inStock === false}
                size="sm"
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                variant="outline"
                onClick={handleAddToWishlist}
                size="sm"
                className="px-3"
              >
                <HeartIcon 
                  className={`h-4 w-4 ${
                    isInWishlist ? 'fill-red-500 text-red-500' : ''
                  }`} 
                />
              </Button>
            </div>

            <Button 
              className="w-full" 
              onClick={handleBuyNow}
              disabled={item.inStock === false}
              size="sm"
            >
              Buy Now - Ksh {(item.price * quantity).toLocaleString()}
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 sm:mt-8 grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Shipping & Returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              • Free pickup from UniStay Store
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • Delivery available within campus (Ksh 200)
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • 7-day return policy for defective items
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • All items inspected and guaranteed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              • UniStay Store - Meru University
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • Open: Monday - Friday, 8AM - 6PM
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • Contact: 0700 000 000
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              • Quality guaranteed on all items
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
