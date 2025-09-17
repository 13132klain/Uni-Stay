'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCardIcon, 
  MapPinIcon, 
  PhoneIcon, 
  UserIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  CheckIcon,
  Loader2Icon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, addDoc, Timestamp } from 'firebase/firestore';
import { CartItem, MarketplaceItem } from '@/lib/firestore-helpers';
import Link from 'next/link';

interface CartItemWithDetails extends CartItem {
  item: MarketplaceItem;
}

interface DeliveryInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Meru',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash'>('mpesa');
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadCartItems(currentUser.uid);
        // Pre-fill user info
        setDeliveryInfo(prev => ({
          ...prev,
          fullName: currentUser.displayName || '',
          email: currentUser.email || ''
        }));
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
      
      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', userId)
      );
      
      const cartSnapshot = await getDocs(cartQuery);
      const cartItemsData = cartSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];

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

  const calculateTotal = () => {
    return cartItems.reduce((total, cartItem) => {
      return total + (cartItem.item?.price || 0) * cartItem.quantity;
    }, 0);
  };

  const calculateItemCount = () => {
    return cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const validateForm = () => {
    if (!deliveryInfo.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }
    if (!deliveryInfo.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return false;
    }
    if (!deliveryInfo.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your delivery address.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const processMpesaPayment = async () => {
    try {
      const response = await fetch('/api/mpesa-stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: deliveryInfo.phone.replace(/\D/g, ''), // Remove non-digits
          amount: calculateTotal(),
          accountReference: `UNISTAY-${Date.now()}`,
          transactionDesc: `UniStay Marketplace Order - ${calculateItemCount()} items`
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      throw error;
    }
  };

  const createOrder = async (paymentReference?: string) => {
    try {
      const orderData = {
        userId: user.uid,
        items: cartItems.map(cartItem => ({
          itemId: cartItem.itemId,
          title: cartItem.item?.title || 'Unknown Item',
          price: cartItem.item?.price || 0,
          quantity: cartItem.quantity,
          imageUrl: cartItem.item?.imageUrl || ''
        })),
        deliveryInfo,
        paymentMethod,
        paymentReference,
        totalAmount: calculateTotal(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const deletePromises = cartItems.map(cartItem => 
        deleteDoc(doc(db, 'cart', cartItem.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      let paymentResult = null;
      
      if (paymentMethod === 'mpesa') {
        paymentResult = await processMpesaPayment();
      }

      const orderId = await createOrder(paymentResult?.CheckoutRequestID);
      await clearCart();

      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${orderId} has been placed. ${paymentMethod === 'mpesa' ? 'Please complete the M-Pesa payment on your phone.' : 'You will pay on delivery.'}`,
      });

      // Redirect to order confirmation
      window.location.href = `/orders/${orderId}`;
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An error occurred during checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <CreditCardIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to proceed with checkout
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
                <div className="h-4 bg-muted rounded w-3/4"></div>
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
              Add some items to proceed with checkout
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
          <Link href="/cart">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Delivery Information
              </CardTitle>
              <CardDescription>
                Enter your delivery details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={deliveryInfo.fullName}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={deliveryInfo.phone}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={deliveryInfo.email}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your complete delivery address"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Meru"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={deliveryInfo.notes}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'mpesa' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                  onClick={() => setPaymentMethod('mpesa')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'mpesa' ? 'border-primary bg-primary' : 'border-muted'
                    }`}>
                      {paymentMethod === 'mpesa' && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">M-Pesa</h4>
                      <p className="text-sm text-muted-foreground">
                        Pay securely with M-Pesa STK Push
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary' : 'border-muted'
                    }`}>
                      {paymentMethod === 'cash' && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">Cash on Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        Pay when your order is delivered
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {cartItem.item?.imageUrl ? (
                        <img
                          src={cartItem.item.imageUrl}
                          alt={cartItem.item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBagIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {cartItem.item?.title || 'Item not found'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Qty: {cartItem.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        Ksh {((cartItem.item?.price || 0) * cartItem.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

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

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    {paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place Order'}
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/cart">
                  Back to Cart
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
