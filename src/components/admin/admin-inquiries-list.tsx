'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, orderBy, query, onSnapshot, type Timestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircleIcon, XCircleIcon, RefreshCwIcon, MessageSquareIcon, PhoneIcon, CalendarIcon, DollarSignIcon } from 'lucide-react';
import InquiryAnalytics from './inquiry-analytics';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Inquiry extends DocumentData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  houseId: string;
  houseName: string;
  houseAddress: string;
  agentName: string;
  agentPhone: string;
  preferredMoveInDate: Timestamp | Date;
  numberOfTenants: number;
  message: string;
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'offer_made' | 'accepted' | 'rejected' | 'closed';
  submittedAt: Timestamp | Date;
  contactedAt?: Timestamp | Date;
  closedAt?: Timestamp | Date;
  rentAmount: number;
}

type InquiryStatus = Inquiry['status'];

const statusOrder: InquiryStatus[] = [
  'new',
  'contacted',
  'viewing_scheduled',
  'offer_made',
  'accepted',
  'rejected',
  'closed',
];

export default function AdminInquiriesList() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setError("Firebase is not initialized");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const inquiriesCollectionRef = collection(db, 'inquiries');
    const q = query(inquiriesCollectionRef, orderBy('submittedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedInquiries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Inquiry[];
        setInquiries(fetchedInquiries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching inquiries:', err);
        setError('Failed to load inquiries. Please try again.');
        toast({
          title: 'Error Loading Inquiries',
          description: err.message || 'Could not fetch inquiries.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const inquiryCountsByStatus = useMemo(() => {
    const counts: Record<InquiryStatus, number> = {
      new: 0,
      contacted: 0,
      viewing_scheduled: 0,
      offer_made: 0,
      accepted: 0,
      rejected: 0,
      closed: 0,
    };
    inquiries.forEach(inquiry => {
      if (counts[inquiry.status] !== undefined) {
        counts[inquiry.status]++;
      }
    });
    return counts;
  }, [inquiries]);

  const handleUpdateStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [inquiryId]: true }));
    try {
      const response = await fetch('/api/update-inquiry-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inquiryId, 
          newStatus,
          adminUserId: 'admin' // TODO: Get actual admin user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update inquiry status');
      }
      
      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === inquiryId ? { 
            ...inquiry, 
            status: newStatus, 
            contactedAt: newStatus === 'contacted' ? new Date() : inquiry.contactedAt,
            closedAt: ['rejected', 'closed'].includes(newStatus) ? new Date() : inquiry.closedAt
          } : inquiry
        )
      );

      toast({
        title: 'Inquiry Status Updated',
        description: `Inquiry has been marked as ${newStatus.replace(/_/g, ' ')}.`,
        variant: newStatus === 'rejected' || newStatus === 'closed' ? 'destructive' : 'default',
      });
    } catch (err: any) {
      console.error('Error updating inquiry status:', err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update inquiry status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [inquiryId]: false }));
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

  const getStatusBadgeVariant = (status: Inquiry['status']) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'viewing_scheduled':
      case 'offer_made':
        return 'secondary';
      case 'contacted': return 'outline';
      case 'new': return 'outline';
      case 'rejected':
      case 'closed':
        return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClassName = (status: Inquiry['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-600 hover:bg-green-700 text-white dark:text-white';
      case 'viewing_scheduled':
        return 'bg-blue-500 hover:bg-blue-600 text-white dark:text-white';
      case 'offer_made':
        return 'bg-purple-500 hover:bg-purple-600 text-white dark:text-white';
      case 'contacted':
        return 'bg-orange-500 hover:bg-orange-600 text-orange-950 dark:text-orange-950';
      case 'new':
        return 'border-yellow-500 text-yellow-600 hover:bg-yellow-500/10';
      case 'rejected':
      case 'closed':
        return 'bg-red-600 hover:bg-red-700 text-white dark:text-white';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: Inquiry['status'], className?: string) => {
    const baseClassName = cn("mr-2 h-4 w-4", className);
    switch (status) {
      case 'accepted': return <CheckCircleIcon className={cn(baseClassName, "text-green-500")} />;
      case 'viewing_scheduled': return <CalendarIcon className={cn(baseClassName, "text-blue-500")} />;
      case 'offer_made': return <DollarSignIcon className={cn(baseClassName, "text-purple-500")} />;
      case 'contacted': return <PhoneIcon className={cn(baseClassName, "text-orange-500")} />;
      case 'new': return <MessageSquareIcon className={cn(baseClassName, "text-yellow-500")} />;
      case 'rejected': return <XCircleIcon className={cn(baseClassName, "text-red-500")} />;
      case 'closed': return <XCircleIcon className={cn(baseClassName, "text-red-700")} />;
      default: return <MessageSquareIcon className={cn(baseClassName, "text-muted-foreground")} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading inquiries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <InquiryAnalytics inquiries={inquiries} />
      
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statusOrder.map((status) => (
          <Card key={status} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{inquiryCountsByStatus[status]}</div>
              <p className="text-sm text-muted-foreground capitalize">{status.replace(/_/g, ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Property Inquiries</CardTitle>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Tenants</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.houseName}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{inquiry.userName}</div>
                      <div className="text-sm text-muted-foreground">{inquiry.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        <a href={`tel:${inquiry.agentPhone}`} className="text-primary hover:underline">
                          {inquiry.agentPhone}
                        </a>
                      </div>
                      <div className="text-xs text-muted-foreground">{inquiry.agentName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatMoveInDate(inquiry.preferredMoveInDate)}</TableCell>
                  <TableCell>{inquiry.numberOfTenants}</TableCell>
                  <TableCell>Ksh {inquiry.rentAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(inquiry.status)}
                      className={`capitalize ${getStatusBadgeClassName(inquiry.status)} flex items-center min-w-[200px] justify-center py-1 px-3`}
                    >
                      {getStatusIcon(inquiry.status)}
                      {inquiry.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(inquiry.submittedAt)}</TableCell>
                  <TableCell>{formatDate(inquiry.contactedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                      {inquiry.status === 'new' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'contacted')}
                          disabled={updatingStatus[inquiry.id]}
                          className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                          title="Mark as contacted"
                        >
                          {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {!updatingStatus[inquiry.id] && <PhoneIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                          Contacted
                        </Button>
                      )}
                      {['new', 'contacted'].includes(inquiry.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'viewing_scheduled')}
                          disabled={updatingStatus[inquiry.id]}
                          className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                          title="Schedule viewing"
                        >
                          {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {!updatingStatus[inquiry.id] && <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                          Schedule Viewing
                        </Button>
                      )}
                      {['contacted', 'viewing_scheduled'].includes(inquiry.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'offer_made')}
                          disabled={updatingStatus[inquiry.id]}
                          className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                          title="Make offer"
                        >
                          {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {!updatingStatus[inquiry.id] && <DollarSignIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                          Make Offer
                        </Button>
                      )}
                      {inquiry.status === 'offer_made' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(inquiry.id, 'accepted')}
                            disabled={updatingStatus[inquiry.id]}
                            className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                            title="Accept offer"
                          >
                            {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!updatingStatus[inquiry.id] && <CheckCircleIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(inquiry.id, 'rejected')}
                            disabled={updatingStatus[inquiry.id]}
                            className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                            title="Reject offer"
                          >
                            {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!updatingStatus[inquiry.id] && <XCircleIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                            Reject
                          </Button>
                        </>
                      )}
                      {!['accepted', 'rejected', 'closed'].includes(inquiry.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'closed')}
                          disabled={updatingStatus[inquiry.id]}
                          className="border-gray-500 text-gray-600 hover:bg-gray-500 hover:text-white"
                          title="Close inquiry"
                        >
                          {updatingStatus[inquiry.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {!updatingStatus[inquiry.id] && <XCircleIcon className="mr-1 sm:mr-2 h-4 w-4" />}
                          Close
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {inquiries.length === 0 && (
              <TableCaption>No inquiries found.</TableCaption>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 