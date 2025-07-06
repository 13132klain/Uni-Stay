
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, ShieldAlertIcon, LogInIcon, ArrowLeftIcon, SaveIcon, Edit3Icon } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { House } from '@/lib/mock-data';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_AMENITIES = 20;
const MAX_AMENITY_LENGTH = 50;

const editListingSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters." }).max(100),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }).max(150),
  price: z.coerce.number().min(1, { message: "Price must be a positive number." }),
  bedrooms: z.coerce.number().min(0, { message: "Bedrooms cannot be negative." }).max(10),
  bathrooms: z.coerce.number().min(0, { message: "Bathrooms cannot be negative." }).max(10),
  availableUnits: z.coerce.number().min(0, { message: "Available units cannot be negative." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  imageAiHint: z.string().max(50, {message: "AI hint must be 50 characters or less."}).optional(),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }).max(1000),
  amenities: z.string()
    .refine(value => {
        const amenitiesArray = value.split(',').map(a => a.trim()).filter(a => a);
        return amenitiesArray.length <= MAX_AMENITIES;
    }, { message: `You can add a maximum of ${MAX_AMENITIES} amenities.`})
    .refine(value => {
        const amenitiesArray = value.split(',').map(a => a.trim()).filter(a => a);
        return amenitiesArray.every(a => a.length <= MAX_AMENITY_LENGTH);
    }, { message: `Each amenity must be ${MAX_AMENITY_LENGTH} characters or less.`})
    .optional(),
  agentName: z.string().min(2, { message: "Agent name is required." }).max(50),
  agentPhone: z.string().regex(/^0\d{9}$/, { message: "Enter a valid 10-digit Kenyan phone number starting with 0." }),
});

type EditListingFormValues = z.infer<typeof editListingSchema>;

export default function EditListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingListing, setIsFetchingListing] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { toast } = useToast();

  if (!auth || !db || !storage) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader><ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" /><CardTitle>Firebase Not Initialized</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-4">Firebase is not properly initialized. Please check your environment variables and configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<EditListingFormValues>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      // Default values will be populated by fetching the listing
    },
  });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
            // Fetch listing data only if admin
            if (listingId) {
              fetchListingData(listingId);
            } else {
              toast({ title: "Error", description: "Listing ID is missing.", variant: "destructive" });
              router.push('/portal/manage-listings');
            }
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
        router.push(`/auth/login?redirect=/portal/manage-listings/edit/${listingId}`);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast, listingId, auth]);

  const fetchListingData = async (id: string) => {
    if (!db) return;
    setIsFetchingListing(true);
    try {
      const listingDocRef = doc(db, 'houses', id);
      const docSnap = await getDoc(listingDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as House;
        form.reset({
          name: data.name,
          address: data.address,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          availableUnits: data.availableUnits || 0,
          imageUrl: data.imageUrl,
          imageAiHint: data.imageAiHint || '',
          description: data.description,
          amenities: (data.amenities || []).join(', '),
          agentName: data.agent.name,
          agentPhone: data.agent.phone,
        });
      } else {
        toast({ title: "Not Found", description: "Listing data not found.", variant: "destructive" });
        router.push('/portal/manage-listings');
      }
    } catch (error) {
      console.error("Error fetching listing for edit:", error);
      toast({ title: "Fetch Error", description: "Could not load listing data for editing.", variant: "destructive" });
      router.push('/portal/manage-listings');
    } finally {
      setIsFetchingListing(false);
    }
  };


  async function onSubmit(values: EditListingFormValues) {
    if (!listingId || !db) {
        toast({ title: "Error", description: "Listing ID or Firestore is missing for update.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const listingDocRef = doc(db, 'houses', listingId);
      const updatedHouseData = {
        name: values.name,
        address: values.address,
        price: values.price,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        availableUnits: values.availableUnits,
        imageUrl: values.imageUrl,
        imageAiHint: values.imageAiHint || "",
        description: values.description,
        amenities: values.amenities ? values.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
        agent: {
          name: values.agentName,
          phone: values.agentPhone,
        },
        updatedAt: serverTimestamp(),
      };

      await updateDoc(listingDocRef, updatedHouseData);

      toast({
        title: "Listing Updated!",
        description: `${values.name} has been successfully updated.`,
      });
      router.push('/portal/manage-listings'); 
    } catch (error: any) {
      console.error("Error updating listing:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const storageRef = ref(storage, `property-images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      form.setValue('imageUrl', downloadURL, { shouldValidate: true });
      toast({ title: "Image Uploaded", description: "Image uploaded successfully!" });
    } catch (err: any) {
      setImageUploadError("Failed to upload image. Please try again.");
      toast({ title: "Upload Failed", description: err.message || "Failed to upload image.", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  if (loadingAuth || (isAdmin && isFetchingListing)) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading listing editor...</p>
      </div>
    );
  }

  if (!currentUser) { 
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader><LogInIcon className="mx-auto h-12 w-12 text-primary mb-3" /><CardTitle>Authentication Required</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-6">You must be logged in.</p><Button asChild size="lg"><Link href={`/auth/login?redirect=/portal/manage-listings/edit/${listingId}`}>Login</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) { 
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader><ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" /><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-4">You do not have permissions.</p><Button asChild variant="outline"><Link href="/">Homepage</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl flex items-center">
              <Edit3Icon className="mr-3 h-6 w-6 text-primary" />
              Edit Property Listing
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/manage-listings">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Listings
              </Link>
            </Button>
          </div>
          <CardDescription>
            Modify the details below to update the property listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Modern 2-Bedroom Apartment" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="e.g., 123 Main St, Nchiru" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid md:grid-cols-4 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Ksh/month)</FormLabel>
                    <FormControl><Input type="number" placeholder="15000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bedrooms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl><Input type="number" placeholder="2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bathrooms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="availableUnits" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Units</FormLabel>
                    <FormControl><Input type="number" min={0} placeholder="1" {...field} /></FormControl>
                    <FormDescription>How many units are currently available?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Image</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                      {field.value && (
                        <img src={field.value} alt="Property Preview" className="h-32 w-auto rounded border mt-2" />
                      )}
                      <Input placeholder="Image URL will appear here after upload" {...field} readOnly />
                      {uploadingImage && <span className="text-xs text-muted-foreground">Uploading image...</span>}
                      {imageUploadError && <span className="text-xs text-red-500">{imageUploadError}</span>}
                    </div>
                  </FormControl>
                  <FormDescription>Upload a property image or paste a direct image URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="imageAiHint" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image AI Hint (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., modern interior, house exterior" {...field} /></FormControl>
                  <FormDescription>1-2 keywords for image search hint. Max 50 chars.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Detailed description of the property..." {...field} rows={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amenities" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <FormControl><Textarea placeholder="e.g., WiFi, Security, Parking, Furnished" {...field} rows={3} /></FormControl>
                  <FormDescription>Enter amenities separated by commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              <CardTitle className="text-lg pt-4 border-t">Agent Details</CardTitle>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="agentName" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="agentPhone" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Agent Phone</FormLabel>
                    <FormControl><Input type="tel" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isFetchingListing}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
