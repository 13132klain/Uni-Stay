
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc, orderBy, query, type Timestamp, type DocumentData, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircleIcon, XCircleIcon, RefreshCwIcon, AlertTriangleIcon, InfoIcon, ClockIcon, HourglassIcon, ShieldCheckIcon, BanIcon, ListFilterIcon, TrendingUpIcon, PrinterIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Booking extends DocumentData {
  id: string;
  userId: string;
  userEmail?: string;
  houseId: string;
  houseName: string;
  houseAddress: string;
  agentName: string;
  agentPhone: string;
  moveInDate: Timestamp | Date;
  guests: number;
  status: 'pending' | 'awaiting_manual_payment' | 'pending_admin_confirmation' | 'confirmed' | 'rejected' | 'cancelled';
  requestedAt: Timestamp | Date;
  paymentConfirmedByTenantAt?: Timestamp | Date;
  adminConfirmedAt?: Timestamp | Date; 
  adminRejectedAt?: Timestamp | Date; 
  bookingFee?: number;
  totalRent?: number;
}

type BookingStatus = Booking['status'];

const statusOrder: BookingStatus[] = [
  'pending',
  'awaiting_manual_payment',
  'pending_admin_confirmation',
  'confirmed',
  'rejected',
  'cancelled',
];


export default function AdminBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookingsCollectionRef = collection(db, 'bookings');
      const q = query(bookingsCollectionRef, orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load booking requests. Please try again.');
      toast({
        title: 'Error Loading Bookings',
        description: err.message || 'Could not fetch bookings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const bookingCountsByStatus = useMemo(() => {
    const counts: Record<BookingStatus, number> = {
      pending: 0,
      awaiting_manual_payment: 0,
      pending_admin_confirmation: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
    };
    bookings.forEach(booking => {
      if (counts[booking.status] !== undefined) {
        counts[booking.status]++;
      }
    });
    return counts;
  }, [bookings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingDocRef = doc(db, 'bookings', bookingId);
      const updateData: { status: Booking['status'], adminConfirmedAt?: any, adminRejectedAt?: any } = { status: newStatus };
      
      if (newStatus === 'confirmed') {
        updateData.adminConfirmedAt = serverTimestamp();
        delete updateData.adminRejectedAt; 
      } else if (newStatus === 'rejected') {
         updateData.adminRejectedAt = serverTimestamp();
         delete updateData.adminConfirmedAt; 
      } else {
        // For other statuses like 'pending_admin_confirmation', clear both admin action timestamps
        // Firestore SDK handles `null` as a valid value to clear fields or you can use `deleteField()`
        // For simplicity and to avoid potential issues with undefined, setting to null explicitly if you want to clear.
        // However, if the field might not exist, just not including it in updateData is fine.
        // If you want to explicitly remove them if they exist, use Firestore's deleteField(), but that's more complex here.
        // Let's assume not setting them is enough if they shouldn't be there.
        // If 'pending_admin_confirmation' means resetting, you might want to set adminConfirmedAt and adminRejectedAt to null.
        // This example keeps it simpler: only sets what's directly relevant for 'confirmed' or 'rejected'.
        // For 'pending_admin_confirmation', we ensure these fields are not set if we're reverting.
        if (newStatus === 'pending_admin_confirmation') {
            // If reverting to pending_admin_confirmation, we might want to nullify these
             updateData.adminConfirmedAt = null; // Or Firebase's deleteField()
             updateData.adminRejectedAt = null; // Or Firebase's deleteField()
        }
      }


      await updateDoc(bookingDocRef, updateData);
      
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { 
            ...booking, 
            status: newStatus, 
            adminConfirmedAt: newStatus === 'confirmed' ? new Date() : (newStatus === 'pending_admin_confirmation' ? undefined : booking.adminConfirmedAt), 
            adminRejectedAt: newStatus === 'rejected' ? new Date() : (newStatus === 'pending_admin_confirmation' ? undefined : booking.adminRejectedAt)
          } : booking
        )
      );

      toast({
        title: 'Booking Status Updated',
        description: `Booking has been ${newStatus.replace(/_/g, ' ')}.`,
        variant: newStatus === 'rejected' || newStatus === 'cancelled' ? 'destructive' : 'default',
      });
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update booking status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined | null): string => {
    if (!timestamp) return 'N/A';
    if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
      return format((timestamp as Timestamp).toDate(), 'MMM d, yyyy HH:mm');
    }
    if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy HH:mm');
    }
    return 'Invalid Date';
  };
  
  const formatMoveInDate = (timestamp: Timestamp | Date | undefined): string => {
     if (!timestamp) return 'N/A';
    if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
      return format((timestamp as Timestamp).toDate(), 'MMM d, yyyy');
    }
    if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy');
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

  const getStatusIcon = (status: Booking['status'], className?: string) => {
    const baseClassName = cn("mr-2 h-4 w-4", className);
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className={cn(baseClassName, "text-green-500")} />;
      case 'awaiting_manual_payment': return <HourglassIcon className={cn(baseClassName, "text-orange-500")} />;
      case 'pending_admin_confirmation': return <ShieldCheckIcon className={cn(baseClassName, "text-blue-500")} />;
      case 'pending': return <ClockIcon className={cn(baseClassName, "text-yellow-500")} />;
      case 'rejected': return <XCircleIcon className={cn(baseClassName, "text-red-500")} />;
      case 'cancelled': return <BanIcon className={cn(baseClassName, "text-red-700")} />;
      default: return <ListFilterIcon className={cn(baseClassName, "text-muted-foreground")} />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading booking requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <AlertTriangleIcon className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg">{error}</p>
        <Button onClick={fetchBookings} className="mt-4 no-print">
          <RefreshCwIcon className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold flex items-center">
              <TrendingUpIcon className="mr-2 h-6 w-6 text-primary"/>
              Booking Status Overview
          </h2>
          <Button onClick={handlePrint} variant="outline" size="sm" className="no-print">
            <PrinterIcon className="mr-2 h-4 w-4" /> Print List
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusOrder.map((status) => (
            <Card key={status} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {status.replace(/_/g, ' ')}
                </CardTitle>
                {getStatusIcon(status, "h-5 w-5 text-muted-foreground !mr-0")}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bookingCountsByStatus[status]}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total {status.replace(/_/g, ' ')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-10">
            <InfoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Booking Requests Found</h3>
            <p className="text-muted-foreground">There are currently no booking requests to display.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-md bg-card printable-table-container">
          <Table>
            <TableCaption>
              A list of all booking requests. Newest requests are shown first.
              <span className="no-print">
                <Button variant="link" size="sm" onClick={fetchBookings} className="ml-2 p-0 h-auto text-primary" disabled={loading || Object.values(updatingStatus).some(v => v)}>
                  <RefreshCwIcon className={`mr-1 h-3 w-3 ${(loading || Object.values(updatingStatus).some(v => v)) ? 'animate-spin' : ''}`} /> Refresh List
                </Button>
              </span>
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">House Name</TableHead>
                <TableHead className="min-w-[180px]">Tenant Email</TableHead>
                <TableHead>Booking Fee</TableHead>
                <TableHead className="min-w-[150px]">Move-in Date</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead className="min-w-[240px]">Status</TableHead>
                <TableHead className="min-w-[180px]">Requested At</TableHead>
                <TableHead className="min-w-[180px]">Tenant Confirmed Payment</TableHead>
                <TableHead className="min-w-[180px]">Admin Action At</TableHead>
                <TableHead className="min-w-[180px] text-right no-print">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.houseName}</TableCell>
                  <TableCell>{booking.userEmail || booking.userId}</TableCell>
                  <TableCell>
                    {typeof booking.bookingFee === 'number' ? `Ksh ${booking.bookingFee.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>{formatMoveInDate(booking.moveInDate)}</TableCell>
                  <TableCell>{booking.guests}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(booking.status)}
                      className={`capitalize ${getStatusBadgeClassName(booking.status)} flex items-center min-w-[200px] justify-center py-1 px-3`}
                    >
                      {getStatusIcon(booking.status)}
                      {booking.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(booking.requestedAt)}</TableCell>
                  <TableCell>{formatDate(booking.paymentConfirmedByTenantAt)}</TableCell>
                  <TableCell>
                    {booking.status === 'confirmed' && booking.adminConfirmedAt ? (
                      <span className="text-green-600">{formatDate(booking.adminConfirmedAt)}</span>
                    ) : booking.status === 'rejected' && booking.adminRejectedAt ? (
                      <span className="text-red-600">{formatDate(booking.adminRejectedAt)}</span>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-right no-print">
                    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                      {(booking.status === 'pending_admin_confirmation' || booking.status === 'awaiting_manual_payment' || booking.status === 'pending') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            disabled={updatingStatus[booking.id]}
                            className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                            title="Approve and confirm booking"
                          >
                            {updatingStatus[booking.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!updatingStatus[booking.id] &&<CheckCircleIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                            disabled={updatingStatus[booking.id]}
                            className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                            title="Reject booking request"
                          >
                            {updatingStatus[booking.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!updatingStatus[booking.id] && <XCircleIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                            Reject
                          </Button>
                        </>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'rejected') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'pending_admin_confirmation')} 
                            disabled={updatingStatus[booking.id]}
                            className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                            title="Revert status to 'Pending Admin Confirmation'"
                          >
                            {updatingStatus[booking.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!updatingStatus[booking.id] && <RefreshCwIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                            Pend Confirm
                          </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
