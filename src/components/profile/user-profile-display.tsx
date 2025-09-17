
'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, type DocumentData, type Timestamp, collection, getDocs, query, where, deleteDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserCircleIcon, MailIcon, Edit3Icon, Loader2, AlertTriangleIcon, CalendarDaysIcon, HeartIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
// import { createCanvas } from 'canvas'; // Removed for Windows compatibility

type UserProfileDisplayProps = {
  userId: string;
};

interface UserProfileData extends DocumentData {
  fullName?: string;
  email?: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
  favoriteHouseIds?: string[];
  phone?: string;
}

export default function UserProfileDisplay({ userId }: UserProfileDisplayProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelling, setCancelling] = useState<Record<string, boolean>>({});

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfileError('User ID is missing.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    try {
      if (!db) {
        throw new Error("Firebase is not initialized");
      }
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setProfile(userDocSnap.data() as UserProfileData);
      } else {
        setProfileError('Profile data not found. Please complete your profile.');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setProfileError(`Failed to load profile data: ${err.message || 'Please try again later.'}`);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;
    setLoadingBookings(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      setUserBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      toast({ title: 'Error', description: 'Could not load your bookings.', variant: 'destructive' });
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if(userId) {
        fetchProfile();
        fetchBookings();
    } else {
        setLoadingProfile(false);
        setProfileError("User ID not available to load profile.");
    }
  }, [fetchProfile, userId, fetchBookings]);

  const handleCancelBooking = async (booking: any) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(prev => ({ ...prev, [booking.id]: true }));
    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      if (booking.houseId) {
        const houseRef = doc(db, 'houses', booking.houseId);
        await runTransaction(db, async (transaction) => {
          const houseSnap = await transaction.get(houseRef);
          if (!houseSnap.exists()) return;
          const houseData = houseSnap.data();
          const newAvailableUnits = (houseData.availableUnits || 0) + 1;
          transaction.update(houseRef, {
            availableUnits: newAvailableUnits,
            status: 'available',
          });
        });
      }
      setUserBookings(prev => prev.filter(b => b.id !== booking.id));
      toast({ title: 'Booking Cancelled', description: 'Your booking has been cancelled and the unit is now available.', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Cancel Failed', description: err.message || 'Could not cancel booking.', variant: 'destructive' });
    } finally {
      setCancelling(prev => ({ ...prev, [booking.id]: false }));
    }
  };

  const handleDownloadReceipt = (booking: any) => {
    const doc = new jsPDF();
    // Colors
    const orange = '#FF8800';
    const deepBlue = '#1A237E';

    // Header bar
    doc.setFillColor(deepBlue);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(28);
    doc.setTextColor(255,255,255);
    doc.text('UniStay', 105, 20, { align: 'center' });

    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('UniStay', 105, 100, { align: 'center', angle: 30, opacity: 0.15 });
    doc.restoreGraphicsState();
    doc.setFont('helvetica', 'normal');

    // Title
    doc.setFontSize(16);
    doc.setTextColor(orange);
    doc.text('Booking Payment Receipt', 105, 38, { align: 'center' });

    // Section background
    doc.setFillColor(255, 248, 240); // light orange tint
    doc.roundedRect(15, 45, 180, 60, 4, 4, 'F');

    // Tenant Name
    doc.setFontSize(13);
    doc.setTextColor(deepBlue);
    doc.text('Tenant Name:', 25, 60);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0,0,0);
    doc.text(`${profile?.fullName || ''}`, 70, 60);
    doc.setFont('helvetica', 'normal');

    // Date
    doc.setTextColor(deepBlue);
    doc.text('Date:', 25, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0,0,0);
    doc.text(`${booking.requestedAt?.toDate ? booking.requestedAt.toDate().toLocaleString() : ''}`, 70, 70);
    doc.setFont('helvetica', 'normal');

    // Booking Ref/ID
    doc.setTextColor(deepBlue);
    doc.text('Booking Ref:', 25, 80);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0,0,0);
    doc.text(`${booking.id}`, 70, 80);
    doc.setFont('helvetica', 'normal');

    // Phone Number
    doc.setTextColor(deepBlue);
    doc.text('Phone Number:', 25, 90);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0,0,0);
    doc.text(`${profile?.phone || ''}`, 70, 90);
    doc.setFont('helvetica', 'normal');

    // Custom Message Section
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 110, 180, 20, 4, 4, 'F');
    doc.setFontSize(13);
    doc.setTextColor(orange);
    doc.text('Thank you for booking with UniStay!', 105, 123, { align: 'center' });

    // Barcode for booking ID (Windows-compatible version)
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, booking.id, { format: 'CODE128', width: 2, height: 40, displayValue: false });
      const barcodeDataUrl = canvas.toDataURL('image/png');
      doc.addImage(barcodeDataUrl, 'PNG', 55, 135, 100, 20);
    } catch (error) {
      console.warn('Barcode generation failed:', error);
      // Fallback: just add the booking ID as text
      doc.setFontSize(10);
      doc.text(`Booking ID: ${booking.id}`, 55, 145);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(deepBlue);
    doc.text('UniStay • Simple • Transparent • Honest', 105, 165, { align: 'center' });
    doc.setTextColor(150);
    doc.text('For support, contact info@unistay.co.ke', 105, 171, { align: 'center' });

    // Save PDF
    doc.save(`unistay-receipt-${booking.id}.pdf`);
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number } | Timestamp | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy p');
    }
    if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
      return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy p');
    }
    if (typeof (timestamp as Timestamp).toDate === 'function') {
        return format((timestamp as Timestamp).toDate(), 'MMM d, yyyy p');
    }
    return 'Invalid Date';
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-lg border-destructive">
        <CardHeader className="text-center">
          <AlertTriangleIcon className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle>Profile Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md mb-4">{profileError}</p>
           <Button asChild variant="outline">
             <Link href="/profile/edit">Complete/Edit Your Profile</Link>
           </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userId && !loadingProfile) {
     return (
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader className="text-center">
          <UserCircleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">User information is loading or not available.</p>
           <p className="text-sm text-muted-foreground">If this persists, please try refreshing the page or logging in again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile && !loadingProfile && !profileError) {
    return (
       <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader className="text-center">
          <UserCircleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">We couldn't find your profile information.</p>
          <Button asChild variant="outline">
            <Link href="/profile/edit">Create Your Profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {profile && (
        <Card className="w-full max-w-4xl mx-auto shadow-xl">
          <CardHeader className="text-center pb-4">
            <UserCircleIcon className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl">My Profile</CardTitle>
            <CardDescription>
              Welcome back! Here's your profile information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-8 space-y-4">
            <div className="flex flex-col sm:flex-row">
              <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                Name:
              </h3>
              <span className="w-full sm:w-2/3">{profile.fullName || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                Email:
              </h3>
              <span className="w-full sm:w-2/3">{profile.email || 'N/A'}</span>
            </div>
            {profile.phone && (
              <div className="flex flex-col sm:flex-row">
                <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                  Phone:
                </h3>
                <span className="w-full sm:w-2/3">{profile.phone}</span>
              </div>
            )}
            {profile.createdAt && (
              <div className="flex flex-col sm:flex-row">
                <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                  <CalendarDaysIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
                  Member Since
                </h3>
                <p className="text-foreground sm:w-2/3">{formatDate(profile.createdAt)}</p>
              </div>
            )}
             <div className="flex flex-col sm:flex-row">
                <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                  <HeartIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
                  Favorite Listings
                </h3>
                <Link href="/profile/favorites" className="text-primary hover:underline sm:w-2/3">
                    View my {profile.favoriteHouseIds?.length || 0} favorites
                </Link>
              </div>
          </CardContent>
          <CardFooter className="px-4 sm:px-8 py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
             <Button variant="outline" asChild>
                <Link href="/profile/favorites">
                    <HeartIcon className="mr-2 h-4 w-4" /> My Favorites
                </Link>
            </Button>
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/profile/edit">
                <Edit3Icon className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* After profile card, show user bookings */}
      <Card className="w-full max-w-4xl mx-auto shadow-xl mt-8">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">My Bookings</CardTitle>
          <CardDescription>Manage your active and past bookings.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-8 space-y-4">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading bookings...
            </div>
          ) : userBookings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">You have no bookings yet.</div>
          ) : (
            <div className="space-y-4">
              {userBookings.map(booking => (
                <Card key={booking.id} className="border p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{booking.houseName}</div>
                    <div className="text-sm text-muted-foreground">Status: <span className="capitalize">{booking.status.replace(/_/g, ' ')}</span></div>
                    <div className="text-sm text-muted-foreground">Requested: {booking.requestedAt?.toDate ? booking.requestedAt.toDate().toLocaleString() : ''}</div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 sm:mt-0"
                    onClick={() => handleDownloadReceipt(booking)}
                  >
                    Download Receipt
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
