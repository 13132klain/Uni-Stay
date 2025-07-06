'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, UsersIcon, LogInIcon, Loader2, SendIcon, ShieldCheckIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { House } from '@/lib/mock-data';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, doc, updateDoc, type Timestamp, query, where, getDocs, type DocumentData, runTransaction, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

type BookingFormProps = {
  house: House;
};

interface ExistingBooking extends DocumentData {
  id: string;
  houseName: string;
  status: 'pending' | 'awaiting_manual_payment' | 'pending_admin_confirmation' | 'confirmed' | 'rejected' | 'cancelled';
}

export default function BookingForm({ house }: BookingFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [guests, setGuests] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmittingInitialRequest, setIsSubmittingInitialRequest] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showManualPaymentInstructions, setShowManualPaymentInstructions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [userActiveBookingCheck, setUserActiveBookingCheck] = useState<'idle' | 'loading' | 'has_active' | 'no_active'>('idle');
  const [activeBookingInfo, setActiveBookingInfo] = useState<ExistingBooking | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setUserActiveBookingCheck('loading');
        try {
          const bookingsRef = collection(db!, 'bookings');
          const q = query(bookingsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          let foundActiveBooking: ExistingBooking | null = null;
          querySnapshot.forEach((docSnap) => {
            const bookingData = docSnap.data() as ExistingBooking;
            if ([
              'pending',
              'awaiting_manual_payment',
              'pending_admin_confirmation',
              'confirmed',
            ].includes(bookingData.status)) {
              foundActiveBooking = { ...bookingData, id: docSnap.id };
            }
          });

          if (foundActiveBooking) {
            setActiveBookingInfo(foundActiveBooking);
            setUserActiveBookingCheck('has_active');
          } else {
            setUserActiveBookingCheck('no_active');
            setActiveBookingInfo(null);
          }
        } catch (error) {
          console.error("Error checking for active bookings:", error);
          toast({ title: "Error", description: "Could not verify existing bookings. Please try again.", variant: "destructive" });
          setUserActiveBookingCheck('no_active');
        }
      } else {
        setUserActiveBookingCheck('idle');
        setActiveBookingInfo(null);
      }
    });
    return () => unsubscribe();
  }, [toast, auth, db]);


  const bookingFee = house.price / 2;
  const maxAllowedTenants = 2; 

  const handleInitialRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      toast({
        title: "Internal Error",
        description: "Firebase is not initialized. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a booking request.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser.email) {
      toast({
        title: "Email Not Available",
        description: "Your email address could not be retrieved. This is required for bookings. Please try logging out and back in, or ensure your profile is complete.",
        variant: "destructive",
        duration: 7000,
      });
      setIsSubmittingInitialRequest(false);
      return;
    }
    if (userActiveBookingCheck === 'has_active' || userActiveBookingCheck === 'loading') {
      toast({ title: "Action Not Allowed", description: "Please resolve your active booking first.", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({
        title: "Move-in Date Required",
        description: "Please select a move-in date.",
        variant: "destructive",
      });
      return;
    }
    if (guests < 1 || guests > maxAllowedTenants) {
      toast({
        title: "Invalid Number of Tenants",
        description: `Number of tenants must be between 1 and ${maxAllowedTenants}.`,
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingInitialRequest(true);
    try {
      let userPhone = '';
      let userName = '';
      try {
        const userProfileRef = firestoreDoc(db, 'users', currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          userPhone = userProfileSnap.data().phone || '';
          userName = userProfileSnap.data().fullName || '';
        }
      } catch (err) {
        console.warn('Could not fetch user profile for phone/name:', err);
      }
      await runTransaction(db, async (transaction) => {
        const houseRef = firestoreDoc(db, 'houses', house.id);
        const houseSnap = await transaction.get(houseRef);
        if (!houseSnap.exists()) {
          throw new Error('House does not exist.');
        }
        const houseData = houseSnap.data();
        if (typeof houseData.availableUnits !== 'number' || houseData.availableUnits < 1) {
          throw new Error('No units available for this property.');
        }
        // Create booking
        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userPhone, // <-- add phone number
          userName,  // <-- add full name
          houseId: house.id,
          houseName: house.name,
          houseAddress: house.address,
          agentName: house.agent.name,
          agentPhone: house.agent.phone,
          moveInDate: date,
          guests,
          status: 'awaiting_manual_payment',
          requestedAt: new Date(),
          bookingFee,
          totalRent: house.price,
        });
        // Decrement availableUnits, set status to 'booked' if 0
        const newAvailableUnits = houseData.availableUnits - 1;
        transaction.update(houseRef, {
          availableUnits: newAvailableUnits,
          status: newAvailableUnits === 0 ? 'booked' : 'available',
        });
      });
      toast({ title: "Booking Request Submitted", description: "Your booking request has been submitted. Please follow the payment instructions.", variant: "default" });
      setShowPaymentModal(true);
    } catch (error: any) {
      toast({ title: "Booking Failed", description: error.message || "Could not submit booking request.", variant: "destructive" });
    } finally {
      setIsSubmittingInitialRequest(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingBookingData || !auth || !db) {
      toast({ title: "Error", description: "Booking data or Firebase not found.", variant: "destructive" });
      return;
    }
    setIsConfirmingPayment(true);
    try {
      const docRef = await addDoc(collection(db, 'bookings'), pendingBookingData);
      setBookingId(docRef.id);
      setShowManualPaymentInstructions(false);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setUserActiveBookingCheck('has_active');
      setActiveBookingInfo({ id: docRef.id, houseName: house.name, status: 'awaiting_manual_payment'});
      toast({
        title: "Request Received",
        description: `Your request for ${house.name} is pending. Please wait for UniStay approval.`,
        variant: "default",
        duration: 7000,
      });
    } catch (error: any) {
      console.error("Error submitting booking request:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your booking request. Please try again. " + (error.message || ""),
        variant: "destructive",
      });
    } finally {
      setIsConfirmingPayment(false);
      setPendingBookingData(null);
    }
  };

  if (authLoading || (currentUser && userActiveBookingCheck === 'loading')) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="ml-3 text-muted-foreground">
             {authLoading ? "Loading booking options..." : "Checking existing bookings..."}
            </p>
        </div>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card text-center">
        <CardHeader>
          <LogInIcon className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-xl font-semibold">Login to Book</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            You need to be logged in to request a booking for this property.
          </CardDescription>
          <Button asChild className="w-full">
            <Link href={`/auth/login?redirect=/listings/${house.id}`}>
              Login or Sign Up
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if no units are available
  if (typeof house.availableUnits === 'number' && house.availableUnits <= 0) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card text-center">
        <CardHeader>
          <AlertTriangleIcon className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <CardTitle className="text-xl font-semibold">No Units Available</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 text-muted-foreground">
            Sorry, all units for <strong className="text-foreground">{house.name}</strong> have been booked.
          </CardDescription>
          <p className="text-sm text-muted-foreground mb-4">
            Please check back later or browse other available properties.
          </p>
          <Button asChild className="w-full" variant="outline">
            <Link href="/listings">Browse Other Properties</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!showPaymentModal && userActiveBookingCheck === 'has_active' && activeBookingInfo && !showManualPaymentInstructions) {
    return (
      <Card className="p-6 border rounded-lg shadow-sm bg-card text-center">
        <CardHeader>
          <AlertTriangleIcon className="mx-auto h-10 w-10 text-orange-500 mb-3" />
          <CardTitle className="text-xl font-semibold">Active Booking Found</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 text-muted-foreground">
            You currently have an active booking request for: <br />
            <strong className="text-foreground">{activeBookingInfo.houseName}</strong> (Status: <span className="capitalize font-medium">{activeBookingInfo.status.replace(/_/g, ' ')}</span>).
          </CardDescription>
          <p className="text-sm text-muted-foreground mb-4">
            Please wait for this booking to be resolved (rejected or cancelled) before making a new request.
          </p>
          <Button asChild className="w-full" variant="outline">
            <Link href="/profile">View My Profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  

  return (
    <>
      <form onSubmit={handleInitialRequestSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
        <h3 className="text-xl font-semibold">Request to Book</h3>
        <div>
          <Label htmlFor="date" className="mb-1 block">Preferred Move-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={isSubmittingInitialRequest || showManualPaymentInstructions || userActiveBookingCheck === 'has_active'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(day) => day < new Date(new Date().setHours(0,0,0,0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="guests" className="mb-1 block">Number of Tenants</Label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="guests"
              type="number"
              value={guests}
              onChange={(e) => {
                const rawValue = e.target.value;
                let newGuestValue = guests; 
                if (rawValue === "") {
                  newGuestValue = 1; 
                } else {
                  const parsedNum = parseInt(rawValue, 10);
                  if (!isNaN(parsedNum)) {
                    newGuestValue = Math.min(Math.max(1, parsedNum), maxAllowedTenants);
                  }
                }
                setGuests(newGuestValue);
              }}
              min="1"
              max={maxAllowedTenants} 
              className="pl-10"
              disabled={isSubmittingInitialRequest || showManualPaymentInstructions || userActiveBookingCheck === 'has_active'}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Max tenants allowed: {maxAllowedTenants}</p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmittingInitialRequest || showManualPaymentInstructions || userActiveBookingCheck === 'loading' || userActiveBookingCheck === 'has_active'}>
          {isSubmittingInitialRequest ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            'Request Booking & Proceed to Payment'
          )}
        </Button>
         <p className="text-xs text-muted-foreground text-center">
          You will be asked to make a 50% booking fee payment via M-Pesa in the next step.
        </p>
      </form>
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              To secure your booking for <strong>{house.name}</strong>, please make a payment.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="bg-accent/20 p-4 rounded-md border border-accent">
              <p className="text-sm text-accent-foreground/90">
                Booking Fee (50% of Rent): <strong className="text-lg">Ksh {bookingFee.toLocaleString()}</strong>
              </p>
              <p className="text-sm text-accent-foreground/90 mt-1">
                Total Rent: Ksh {house.price.toLocaleString()}/month
              </p>
            </div>
            <div className="text-left p-4 border rounded-md bg-card">
              <p className="font-medium text-md mb-2">How to Pay via M-Pesa Till:</p>
              <ol className="list-decimal list-inside text-sm text-muted-foreground mb-2 space-y-1">
                <li>Go to <strong>M-Pesa</strong> on your phone.</li>
                <li>Select <strong>Lipa Na Mpesa</strong>.</li>
                <li>Click on <strong>Till Number</strong>.</li>
                <li>Enter Till Number: <strong>3755770</strong></li>
                <li>Enter the amount: <strong>Ksh {bookingFee.toLocaleString()}</strong></li>
                <li>Enter your M-Pesa PIN.</li>
                <li>Confirm payment.</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">After payment, click the button below to confirm your booking request.</p>
            </div>
            <Button
              onClick={handleConfirmPayment}
              className="w-full"
              size="lg"
              disabled={isConfirmingPayment}
            >
              {isConfirmingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing Booking...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="mr-2 h-4 w-4" />
                  Confirm Payment & Finalize Booking
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              After confirmation, UniStay will review your booking. You can track the status in your profile.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full mt-2">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Request Submitted</DialogTitle>
            <DialogDescription>
              Thank you! Your booking request has been received. Please wait for UniStay approval. You can track your booking status in your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Booking Submitted!</p>
            <p className="text-sm text-muted-foreground mt-2">We will notify you once your booking is approved or if further action is needed.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full mt-2">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

