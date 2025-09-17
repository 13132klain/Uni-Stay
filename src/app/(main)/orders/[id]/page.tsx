'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon, 
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  PackageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface OrderItem {
  itemId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface DeliveryInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  deliveryInfo: DeliveryInfo;
  paymentMethod: 'mpesa' | 'cash';
  paymentReference?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

interface OrderPageProps {
  params: {
    id: string;
  };
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
    description: 'Your order is being processed'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircleIcon,
    description: 'Your order has been confirmed'
  },
  processing: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800',
    icon: PackageIcon,
    description: 'Your order is being prepared'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800',
    icon: PackageIcon,
    description: 'Your order is on the way'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
    description: 'Your order has been delivered'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: ClockIcon,
    description: 'Your order has been cancelled'
  }
};

export default function OrderPage({ params }: OrderPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadOrder(params.id, currentUser.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id]);

  const loadOrder = async (orderId: string, userId: string) => {
    try {
      setIsLoading(true);
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data() as Order;
        
        // Check if user owns this order
        if (orderData.userId !== userId) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this order.",
            variant: "destructive",
          });
          setOrder(null);
          return;
        }
        
        setOrder({
          ...orderData,
          id: orderDoc.id
        });
      } else {
        toast({
          title: "Order Not Found",
          description: "The order you're looking for doesn't exist.",
          variant: "destructive",
        });
        setOrder(null);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateItemCount = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <PackageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your order
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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <PackageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status];

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
          <h1 className="text-3xl font-bold">Order #{order.id.slice(-8)}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <statusInfo.icon className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
                <p className="text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5" />
                Order Items ({calculateItemCount()})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBagIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.deliveryInfo.fullName}</p>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.deliveryInfo.phone}</p>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">Delivery Address</p>
                <p className="text-muted-foreground">
                  {order.deliveryInfo.address}
                </p>
                {order.deliveryInfo.city && (
                  <p className="text-muted-foreground">
                    {order.deliveryInfo.city}
                  </p>
                )}
              </div>

              {order.deliveryInfo.notes && (
                <div>
                  <p className="font-medium mb-1">Delivery Notes</p>
                  <p className="text-muted-foreground">
                    {order.deliveryInfo.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}
                  </span>
                </div>
                {order.paymentReference && (
                  <div className="flex justify-between">
                    <span>Payment Reference:</span>
                    <span className="font-medium text-sm">
                      {order.paymentReference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold text-lg text-primary">
                    Ksh {order.totalAmount.toLocaleString()}
                  </span>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items ({calculateItemCount()})</span>
                  <span>Ksh {order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>Ksh {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Order placed on {formatDate(order.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated on {formatDate(order.updatedAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href="/marketplace">
                    Continue Shopping
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">
                    View All Orders
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
