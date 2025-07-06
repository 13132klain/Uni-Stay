'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, type DocumentData, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquareIcon, Loader2, AlertTriangleIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon, PhoneIcon, ClockIcon, DollarSignIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type UserInquiriesDisplayProps = {
  userId: string;
};

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

export default function UserInquiriesDisplay({ userId }: UserInquiriesDisplayProps) {
  const [userInquiries, setUserInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserInquiries = useCallback(async () => {
    if (!userId) {
      setInquiriesError('User ID is missing for fetching inquiries.');
      setLoadingInquiries(false);
      return;
    }
    setLoadingInquiries(true);
    setInquiriesError(null);
    try {
      if (!db) {
        throw new Error("Firebase is not initialized");
      }
      const inquiriesCollectionRef = collection(db, 'inquiries');
      const q = query(inquiriesCollectionRef, where('userId', '==', userId), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedInquiries = querySnapshot.docs.map(docData => ({
        id: docData.id,
        ...docData.data(),
      })) as Inquiry[];
      setUserInquiries(fetchedInquiries);
    } catch (err: any) {
      console.error('UserInquiriesDisplay: Error fetching user inquiries:', err);
      if ((err as any).code === 'failed-precondition' && (err as any).message.toLowerCase().includes('index')) {
        setInquiriesError(`The query requires a Firestore index. Please check the browser console for a link from Firebase to create it, or check your Firestore indexes in the Firebase console. Error: ${(err as any).message}`);
      } else {
        setInquiriesError(`Failed to load your inquiries: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoadingInquiries(false);
    }
  }, [userId]);

  useEffect(() => {
    if(userId) {
        fetchUserInquiries();
    } else {
        setLoadingInquiries(false);
        setInquiriesError("User ID not available to load inquiries.");
    }
  }, [fetchUserInquiries, userId]);

  const formatDate = (timestamp: Timestamp | Date | undefined | null): string => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy p');
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
      case 'viewing_scheduled': return <CalendarDaysIcon className={cn(baseClassName, "text-blue-500")} />;
      case 'offer_made': return <DollarSignIcon className={cn(baseClassName, "text-purple-500")} />;
      case 'contacted': return <PhoneIcon className={cn(baseClassName, "text-orange-500")} />;
      case 'new': return <MessageSquareIcon className={cn(baseClassName, "text-yellow-500")} />;
      case 'rejected': return <XCircleIcon className={cn(baseClassName, "text-red-500")} />;
      case 'closed': return <XCircleIcon className={cn(baseClassName, "text-red-700")} />;
      default: return <MessageSquareIcon className={cn(baseClassName, "text-muted-foreground")} />;
    }
  };

  const getStatusDescription = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return 'Your inquiry has been received and UniStay will contact you soon.';
      case 'contacted':
        return 'UniStay has contacted you about this property.';
      case 'viewing_scheduled':
        return 'A property viewing has been scheduled.';
      case 'offer_made':
        return 'An offer has been made for this property.';
      case 'accepted':
        return 'Your offer has been accepted! UniStay will guide you through the next steps.';
      case 'rejected':
        return 'This inquiry has been rejected or the property is no longer available.';
      case 'closed':
        return 'This inquiry has been closed.';
      default:
        return 'Status unknown.';
    }
  };

  if (loadingInquiries) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquareIcon className="mr-2 h-5 w-5" />
            My Property Inquiries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading your inquiries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inquiriesError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangleIcon className="mr-2 h-5 w-5" />
            Error Loading Inquiries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{inquiriesError}</p>
          <Button onClick={fetchUserInquiries} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquareIcon className="mr-2 h-5 w-5" />
          My Property Inquiries
        </CardTitle>
        <CardDescription>
          Track the status of your property inquiries and interest requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userInquiries.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquareIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inquiries Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any property inquiries yet.
            </p>
            <Button asChild>
              <Link href="/listings">
                Browse Properties
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Move-in Date</TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{inquiry.houseName}</div>
                        <div className="text-sm text-muted-foreground">{inquiry.houseAddress}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatMoveInDate(inquiry.preferredMoveInDate)}</TableCell>
                    <TableCell>{inquiry.numberOfTenants}</TableCell>
                    <TableCell>Ksh {inquiry.rentAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={getStatusBadgeVariant(inquiry.status)}
                          className={`capitalize ${getStatusBadgeClassName(inquiry.status)} flex items-center min-w-[200px] justify-center py-1 px-3`}
                        >
                          {getStatusIcon(inquiry.status)}
                          {inquiry.status.replace(/_/g, ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          {getStatusDescription(inquiry.status)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(inquiry.submittedAt)}</TableCell>
                    <TableCell>{formatDate(inquiry.contactedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Need Help?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                If you have questions about your inquiries or need to update your preferences, 
                please contact UniStay directly.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  <span>Call: +254 XXX XXX XXX</span>
                </div>
                <div className="flex items-center">
                  <MessageSquareIcon className="h-4 w-4 mr-1" />
                  <span>Email: info@unistay.co.ke</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 