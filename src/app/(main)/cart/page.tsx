'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingBagIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { CartItem, MarketplaceItem } from '@/lib/firestore-helpers';
import Link from 'next/link';

interface CartItemWithDetails extends CartItem {
  item: MarketplaceItem;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadCartItems(currentUser.uid);
      } else {
        setCartItems([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCartItems = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Get cart items from Firestore
      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', userId)
      );
      
      const cartSnapshot = await getDocs(cartQuery);
      const cartItemsData = cartSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];

      // Get marketplace items for each cart item
      const itemsWithDetails = await Promise.all(
        cartItemsData.map(async (cartItem) => {
          try {
            const itemDoc = await getDoc(doc(db, 'marketplace', cartItem.itemId));
            
            if (itemDoc.exists()) {
              const itemData = itemDoc.data();
              return {
                ...cartItem,
                item: {
                  id: itemDoc.id,
                  ...itemData
                } as MarketplaceItem
              } as CartItemWithDetails;
            }
            // Return a default item if not found
            return {
              ...cartItem,
              item: {
                id: cartItem.itemId,
                title: 'Item not found',
                description: 'This item is no longer available',
                price: 0,
                category: 'other',
                condition: 'poor' as const,
                location: 'Unknown',
                sellerName: 'Unknown',
                sellerPhone: '',
                imageUrl: '',
                images: [],
                postedDate: '',
                isNegotiable: false,
                tags: [],
                stock: 0,
                inStock: false,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              } as MarketplaceItem
            } as CartItemWithDetails;
          } catch (error) {
            console.error('Error loading item details:', error);
            return {
              ...cartItem,
              item: {
                id: cartItem.itemId,
                title: 'Error loading item',
                description: 'Failed to load item details',
                price: 0,
                category: 'other',
                condition: 'poor' as const,
                location: 'Unknown',
                sellerName: 'Unknown',
                sellerPhone: '',
                imageUrl: '',
                images: [],
                postedDate: '',
                isNegotiable: false,
                tags: [],
                stock: 0,
                inStock: false,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              } as MarketplaceItem
            } as CartItemWithDetails;
          }
        })
      );

      setCartItems(itemsWithDetails);
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items. Please try again.",
        variant: "destructive",
      });
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      await updateDoc(doc(db, 'cart', cartItemId), {
        quantity: newQuantity
      });
      
      // Update local state
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await deleteDoc(doc(db, 'cart', cartItemId));
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      
      toast({
        title: "Removed from Cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, cartItem) => {
      return total + (cartItem.item?.price || 0) * cartItem.quantity;
    }, 0);
  };

  const calculateItemCount = () => {
    return cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBagIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your cart
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBagIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add some items to get started
            </p>
            <Button asChild>
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/marketplace">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {calculateItemCount()} {calculateItemCount() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((cartItem) => (
            <Card key={cartItem.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {cartItem.item?.imageUrl ? (
                      <img
                        src={cartItem.item.imageUrl}
                        alt={cartItem.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBagIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {cartItem.item?.title || 'Item not found'}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {cartItem.item?.description || 'Description not available'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {cartItem.item?.condition || 'Unknown'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Stock: {cartItem.item?.stock || 0}
                      </span>
                    </div>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        Ksh {((cartItem.item?.price || 0) * cartItem.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ksh {(cartItem.item?.price || 0).toLocaleString()} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                        disabled={cartItem.quantity <= 1}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {cartItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                        disabled={cartItem.quantity >= (cartItem.item?.stock || 0)}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(cartItem.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items ({calculateItemCount()})</span>
                  <span>Ksh {calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>Ksh {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Link>
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/marketplace">
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
