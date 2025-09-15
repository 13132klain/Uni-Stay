'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShirtIcon, 
  ClockIcon, 
  MapPinIcon, 
  StarIcon, 
  PhoneIcon, 
  CalendarIcon,
  CheckCircleIcon,
  Loader2Icon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LaundryService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  rating: number;
  location: string;
  phone: string;
  image?: string;
}

const laundryServices: LaundryService[] = [
  {
    id: '1',
    name: 'Quick Wash & Dry',
    description: 'Standard wash and dry service for everyday clothes. Perfect for students with busy schedules.',
    price: 150,
    duration: '2-3 hours',
    features: ['Wash & Dry', 'Folding', 'Basic Detergent', 'Same Day Service'],
    rating: 4.8,
    location: 'Near Campus Gate',
    phone: '+254 700 123 456'
  },
  {
    id: '2',
    name: 'Premium Care',
    description: 'Delicate handling for special garments, formal wear, and expensive clothing items.',
    price: 300,
    duration: '4-6 hours',
    features: ['Delicate Wash', 'Steam Press', 'Premium Detergent', 'Hanger Return'],
    rating: 4.9,
    location: 'Town Center',
    phone: '+254 700 234 567'
  },
  {
    id: '3',
    name: 'Bulk Laundry',
    description: 'Economical option for large loads. Great for monthly deep cleaning or shared laundry.',
    price: 80,
    duration: '1-2 days',
    features: ['Bulk Pricing', 'Wash & Dry', 'Basic Folding', 'Pickup Available'],
    rating: 4.6,
    location: 'Student Area',
    phone: '+254 700 345 678'
  },
  {
    id: '4',
    name: 'Express Service',
    description: 'Ultra-fast service for urgent needs. Your clothes ready in record time.',
    price: 250,
    duration: '1 hour',
    features: ['Express Wash', 'Quick Dry', 'Immediate Service', 'Priority Handling'],
    rating: 4.7,
    location: 'Campus Proximity',
    phone: '+254 700 456 789'
  }
];

interface BookingData {
  serviceId: string;
  serviceName: string;
  price: number;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  specialInstructions: string;
  contactPhone: string;
}

export default function LaundryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<LaundryService | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: '',
    serviceName: '',
    price: 0,
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    contactPhone: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleServiceSelect = (service: LaundryService) => {
    setSelectedService(service);
    setBookingData(prev => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price
    }));
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to book laundry services.',
        variant: 'destructive'
      });
      return;
    }

    setIsBooking(true);
    
    try {
      await addDoc(collection(db, 'laundryBookings'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        ...bookingData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: 'Booking Successful!',
        description: 'Your laundry service has been booked. You will receive a confirmation call shortly.',
      });

      // Reset form
      setShowBookingForm(false);
      setSelectedService(null);
      setBookingData({
        serviceId: '',
        serviceName: '',
        price: 0,
        pickupDate: '',
        pickupTime: '',
        deliveryDate: '',
        deliveryTime: '',
        specialInstructions: '',
        contactPhone: ''
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'There was an error processing your booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
    }
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
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <ShirtIcon className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold">Laundry Services</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional laundry services designed for Meru University students. 
          Clean, convenient, and affordable solutions for your laundry needs.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
        {laundryServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-2">{service.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-sm">
                      KES {service.price}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {service.duration}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{service.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4 text-base">
                {service.description}
              </CardDescription>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {service.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {service.phone}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">What's Included:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircleIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleServiceSelect(service)}
                  className="w-full mt-4"
                  disabled={!user}
                >
                  {user ? 'Book This Service' : 'Login to Book'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Book {selectedService.name}</CardTitle>
              <CardDescription>
                Complete your booking details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Service:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price:</span>
                    <span className="font-medium">KES {selectedService.price}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Pickup Date</label>
                    <input
                      type="date"
                      required
                      value={bookingData.pickupDate}
                      onChange={(e) => setBookingData(prev => ({ ...prev, pickupDate: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pickup Time</label>
                    <select
                      required
                      value={bookingData.pickupTime}
                      onChange={(e) => setBookingData(prev => ({ ...prev, pickupTime: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                    >
                      <option value="">Select time</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={bookingData.deliveryDate}
                      onChange={(e) => setBookingData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                      min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Delivery Time</label>
                    <select
                      required
                      value={bookingData.deliveryTime}
                      onChange={(e) => setBookingData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                    >
                      <option value="">Select time</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={bookingData.contactPhone}
                    onChange={(e) => setBookingData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+254 700 000 000"
                    className="w-full p-2 border rounded-md mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Special Instructions (Optional)</label>
                  <textarea
                    value={bookingData.specialInstructions}
                    onChange={(e) => setBookingData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special requirements or notes..."
                    className="w-full p-2 border rounded-md mt-1 h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isBooking}
                    className="flex-1"
                  >
                    {isBooking ? (
                      <>
                        <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
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
        <h3 className="text-xl font-semibold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2">1. Book Your Service</h4>
            <p className="text-sm text-muted-foreground">
              Choose your preferred service and schedule pickup and delivery times.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <ShirtIcon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2">2. We Collect & Clean</h4>
            <p className="text-sm text-muted-foreground">
              Our team picks up your clothes and provides professional cleaning service.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-medium mb-2">3. Fresh & Delivered</h4>
            <p className="text-sm text-muted-foreground">
              Your clean, fresh clothes are delivered back to you at the scheduled time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
