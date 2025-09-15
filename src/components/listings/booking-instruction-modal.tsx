'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, UsersIcon, PhoneIcon, MailIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, CreditCardIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { House } from '@/lib/mock-data';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

type BookingInstructionModalProps = {
  house: House;
};

export default function BookingInstructionModal({ house }: BookingInstructionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const { toast } = useToast();

  // Calculate booking fee based on room type
  const getBookingFee = () => {
    // Bedsitters (0 bedrooms) = 1000 KES
    // Single rooms (1 bedroom) = 500 KES
    // Multi-bedroom (2+ bedrooms) = 1000 KES
    if (house.bedrooms === 0) return 1000; // Bedsitter
    if (house.bedrooms === 1) return 500;  // Single room
    return 1000; // Multi-bedroom
  };

  const bookingFee = getBookingFee();

  // Check authentication on mount
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmPayment = async () => {
    if (!currentUser) return;
    setIsConfirming(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        houseId: house.id,
        houseName: house.name,
        houseAddress: house.address,
        agentName: house.agent?.name,
        agentPhone: house.agent?.phone,
        status: 'awaiting_payment_verification',
        requestedAt: serverTimestamp(),
        bookingFee: bookingFee,
        totalRent: house.price,
      });
      setHasPaid(true);
      toast({
        title: 'Booking Submitted',
        description: 'Thank you! We will verify your payment and confirm your booking soon.',
        variant: 'success',
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Could not submit your booking request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (authLoading) {
    return (
      <Button disabled className="w-full" size="lg">
        Loading...
      </Button>
    );
  }

  if (!currentUser) {
    return (
      <Button asChild className="w-full" size="lg">
        <Link href={`/auth/login?redirect=/listings/${house.id}`}>
          Login to Book Now
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          Book Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Book This Property
          </DialogTitle>
          <DialogDescription className="text-center">
            Confirm your booking and UniStay will handle the rest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{house.name}</CardTitle>
              <CardDescription>{house.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{house.bedrooms} Bedrooms</span>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">
                  KES {house.price.toLocaleString()}/month
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Booking Process */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Booking Process</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Confirm Your Interest</p>
                  <p className="text-sm text-muted-foreground">Click confirm below to express your interest in this property</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">UniStay Contacts You</p>
                  <p className="text-sm text-muted-foreground">We'll call or email you within 2 hours to discuss details</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Arrange Viewing & Payment</p>
                  <p className="text-sm text-muted-foreground">Schedule a viewing and discuss payment terms</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium">Complete Booking</p>
                  <p className="text-sm text-muted-foreground">Sign lease agreement and move in on your preferred date</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Fee Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Booking Fee</h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Booking Fee:</span>
                <Badge variant="secondary" className="text-lg font-semibold">
                  KES {bookingFee.toLocaleString()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {house.bedrooms === 0 ? 'Bedsitter' : house.bedrooms === 1 ? 'Single Room' : 'Multi-bedroom'} - 
                {bookingFee === 500 ? ' KES 500' : ' KES 1,000'} booking fee
              </p>
            </div>
          </div>

          <Separator />

          {/* Payment Instructions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">M-Pesa Payment Instructions</h3>
            <ol className="list-decimal list-inside mb-4">
              <li>Go to <b>M-Pesa</b> on your phone.</li>
              <li>Select <b>Lipa na M-Pesa</b>.</li>
              <li>Choose <b>Buy Goods and Services</b>.</li>
              <li>Enter Till Number: <b>3755770</b></li>
              <li>Enter Amount: <b>KES {bookingFee}</b></li>
              <li>Enter your M-Pesa PIN and confirm.</li>
            </ol>
            <p className="mb-4 text-sm text-muted-foreground">
              After payment, click the button below to confirm your booking request.
            </p>
            {!hasPaid ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmPayment}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'I Have Paid'
                )}
              </Button>
            ) : (
              <div>
                <p className="text-green-600 font-semibold">
                  Thank you! We will verify your payment and confirm your booking soon.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Important Notes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Important Information</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircleIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  This booking fee secures your reservation. The property will be held for you for 24 hours after payment.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <ClockIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  UniStay will contact you within 2 hours to arrange viewing and discuss rent payment.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Booking fee is non-refundable but will be deducted from your first month's rent.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="text-center space-y-3">
            <p className="text-sm font-medium">Need immediate assistance?</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center">
                <MailIcon className="h-3 w-3 mr-1" />
                <span>bookings@unistay.co.ke</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 