
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ShieldAlertIcon, LogInIcon, HomeIcon, Edit3Icon, Trash2Icon, PlusCircleIcon, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import type { House } from '@/lib/mock-data'; 
import { collection, getDocs, query, orderBy, type Timestamp, deleteDoc, doc } from 'firebase/firestore';
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

export default function ManageListingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [listings, setListings] = useState<House[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingToDelete, setListingToDelete] = useState<House | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const housesCollectionRef = collection(db, 'houses');
      const q = query(housesCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedHouses = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          address: data.address,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          imageUrl: data.imageUrl,
          imageAiHint: data.imageAiHint,
          description: data.description,
          amenities: data.amenities || [],
          agent: data.agent || { name: 'N/A', phone: 'N/A' },
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        } as House;
      });
      setListings(fetchedHouses);
    } catch (error: any) {
      console.error("Error fetching listings for admin:", error);
      toast({ 
        title: "Error Fetching Listings", 
        description: "Could not fetch listings. Please check the browser console for more details, especially for Firestore index errors.", 
        variant: "destructive",
        duration: 7000,
      });
      setListings([]);
    } finally {
      setIsLoadingListings(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
            fetchAdminListings(); 
          } else {
            setIsAdmin(false);
            toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
            router.push('/');
          }
        } catch (error) {
          console.error("Error fetching custom claims:", error);
          setIsAdmin(false);
          toast({ title: "Access Error", description: "Could not verify admin status.", variant: "destructive" });
          router.push('/');
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        router.push('/auth/login?redirect=/portal/manage-listings');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast, fetchAdminListings]);

  const handleEditListing = (houseId: string) => {
    router.push(`/portal/manage-listings/edit/${houseId}`);
  };

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'houses', listingToDelete.id));
      setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
      toast({
        title: "Listing Deleted",
        description: `Listing "${listingToDelete.name}" has been successfully deleted.`,
      });
      setListingToDelete(null); // Close dialog
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete the listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (isAdmin && isLoadingListings)) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Verifying access and loading listings...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <LogInIcon className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">You must be logged in to access this page.</p>
            <Button asChild size="lg">
              <Link href="/auth/login?redirect=/portal/manage-listings">Login to Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader>
            <ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You do not have permissions to view this page.</p>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-3xl flex items-center">
              <HomeIcon className="mr-3 h-8 w-8 text-primary" /> Manage Property Listings
            </CardTitle>
            <CardDescription>View, add, edit, or delete property listings from Firestore.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/portal/manage-listings/add">
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Add New Listing
            </Link>
          </Button>
        </div>

        {listings.length === 0 && !isLoadingListings ? (
          <Card>
            <CardContent className="py-10 text-center">
              <InfoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Listings Found in Firestore</h3>
              <p className="text-muted-foreground">There are no property listings to display. Click "Add New Listing" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>A list of all property listings from Firestore.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Price (Ksh)</TableHead>
                      <TableHead className="text-center">Beds</TableHead>
                      <TableHead className="text-center">Baths</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="relative h-12 w-16 rounded-md overflow-hidden border">
                            <Image
                              src={listing.imageUrl}
                              alt={listing.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                              data-ai-hint={listing.imageAiHint || "house exterior"}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{listing.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-xs truncate">{listing.address}</TableCell>
                        <TableCell className="text-right font-semibold">{listing.price.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{listing.bedrooms}</TableCell>
                        <TableCell className="text-center">{listing.bathrooms === 0 ? "Shared" : listing.bathrooms}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditListing(listing.id)} title="Edit Listing">
                              <Edit3Icon className="h-4 w-4" />
                            </Button>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setListingToDelete(listing)} title="Delete Listing">
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the listing 
            <strong> "{listingToDelete?.name}"</strong> from Firestore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setListingToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDeleteListing} 
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Listing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
