'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlertIcon, UserPlusIcon, LogInIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import AdminBookingsList from '@/components/admin/admin-bookings-list';
import { auth, functions as firebaseFunctions, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ManageBookingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminByClaim, setIsAdminByClaim] = useState(false);
  const [isAdminByFirestoreDoc, setIsAdminByFirestoreDoc] = useState<boolean | null>(null);
  const [isBootstrapAdminCandidate, setIsBootstrapAdminCandidate] = useState(false); // New state for bootstrap
  const [loading, setLoading] = useState(true);
  const [uidToMakeAdmin, setUidToMakeAdmin] = useState('');
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const bootstrapAdminUID = process.env.NEXT_PUBLIC_ALLOW_FIRST_ADMIN_SETUP_FOR_UID;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAdminByFirestoreDoc(null); 
        setIsBootstrapAdminCandidate(false); 

        if (bootstrapAdminUID && user.uid === bootstrapAdminUID) {
          console.log(`ManageBookingsPage: User ${user.uid} matches bootstrap UID. Enabling admin grant tool for first admin setup.`);
          setIsBootstrapAdminCandidate(true);
          // This user can use the grant tool, actual admin data fetching will still follow rules.
        }

        try {
          const idTokenResult = await user.getIdTokenResult(true); 
          const hasAdminClaim = idTokenResult.claims.admin === true;
          setIsAdminByClaim(hasAdminClaim);
          console.log(`ManageBookingsPage: User ${user.uid} hasAdminClaim:`, hasAdminClaim);

          if (hasAdminClaim) {
            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists() && userDocSnap.data().admin === true) {
                setIsAdminByFirestoreDoc(true);
                console.log(`ManageBookingsPage: User ${user.uid} Firestore document has admin:true.`);
              } else {
                setIsAdminByFirestoreDoc(false);
                console.warn(`ManageBookingsPage: User ${user.uid} Firestore document missing admin:true or document doesn't exist. Firestore Data:`, userDocSnap.exists() ? userDocSnap.data() : 'No document');
              }
            } catch (firestoreError) {
              console.error(`ManageBookingsPage: Error fetching user's Firestore document (${user.uid}):`, firestoreError);
              setIsAdminByFirestoreDoc(false); 
              toast({
                title: "Firestore Check Error",
                description: "Could not verify admin status from Firestore document.",
                variant: "destructive",
              });
            }
          } else {
            setIsAdminByFirestoreDoc(false); 
            if (!isBootstrapAdminCandidate) { // Only log warning if not a bootstrap candidate
                 console.warn("ManageBookingsPage: User is NOT an admin based on custom claims. Claims:", idTokenResult.claims);
            }
          }
        } catch (error) {
          console.error("ManageBookingsPage: Error fetching custom claims:", error);
          setIsAdminByClaim(false);
          setIsAdminByFirestoreDoc(false);
          toast({
            title: "Claim Check Error",
            description: "Could not verify admin status. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setCurrentUser(null);
        setIsAdminByClaim(false);
        setIsAdminByFirestoreDoc(false);
        setIsBootstrapAdminCandidate(false);
        // Only redirect if not a bootstrap scenario that might need login first
        if (!bootstrapAdminUID) {
            router.push('/auth/login?redirect=/portal/manage-bookings');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast, bootstrapAdminUID]);

  const handleGrantAdmin = async () => {
    if (!uidToMakeAdmin.trim()) {
      toast({ title: "UID Required", description: "Please enter a User ID.", variant: "destructive" });
      return;
    }
    if (!firebaseFunctions) {
        toast({ title: "Error", description: "Firebase Functions service not available.", variant: "destructive" });
        console.error("Firebase Functions service is not initialized in @/lib/firebase.ts");
        return;
    }

    // Ensure the current user is either a real admin or the bootstrap candidate
    if (!isAdminByClaim && !isBootstrapAdminCandidate) {
        toast({ title: "Permission Denied", description: "You do not have permission to grant admin rights.", variant: "destructive" });
        return;
    }


    setIsGrantingAdmin(true);
    try {
      const setUserAdminClaimFunction = httpsCallable(firebaseFunctions, 'setUserAdminClaim');
      const result = await setUserAdminClaimFunction({ uid: uidToMakeAdmin }) as HttpsCallableResult<any>;
      
      toast({
        title: "Admin Rights Processed",
        description: (result.data as any)?.message || `Successfully processed admin rights for user ${uidToMakeAdmin}. They may need to log out and log back in.`,
      });
      setUidToMakeAdmin('');
      if (isBootstrapAdminCandidate && bootstrapAdminUID === uidToMakeAdmin) {
        toast({
            title: "Bootstrap Complete?",
            description: "If you just made yourself admin, log out and log back in. Then REMOVE the bootstrap UID from .env.local for security.",
            duration: 10000,
        });
      }
    } catch (error: any) {
      console.error('Error calling setUserAdminClaim:', error);
      toast({
        title: "Grant Admin Failed",
        description: error.message || "Could not grant admin rights. Ensure the UID is correct and you have permission.",
        variant: "destructive",
      });
    } finally {
      setIsGrantingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!currentUser && !bootstrapAdminUID) { // If not a bootstrap scenario, redirect if not logged in
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
              <Link href="/auth/login?redirect=/portal/manage-bookings">Login to Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show access denied only if NOT an admin and NOT the bootstrap candidate (or if bootstrap UID is not set)
  if (!isAdminByClaim && !isBootstrapAdminCandidate) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader>
            <ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You do not have the necessary permissions to view this page. 
            </p>
             <p className="text-xs text-muted-foreground mb-6">
                To become an admin, an existing admin must grant you rights, or the system must be in bootstrap mode for your UID.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
        {/* Grant admin section might not be shown here if they truly have no access */}
      </div>
    );
  }
  
  // A user who is either a real admin OR the bootstrap candidate can see the page content.
  // Actual data fetching in AdminBookingsList is still subject to Firestore rules.
  // The bootstrap candidate might see an empty list until they make themselves admin and their rules pass.
  const canManageBookings = isAdminByClaim && isAdminByFirestoreDoc === true;
  const showGrantAdminTool = isAdminByClaim || isBootstrapAdminCandidate;


  return (
    <div className="container mx-auto py-8 px-4 space-y-12 admin-bookings-list-page">
      {isBootstrapAdminCandidate && !isAdminByClaim && (
         <Card className="border-blue-500 bg-blue-50 mb-6">
            <CardHeader>
                <CardTitle className="text-blue-700 flex items-center"><UserPlusIcon className="mr-2 h-5 w-5"/>First Admin Setup Mode</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-blue-600">
                    Your UID matches the bootstrap UID. You can use the "Grant Admin Privileges" tool below to set up the first admin (this can be yourself or another user).
                </p>
                <p className="text-sm text-blue-600 mt-2">
                    Once the first admin is set up and can log in successfully, **remove the `NEXT_PUBLIC_ALLOW_FIRST_ADMIN_SETUP_FOR_UID` variable from your `.env.local` file for security.**
                </p>
                {!canManageBookings && (
                    <p className="text-sm text-orange-600 mt-3 font-medium">
                        Note: You may not see booking data until you grant actual admin rights (to yourself or another) and that user logs in.
                    </p>
                )}
            </CardContent>
        </Card>
      )}

      {isAdminByClaim === true && isAdminByFirestoreDoc === false && isAdminByFirestoreDoc !== null && !isBootstrapAdminCandidate && (
        <Card className="border-orange-500 bg-orange-50 mb-6">
            <CardHeader>
                <CardTitle className="text-orange-700 flex items-center"><ShieldAlertIcon className="mr-2 h-5 w-5"/>Potential Permission Issue</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-orange-600">
                    Your account has an admin custom claim, but your Firestore user document (<code className="text-xs">/users/{currentUser?.uid}</code>) is missing <code className="text-xs">admin: true</code> or the document doesn't exist.
                    This means you can see this page, but you might still encounter errors when trying to load or manage bookings data from Firestore because the security rules require the Firestore document field.
                </p>
                <p className="text-sm text-orange-600 mt-2">
                    <strong>Action:</strong> An existing super-admin (who has both the claim and the Firestore field correctly set) should use the "Grant Admin Privileges" tool below on your User ID.
                </p>
            </CardContent>
        </Card>
      )}
      <div>
        <CardHeader className="px-0 pb-4">
          <CardTitle className="text-3xl">Manage Booking Requests</CardTitle>
          <CardDescription>Review and manage all student booking requests.</CardDescription>
        </CardHeader>
        {canManageBookings ? (
            <AdminBookingsList />
        ) : (
            <div className="py-10 text-center text-muted-foreground">
                <p>Admin booking data will appear here once your admin permissions are fully effective (claim and Firestore document).</p>
                {isBootstrapAdminCandidate && <p>Use the tool below to grant admin rights.</p>}
            </div>
        )}
      </div>

      {showGrantAdminTool && (
        <div className="no-print">
            <Card className="max-w-xl mx-auto shadow-md">
            <CardHeader>
                <UserPlusIcon className="text-primary h-8 w-8 mb-2" />
                <CardTitle>Grant Admin Privileges</CardTitle>
                <CardDescription>
                Enter the Firebase User ID (UID) of a user to grant them admin rights.
                This will set their custom claim and update their Firestore document.
                They will need to log out and log back in for the changes to take full effect.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <label htmlFor="uidInputMain" className="block text-sm font-medium text-muted-foreground mb-1">
                    User ID (UID)
                </label>
                <Input
                    id="uidInputMain"
                    type="text"
                    placeholder="Enter Firebase User ID"
                    value={uidToMakeAdmin}
                    onChange={(e) => setUidToMakeAdmin(e.target.value)}
                    className="bg-background"
                    disabled={isGrantingAdmin}
                />
                </div>
                <Button
                onClick={handleGrantAdmin}
                disabled={isGrantingAdmin || !uidToMakeAdmin.trim()}
                className="w-full"
                >
                {isGrantingAdmin ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ShieldAlertIcon className="mr-2 h-4 w-4" />
                )}
                Grant Admin Rights
                </Button>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                Ensure the UID is correct. This action is reversible by manually removing the custom claim and Firestore field.
                </p>
            </CardFooter>
            </Card>
        </div>
      )}
    </div>
  );
}