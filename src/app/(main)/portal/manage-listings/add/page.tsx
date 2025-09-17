'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MultipleImageUpload from '@/components/ui/multiple-image-upload';
import { useToast } from '@/hooks/use-toast';
import { auth, db, storage } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, ShieldAlertIcon, LogInIcon, ArrowLeftIcon, HomeIcon, SaveIcon, InfoIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_AMENITIES = 20;
const MAX_AMENITY_LENGTH = 50;

const addListingSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters." }).max(100),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }).max(150),
  price: z.coerce.number().min(1, { message: "Price must be a positive number." }),
  bedrooms: z.coerce.number().min(0, { message: "Bedrooms cannot be negative." }).max(10),
  bathrooms: z.coerce.number().min(0, { message: "Bathrooms cannot be negative." }).max(10),
  availableUnits: z.coerce.number().min(1, { message: "Available units must be at least 1." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional(),
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string; url: string; file?: File; uploading?: boolean; error?: string}>>([]);

  const form = useForm<AddListingFormValues>({
    resolver: zodResolver(addListingSchema),
    defaultValues: {
      name: '',
      address: '',
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      availableUnits: 1,
      imageUrl: 'https://placehold.co/600x400.png',
      imageAiHint: '',
      description: '',
      amenities: '',
      agentName: 'Kevin Klein Omondi', 
      agentPhone: '0799751598',   
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
  }, [router, toast, auth]);

  async function onSubmit(values: AddListingFormValues) {
    if (!db || !storage) {
      toast({ title: "Firebase Not Initialized", description: "Database or storage is not available.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Collect uploaded image URLs (uploads are handled automatically by the component)
      const uploadedImageUrls: string[] = [];
      
      for (const image of uploadedImages) {
        if (image.uploaded && image.url && image.url.startsWith('http')) {
          // Use successfully uploaded images
          uploadedImageUrls.push(image.url);
        } else if (image.url && image.url.startsWith('http') && !image.file) {
          // Use direct URLs (not files)
          uploadedImageUrls.push(image.url);
        }
      }

      // Parse URLs from the text input field
      if (values.imageUrl) {
        // Support multiple separation methods: newlines, commas, semicolons, spaces
        const urlLines = values.imageUrl
          .split(/[\n,;]+/) // Split by newlines, commas, or semicolons
          .map(url => url.trim())
          .filter(url => url && url.startsWith('http'));
        uploadedImageUrls.push(...urlLines);
      }

      // Use the first uploaded image as the main imageUrl, or fallback to form value
      const mainImageUrl = uploadedImageUrls[0] || 'https://placehold.co/600x400.png';

      const newHouseData = {
        name: values.name,
        address: values.address,
        price: values.price,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        availableUnits: values.availableUnits,
        totalUnits: values.availableUnits,
        imageUrl: mainImageUrl,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [],
        imageAiHint: values.imageAiHint || "",
        description: values.description,
        amenities: values.amenities ? values.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
        agent: {
          name: values.agentName,
          phone: values.agentPhone,
        },
        createdAt: serverTimestamp(),
        ownerId: currentUser?.uid,
        status: 'available',
      };

      await addDoc(collection(db, 'houses'), newHouseData);

      toast({
        title: "Listing Added Successfully!",
        description: `${values.name} has been saved with ${uploadedImageUrls.length} images.`,
      });
      form.reset();
      setUploadedImages([]);
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
                    <FormControl><Input type="number" min={1} placeholder="1" {...field} /></FormControl>
                    <FormDescription>How many units are available for this property?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Images</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <MultipleImageUpload
                        images={uploadedImages}
                        onImagesChange={setUploadedImages}
                        maxImages={10}
                        disabled={isSubmitting}
                        autoUpload={true}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>Upload multiple images to showcase your property. The first image will be used as the main display image.</p>
                        <p className="mt-1">You can also paste image URLs in the field below as an alternative.</p>
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                          <div className="flex items-start gap-2">
                            <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Image URL Examples:</strong>
                              <br /><br />
                              <strong>✅ Working URLs:</strong>
                              <br />• Imgur: <code className="bg-blue-100 px-1 rounded">https://i.imgur.com/abc123.jpg</code>
                              <br />• Google Drive: <code className="bg-blue-100 px-1 rounded">https://drive.google.com/uc?export=view&id=FILE_ID</code>
                              <br />• Unsplash: <code className="bg-blue-100 px-1 rounded">https://images.unsplash.com/photo-1234567890</code>
                              <br />• Placeholder: <code className="bg-blue-100 px-1 rounded">https://picsum.photos/800/600</code>
                              <br /><br />
                              <strong>❌ Don't use:</strong>
                              <br />• Google Drive sharing links: <code className="bg-red-100 px-1 rounded">https://drive.google.com/file/d/.../view</code>
                              <br /><br />
                              <strong>URL Separation:</strong> Separate multiple URLs with:
                              <br />• New lines (press Enter) • Commas (,) • Semicolons (;)
                            </div>
                          </div>
                        </div>
                      </div>
                      <Input 
                        placeholder="Paste image URLs here (separate with newlines, commas, or semicolons)" 
                        {...field} 
                        className="min-h-[80px]"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Upload up to 10 images or paste image URLs. The first image will be the main display image.</FormDescription>
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

    