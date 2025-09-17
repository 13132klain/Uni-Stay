'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShirtIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon, 
  StarIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  Loader2,
  CalendarIcon,
  WeightIcon,
  CalculatorIcon,
  RefreshCwIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LaundryService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  location: string;
  phone: string;
  rating: number;
  services: string[];
  imageUrl: string;
}

interface LaundryBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  selectedLaundryType: string;
  selectedService: string;
  pickupLocation: string;
  deliveryLocation: string;
  specialInstructions: string;
  estimatedWeight: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  pickupScheduledAt?: any;
  pickupCompletedAt?: any;
  processingStartedAt?: any;
  processingCompletedAt?: any;
  deliveryScheduledAt?: any;
  deliveryCompletedAt?: any;
  assignedTo?: string;
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: any;
}

const featuredItems = [
  {
    id: '1',
    name: 'Student Uniforms',
    description: 'Professional cleaning for school uniforms, lab coats, and formal wear',
    imageUrl: 'https://placehold.co/300x200.png',
    price: 'From Ksh 120/kg',
    features: ['Stain Removal', 'Crisp Ironing', 'Quick Turnaround']
  },
  {
    id: '2',
    name: 'Bedding Sets',
    description: 'Complete bedding cleaning including sheets, pillowcases, and duvet covers',
    imageUrl: 'https://placehold.co/300x200.png',
    price: 'From Ksh 110/kg',
    features: ['Deep Cleaning', 'Fresh Scent', 'Soft Finish']
  },
  {
    id: '3',
    name: 'Delicate Items',
    description: 'Special care for silk, wool, and other delicate fabrics',
    imageUrl: 'https://placehold.co/300x200.png',
    price: 'From Ksh 200/kg',
    features: ['Hand Wash', 'Gentle Cycle', 'Expert Care']
  },
  {
    id: '4',
    name: 'Sports Wear',
    description: 'Odor removal and deep cleaning for gym clothes and sports uniforms',
    imageUrl: 'https://placehold.co/300x200.png',
    price: 'From Ksh 130/kg',
    features: ['Odor Elimination', 'Bacteria Removal', 'Fabric Protection']
  }
];

const laundryTypes = [
  { 
    category: 'Clothing',
    items: [
      { name: 'Shirts & Tops', pricePerKg: 120, description: 'Casual shirts, t-shirts, blouses' },
      { name: 'Pants & Jeans', pricePerKg: 130, description: 'Trousers, jeans, shorts' },
      { name: 'Dresses & Skirts', pricePerKg: 140, description: 'Formal and casual dresses' },
      { name: 'Suits & Blazers', pricePerKg: 200, description: 'Formal wear, business suits' },
      { name: 'Sweaters & Hoodies', pricePerKg: 150, description: 'Pullovers, cardigans, hoodies' },
      { name: 'Underwear & Socks', pricePerKg: 100, description: 'Delicate items, undergarments' }
    ]
  },
  {
    category: 'Bedding',
    items: [
      { name: 'Bed Sheets', pricePerKg: 110, description: 'Single, double, queen bed sheets' },
      { name: 'Pillowcases', pricePerKg: 80, description: 'Standard and king size pillowcases' },
      { name: 'Duvet Covers', pricePerKg: 160, description: 'Comforter covers, duvet sets' },
      { name: 'Blankets', pricePerKg: 140, description: 'Fleece, cotton, wool blankets' },
      { name: 'Towels', pricePerKg: 90, description: 'Bath towels, hand towels, face cloths' },
      { name: 'Curtains', pricePerKg: 180, description: 'Window curtains, drapes' }
    ]
  }
];

const serviceTypes = [
  { value: 'wash-fold', label: 'Wash & Fold', description: 'Standard cleaning and folding' },
  { value: 'dry-clean', label: 'Dry Cleaning', description: 'Professional dry cleaning for delicate items' },
  { value: 'ironing', label: 'Ironing Only', description: 'Ironing service for already clean clothes' },
  { value: 'express', label: 'Express Service', description: 'Same-day or next-day delivery' }
];

export default function LaundryPage() {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedLaundryType, setSelectedLaundryType] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [myBookings, setMyBookings] = useState<LaundryBooking[]>([]);
  const [activeTab, setActiveTab] = useState<string>('book');
  const { toast } = useToast();

  // Calculate price based on selected options
  useEffect(() => {
    if (selectedLaundryType && estimatedWeight > 0) {
      const [category, itemName] = selectedLaundryType.split('-');
      const categoryData = laundryTypes.find(cat => cat.category === category);
      const itemData = categoryData?.items.find(item => item.name === itemName);
      
      if (itemData) {
        let basePrice = itemData.pricePerKg * estimatedWeight;
        
        // Apply service type surcharges
        switch (selectedService) {
          case 'express':
            basePrice *= 1.5; // 50% surcharge
            break;
          case 'dry-clean':
            basePrice *= 2; // 100% surcharge
            break;
          case 'ironing':
            basePrice *= 0.7; // 30% discount for ironing only
            break;
        }
        
        setTotalPrice(Math.round(basePrice));
      }
    }
  }, [selectedLaundryType, selectedService, estimatedWeight]);

  const handleBooking = async () => {
    if (!customerName || !customerPhone || !selectedLaundryType || !selectedService || !pickupLocation || !deliveryLocation) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    if (estimatedWeight < 1) {
      toast({
        title: 'Invalid Weight',
        description: 'Please enter a valid estimated weight (minimum 1kg).',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/laundry/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          selectedLaundryType,
          selectedService,
          pickupLocation,
          deliveryLocation,
          specialInstructions,
          estimatedWeight,
          totalPrice
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Booking Requested Successfully!',
          description: `Your laundry service request has been submitted. Booking ID: ${data.bookingId}. We'll contact you at ${customerPhone} shortly.`,
        });
        
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setSelectedLaundryType('');
        setSelectedService('');
        setPickupLocation('');
        setDeliveryLocation('');
        setSpecialInstructions('');
        setEstimatedWeight(0);
        setTotalPrice(0);
        
        // Switch to bookings tab
        setActiveTab('bookings');
        fetchMyBookings();
      } else {
        throw new Error(data.error || 'Failed to create booking');
      }
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create laundry booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`/api/laundry/booking?phone=${customerPhone}`);
      const data = await response.json();
      
      if (data.success && data.bookings) {
        setMyBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed - Awaiting Pickup';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed - Ready for Delivery';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <ShirtIcon className="h-10 w-10 text-primary" />
          Laundry Services
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          UniStay's professional laundry services for Meru University students. Pick up and delivery available.
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book">Book Service</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Book Service Tab */}
        <TabsContent value="book" className="space-y-8">
          {/* Featured Laundry Items */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Featured Laundry Services</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
              UniStay provides professional laundry services tailored for Meru University students. 
              We specialize in cleaning the items you use most.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-primary">
                      {item.price}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {item.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Enhanced Booking Form */}
          <section className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Book Laundry Service
                </CardTitle>
                <CardDescription>
                  Fill in the details below to request laundry service. We'll calculate the price automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Your Name *</Label>
                    <Input
                      id="customer-name"
                      placeholder="Enter your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone Number *</Label>
                    <Input
                      id="customer-phone"
                      placeholder="e.g., 0712345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="laundry-type">Laundry Type *</Label>
                    <Select value={selectedLaundryType} onValueChange={setSelectedLaundryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select laundry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {laundryTypes.map((category) => (
                          <div key={category.category}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              {category.category}
                            </div>
                            {category.items.map((item) => (
                              <SelectItem key={`${category.category}-${item.name}`} value={`${category.category}-${item.name}`}>
                                {item.name} - Ksh {item.pricePerKg}/kg
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-type">Service Type *</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            <div>
                              <div className="font-medium">{service.label}</div>
                              <div className="text-sm text-muted-foreground">{service.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated-weight" className="flex items-center gap-2">
                      <WeightIcon className="h-4 w-4" />
                      Estimated Weight (kg) *
                    </Label>
                    <Input
                      id="estimated-weight"
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="e.g., 3.5"
                      value={estimatedWeight || ''}
                      onChange={(e) => setEstimatedWeight(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Estimate the total weight of your laundry items
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup-location" className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      Pickup Location *
                    </Label>
                    <Input
                      id="pickup-location"
                      placeholder="e.g., Room 15, Hostel A"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-location" className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      Delivery Location *
                    </Label>
                    <Input
                      id="delivery-location"
                      placeholder="e.g., Room 15, Hostel A"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="special-instructions">Special Instructions</Label>
                    <Textarea
                      id="special-instructions"
                      placeholder="Any special care instructions or preferences..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                    />
                  </div>
                </div>

                {/* Price Calculation Display */}
                {totalPrice > 0 && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalculatorIcon className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Estimated Total Price:</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        Ksh {totalPrice.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Price includes pickup and delivery within campus area
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Pricing Information</h4>
                  <p className="text-sm text-muted-foreground">
                    • Prices are calculated per kilogram of laundry<br/>
                    • Minimum charge: 1kg per order<br/>
                    • Express service: +50% surcharge<br/>
                    • Dry cleaning: +100% surcharge<br/>
                    • Ironing only: -30% discount<br/>
                    • Free pickup and delivery within campus area
                  </p>
                </div>

                <Button 
                  onClick={handleBooking} 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Booking...
                    </>
                  ) : (
                    'Request Laundry Service'
                  )}
                </Button>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Laundry Bookings</h2>
            <Button 
              variant="outline" 
              onClick={fetchMyBookings}
              disabled={!customerPhone}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {!customerPhone ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <PhoneIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Enter Your Phone Number</h3>
                <p className="text-muted-foreground mb-4">
                  To view your bookings, please enter your phone number in the booking form first.
                </p>
                <Button onClick={() => setActiveTab('book')}>
                  Go to Booking Form
                </Button>
              </CardContent>
            </Card>
          ) : myBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <ShirtIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't made any laundry bookings yet. Book your first service now!
                </p>
                <Button onClick={() => setActiveTab('book')}>
                  Book Laundry Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Booking #{booking.id.slice(-8)}</h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Service:</strong> {booking.selectedService.replace('-', ' ').toUpperCase()} - {booking.selectedLaundryType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Weight:</strong> {booking.estimatedWeight}kg | <strong>Price:</strong> Ksh {booking.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Pickup:</strong> {booking.pickupLocation} | <strong>Delivery:</strong> {booking.deliveryLocation}
                        </p>
                        {booking.specialInstructions && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Instructions:</strong> {booking.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {booking.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Laundry Types & Pricing (Per KG)</h2>
            <p className="text-muted-foreground">
              Transparent pricing for all our laundry services. Prices are calculated per kilogram.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {laundryTypes.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                  <CardDescription>Professional cleaning for all {category.category.toLowerCase()} items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div key={item.name} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="text-primary font-semibold">
                          Ksh {item.pricePerKg}/kg
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service Type Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Service Type Pricing</CardTitle>
              <CardDescription>Additional charges and discounts for different service types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceTypes.map((service) => (
                  <div key={service.value} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{service.label}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    <div className="text-lg font-bold text-primary">
                      {service.value === 'express' ? '+50%' : 
                       service.value === 'dry-clean' ? '+100%' : 
                       service.value === 'ironing' ? '-30%' : 'Base Price'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Our Laundry Services?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <TruckIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Pickup & Delivery</h3>
              <p className="text-sm text-muted-foreground">
                We pick up your laundry and deliver it back to your doorstep
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <ShieldCheckIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Quality Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Professional cleaning with quality assurance and care
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <CreditCardIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Flexible Payment</h3>
              <p className="text-sm text-muted-foreground">
                Pay on delivery or through M-Pesa for your convenience
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Info */}
      <section className="text-center">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Contact UniStay support team for any questions about our laundry services
            </p>
            <Button variant="outline">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call UniStay: 0700 000 000
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
