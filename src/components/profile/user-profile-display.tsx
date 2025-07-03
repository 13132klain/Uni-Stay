
'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, type DocumentData, type Timestamp, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserCircleIcon, MailIcon, Edit3Icon, Loader2, AlertTriangleIcon, CalendarDaysIcon, HeartIcon, ListOrderedIcon, InfoIcon, CheckCircleIcon, XCircleIcon, HourglassIcon, ClockIcon, Trash2Icon, ReceiptIcon, BanIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserProfileDisplayProps = {
  userId: string;
};

interface UserProfileData extends DocumentData {
  fullName?: string;
  email?: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
  favoriteHouseIds?: string[];
}

interface Booking extends DocumentData {
  id: string;
  userId: string;
  houseId: string;
  houseName: string;
  houseAddress?: string;
  moveInDate: Timestamp | Date;
  status: 'pending' | 'awaiting_manual_payment' | 'pending_admin_confirmation' | 'confirmed' | 'rejected' | 'cancelled';
  requestedAt: Timestamp | Date;
  bookingFee?: number;
  totalRent?: number;
  userEmail?: string;
  agentName?: string;
  agentPhone?: string;
  adminConfirmedAt?: Timestamp | Date;
  adminRejectedAt?: Timestamp | Date;
  userCancelledAt?: Timestamp | Date;
}

export default function UserProfileDisplay({ userId }: UserProfileDisplayProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const { toast } = useToast();

  const [bookingActionTarget, setBookingActionTarget] = useState<Booking | null>(null);
  const [isProcessingBookingAction, setIsProcessingBookingAction] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfileError('User ID is missing.');
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    try {
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

  const fetchUserBookings = useCallback(async () => {
    if (!userId) {
      setBookingsError('User ID is missing for fetching bookings.');
      setLoadingBookings(false);
      return;
    }
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const bookingsCollectionRef = collection(db, 'bookings');
      const q = query(bookingsCollectionRef, where('userId', '==', userId), orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(docData => ({
        id: docData.id,
        ...docData.data(),
      })) as Booking[];
      setUserBookings(fetchedBookings);
    } catch (err: any) {
      console.error('UserProfileDisplay: Error fetching user bookings:', err);
      if ((err as any).code === 'failed-precondition' && (err as any).message.toLowerCase().includes('index')) {
        setBookingsError(`The query requires a Firestore index. Please check the browser console for a link from Firebase to create it, or check your Firestore indexes in the Firebase console. Error: ${(err as any).message}`);
      } else {
        setBookingsError(`Failed to load your bookings: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoadingBookings(false);
    }
  }, [userId]);

  useEffect(() => {
    if(userId) {
        fetchProfile();
        fetchUserBookings();
    } else {
        setLoadingProfile(false);
        setLoadingBookings(false);
        setProfileError("User ID not available to load profile.");
        setBookingsError("User ID not available to load bookings.");
    }
  }, [fetchProfile, fetchUserBookings, userId]);

  const handleBookingActionConfirm = async () => {
    if (!bookingActionTarget) return;

    setIsProcessingBookingAction(true);
    const targetStatus = bookingActionTarget.status;

    try {
      if (['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(targetStatus)) {
        const bookingDocRef = doc(db, 'bookings', bookingActionTarget.id);
        await updateDoc(bookingDocRef, {
          status: 'cancelled',
          userCancelledAt: serverTimestamp(),
        });
        setUserBookings(prev =>
          prev.map(b =>
            b.id === bookingActionTarget.id ? { ...b, status: 'cancelled', userCancelledAt: new Date() } : b
          )
        );
        toast({
          title: "Booking Cancelled",
          description: `Your booking request for ${bookingActionTarget.houseName} has been cancelled.`,
        });
      } else if (['rejected', 'cancelled'].includes(targetStatus)) {
        await deleteDoc(doc(db, 'bookings', bookingActionTarget.id));
        setUserBookings(prev => prev.filter(b => b.id !== bookingActionTarget.id));
        toast({
          title: "Booking Removed",
          description: `Booking for ${bookingActionTarget.houseName} has been removed from your history.`,
        });
      }
      setBookingActionTarget(null);
    } catch (error: any) {
      console.error("Error processing booking action:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not process the booking action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBookingAction(false);
    }
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
  
  const formatMoveInDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy');
    }
    if (typeof (timestamp as Timestamp).toDate === 'function') {
        return format((timestamp as Timestamp).toDate(), 'MMM d, yyyy');
    }
    return 'Invalid Date';
  };

  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'awaiting_manual_payment':
      case 'pending_admin_confirmation':
        return 'secondary';
      case 'pending': return 'outline';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadgeClassName = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-600 hover:bg-green-700 text-white dark:text-white';
      case 'awaiting_manual_payment':
        return 'bg-orange-500 hover:bg-orange-600 text-orange-950 dark:text-orange-950';
      case 'pending_admin_confirmation':
        return 'bg-blue-500 hover:bg-blue-600 text-white dark:text-white';
      case 'pending':
        return 'border-yellow-500 text-yellow-600 hover:bg-yellow-500/10';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-600 hover:bg-red-700 text-white dark:text-white';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="mr-2 h-4 w-4" />;
      case 'awaiting_manual_payment': return <HourglassIcon className="mr-2 h-4 w-4" />;
      case 'pending_admin_confirmation': return <ClockIcon className="mr-2 h-4 w-4" />;
      case 'pending': return <InfoIcon className="mr-2 h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="mr-2 h-4 w-4" />;
      case 'cancelled': return <BanIcon className="mr-2 h-4 w-4" />;
      default: return null;
    }
  };
  
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  };

  const themeColors = {
    primary: hslToRgb(28, 100, 58), 
    foreground: hslToRgb(220, 75, 22), 
  };

  const handleDownloadReceipt = (booking: Booking) => {
    if (!profile) {
      toast({ title: "Error", description: "User profile data not loaded for receipt generation.", variant: "destructive" });
      return;
    }

    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4' 
    });

    let yPosition = 15; 
    const leftMargin = 15;
    const rightMargin = pdfDoc.internal.pageSize.getWidth() - 15;
    const contentWidth = rightMargin - leftMargin;
    const lineSpacing = 5;
    const sectionSpacing = 8;

    const addText = (text: string, x: number, y: number, size: number = 10, style: 'normal' | 'bold' | 'italic' = 'normal', color: [number, number, number] = themeColors.foreground, options: any = {}) => {
      pdfDoc.setFont('helvetica', style);
      pdfDoc.setFontSize(size);
      pdfDoc.setTextColor(color[0], color[1], color[2]);
      const lines = pdfDoc.splitTextToSize(text, contentWidth - (x > leftMargin ? (x - leftMargin) : 0) );
      pdfDoc.text(lines, x, y, options);
      return y + (lines.length * (size * 0.35)) + (size * 0.15); 
    };
    
    const addLine = (y: number, color: [number, number, number] = themeColors.primary, thickness: number = 0.3) => {
      pdfDoc.setDrawColor(color[0], color[1], color[2]);
      pdfDoc.setLineWidth(thickness);
      pdfDoc.line(leftMargin, y, rightMargin, y);
      return y + thickness + 1;
    };

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(22);
    pdfDoc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
    pdfDoc.text("UniStay", leftMargin, yPosition);
    yPosition += 8;
    yPosition = addLine(yPosition);
    yPosition += sectionSpacing / 2;

    yPosition = addText("Booking Confirmation Receipt", leftMargin, yPosition, 16, 'bold', themeColors.foreground) + lineSpacing;
    yPosition = addText(`Date Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, leftMargin, yPosition, 8, 'italic', themeColors.foreground) + sectionSpacing;

    yPosition = addText("Booking Details", leftMargin, yPosition, 12, 'bold', themeColors.primary) + lineSpacing / 2;
    yPosition = addLine(yPosition, themeColors.primary, 0.2) + lineSpacing;
    yPosition = addText(`Booking ID: ${booking.id}`, leftMargin, yPosition, 9);
    yPosition = addText(`Property Name: ${booking.houseName || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition = addText(`Property Address: ${booking.houseAddress || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition = addText(`Move-in Date: ${formatMoveInDate(booking.moveInDate)}`, leftMargin, yPosition, 9);
    yPosition = addText(`Requested At: ${formatDate(booking.requestedAt)}`, leftMargin, yPosition, 9);
    if (booking.adminConfirmedAt) {
      yPosition = addText(`Confirmed At: ${formatDate(booking.adminConfirmedAt)}`, leftMargin, yPosition, 9);
    }
    yPosition += sectionSpacing;

    yPosition = addText("Tenant Details", leftMargin, yPosition, 12, 'bold', themeColors.primary) + lineSpacing / 2;
    yPosition = addLine(yPosition, themeColors.primary, 0.2) + lineSpacing;
    yPosition = addText(`Tenant Name: ${profile.fullName || booking.userEmail || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition = addText(`Tenant Contact: ${profile.email || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition += sectionSpacing;

    yPosition = addText("Payment Information", leftMargin, yPosition, 12, 'bold', themeColors.primary) + lineSpacing / 2;
    yPosition = addLine(yPosition, themeColors.primary, 0.2) + lineSpacing;
    yPosition = addText(`Booking Fee Paid: Ksh ${booking.bookingFee?.toLocaleString() || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition = addText(`Total Monthly Rent: Ksh ${booking.totalRent?.toLocaleString() || 'N/A'}`, leftMargin, yPosition, 9);
    yPosition += sectionSpacing;
    
    yPosition = Math.max(yPosition, pdfDoc.internal.pageSize.getHeight() - 30); 
    yPosition = addLine(yPosition, themeColors.primary, 0.2) + lineSpacing;
    yPosition = addText("Thank you for choosing UniStay!", leftMargin, yPosition, 10, 'bold', themeColors.primary, {align: 'center'});
    yPosition = addText("Your ideal student living, simplified.", leftMargin, yPosition, 8, 'italic', themeColors.foreground, {align: 'center'});

    pdfDoc.save(`UniStay_Receipt_${booking.id.substring(0,8)}.pdf`);
    toast({ title: "Receipt Downloaded", description: `PDF receipt for ${booking.houseName} has started downloading.`});
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
           <Button asChild>
             <Link href="/profile/edit">Create Your Profile</Link>
           </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-12">
        {profile && (
          <Card className="w-full max-w-xl mx-auto shadow-xl">
            <CardHeader className="items-center text-center">
              <div className="bg-primary text-primary-foreground rounded-full h-24 w-24 flex items-center justify-center text-4xl font-bold mb-4 shadow-md">
                  {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : <UserCircleIcon size={48} />}
              </div>
              <CardTitle className="text-3xl">{profile.fullName || 'User Profile'}</CardTitle>
              <CardDescription>View and manage your profile information and bookings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm sm:text-base px-4 sm:px-8 py-6">
              <div className="flex flex-col sm:flex-row">
                <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                  <UserCircleIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
                  Full Name
                </h3>
                <p className="text-foreground sm:w-2/3">{profile.fullName || 'Not set'}</p>
              </div>
              <div className="flex flex-col sm:flex-row">
                <h3 className="font-semibold flex items-center w-full sm:w-1/3 mb-1 sm:mb-0">
                  <MailIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
                  Email
                </h3>
                <p className="text-foreground sm:w-2/3">{profile.email || 'Not set'}</p>
              </div>
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

        <Card className="w-full max-w-5xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListOrderedIcon className="mr-3 h-6 w-6 text-primary" />
              My Booking Requests
            </CardTitle>
            <CardDescription>
              Here is a history of your booking requests and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBookings && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading your bookings...</p>
              </div>
            )}
            {!loadingBookings && bookingsError && (
              <div className="text-center py-10 text-destructive bg-destructive/10 p-4 rounded-md">
                <AlertTriangleIcon className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Could not load bookings:</p>
                <p className="text-sm">{bookingsError}</p>
                <p className="text-xs mt-2">If this is an index error, please check the browser console for a link from Firebase to create the required index, or verify your Firestore indexes in the Firebase console.</p>
              </div>
            )}
            {!loadingBookings && !bookingsError && userBookings.length === 0 && (
              <div className="text-center py-10">
                <InfoIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-xl font-semibold">No Bookings Found</h3>
                <p className="text-muted-foreground">You haven't made any booking requests yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/listings">Browse Listings</Link>
                </Button>
              </div>
            )}
            {!loadingBookings && !bookingsError && userBookings.length > 0 && (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <Table>
                  <TableCaption>Your recent booking requests.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">House Name</TableHead>
                      <TableHead className="min-w-[150px]">Move-in Date</TableHead>
                      <TableHead className="min-w-[150px]">Requested At</TableHead>
                      <TableHead className="min-w-[120px]">Booking Fee</TableHead>
                      <TableHead className="min-w-[240px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Admin Action At</TableHead>
                      <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBookings.map((booking) => {
                      const isCancelable = ['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(booking.status);
                      const isRemovable = ['rejected', 'cancelled'].includes(booking.status);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.houseName}</TableCell>
                          <TableCell>{formatMoveInDate(booking.moveInDate)}</TableCell>
                          <TableCell>{formatDate(booking.requestedAt)}</TableCell>
                          <TableCell>
                            {typeof booking.bookingFee === 'number' ? `Ksh ${booking.bookingFee.toLocaleString()}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(booking.status)}
                              className={`capitalize ${getStatusBadgeClassName(booking.status)} flex items-center min-w-[200px] justify-center py-1 px-3`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booking.status === 'confirmed' && booking.adminConfirmedAt ? (
                              <span className="text-green-600">{formatDate(booking.adminConfirmedAt)} (Confirmed)</span>
                            ) : booking.status === 'rejected' && booking.adminRejectedAt ? (
                              <span className="text-red-600">{formatDate(booking.adminRejectedAt)} (Rejected)</span>
                            ) : booking.userCancelledAt ? (
                              <span className="text-muted-foreground">{formatDate(booking.userCancelledAt)} (Cancelled by You)</span>
                            )
                            : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {booking.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(booking)}
                                  title="Download PDF Receipt"
                                  className="text-primary border-primary hover:bg-primary/10"
                                >
                                  <ReceiptIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                  Receipt
                                </Button>
                              )}
                              {(isCancelable || isRemovable) && (
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={isCancelable ? "text-orange-600 hover:bg-orange-100 hover:text-orange-700" : "text-destructive hover:bg-destructive/10 hover:text-destructive"}
                                    onClick={() => setBookingActionTarget(booking)}
                                    title={isCancelable ? "Cancel Booking Request" : "Remove from History"}
                                  >
                                    {isCancelable ? <BanIcon className="h-4 w-4 mr-1" /> : <Trash2Icon className="h-4 w-4 mr-1" />}
                                    {isCancelable ? "Cancel" : "Remove"}
                                  </Button>
                                </AlertDialogTrigger>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {bookingActionTarget && ['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(bookingActionTarget.status)
                    ? "Cancel Booking Request?"
                    : "Remove from History?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
                {bookingActionTarget && ['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(bookingActionTarget.status)
                    ? `This will cancel your booking request for ${bookingActionTarget.houseName}. You will be able to make a new booking request afterwards.`
                    : bookingActionTarget ? `This action cannot be undone. This will permanently remove the booking for ${bookingActionTarget.houseName} from your history.` : "Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingActionTarget(null)} disabled={isProcessingBookingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBookingActionConfirm}
              disabled={isProcessingBookingAction}
              className={bookingActionTarget && ['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(bookingActionTarget.status) ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {isProcessingBookingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {bookingActionTarget && ['pending', 'awaiting_manual_payment', 'pending_admin_confirmation'].includes(bookingActionTarget.status)
                    ? "Yes, Cancel Request"
                    : "Yes, Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
