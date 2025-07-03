'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, ShieldAlertIcon, LogInIcon, ArrowLeftIcon, HomeIcon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MAX_AMENITIES = 20;
const MAX_AMENITY_LENGTH = 50;

const addListingSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters." }).max(100),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }).max(150),
  price: z.coerce.number().min(1, { message: "Price must be a positive number." }),
  bedrooms: z.coerce.number().min(0, { message: "Bedrooms cannot be negative." }).max(10),
  bathrooms: z.coerce.number().min(0, { message: "Bathrooms cannot be negative." }).max(10),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).startsWith("https://placehold.co/", {message: "For now, only placehold.co URLs are accepted."}),
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

type AddListingFormValues = z.infer<typeof addListingSchema>;

export default function AddListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AddListingFormValues>({
    resolver: zodResolver(addListingSchema),
    defaultValues: {
      name: '',
      address: '',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      imageUrl: 'https://placehold.co/600x400.png',
      imageAiHint: '',
      description: '',
      amenities: '',
      agentName: 'Kevin Klein Omondi', 
      agentPhone: '0799751598',   
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
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
        router.push('/auth/login?redirect=/portal/manage-listings/add');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  async function onSubmit(values: AddListingFormValues) {
    setIsSubmitting(true);
    try {
      const newHouseData = {
        name: values.name,
        address: values.address,
        price: values.price,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        imageUrl: values.imageUrl,
        imageAiHint: values.imageAiHint || "",
        description: values.description,
        amenities: values.amenities ? values.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
        agent: {
          name: values.agentName,
          phone: values.agentPhone,
        },
        createdAt: serverTimestamp(),
        ownerId: currentUser?.uid,
      };

      await addDoc(collection(db, 'houses'), newHouseData);

      toast({
        title: "Listing Added to Firestore!",
        description: `${values.name} has been successfully saved.`,
      });
      form.reset();
      router.push('/portal/manage-listings'); 
    } catch (error: any) {
      console.error("Error adding listing to Firestore:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Could not add the listing to Firestore. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingAuth) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!currentUser) { 
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader><LogInIcon className="mx-auto h-12 w-12 text-primary mb-3" /><CardTitle>Authentication Required</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground mb-6">You must be logged in.</p><Button asChild size="lg"><Link href="/auth/login?redirect=/portal/manage-listings/add">Login</Link></Button></CardContent>
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
              <HomeIcon className="mr-3 h-6 w-6 text-primary" />
              Add New Property Listing
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/manage-listings">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Listings
              </Link>
            </Button>
          </div>
          <CardDescription>
            Fill in the details below to add a new property. This will be saved to Firestore.
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
              <div className="grid md:grid-cols-3 gap-4">
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
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl>
                  <FormDescription>Use a placehold.co URL for now.</FormDescription>
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

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                Add Listing
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    