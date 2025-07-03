
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Loader2, SaveIcon, UserCircleIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

const profileEditSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
});

type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

interface UserProfileData extends DocumentData {
  fullName?: string;
  email?: string;
  createdAt?: any;
  favoriteHouseIds?: string[]; // Added for type consistency
}

type UserProfileEditFormProps = {
  userId: string;
};

export default function UserProfileEditForm({ userId }: UserProfileEditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [initialProfileData, setInitialProfileData] = useState<UserProfileData | null>(null);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setIsFetchingProfile(false);
        toast({ title: "Error", description: "User ID not found.", variant: "destructive" });
        return;
      }
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserProfileData;
          setInitialProfileData(data);
          form.reset({
            fullName: data.fullName || '',
          });
        } else {
          const currentAuthUser = auth.currentUser;
          form.reset({
            fullName: currentAuthUser?.displayName || '',
          });
          toast({ title: "Info", description: "No profile data found. You can create it now.", variant: "default" });
        }
      } catch (error) {
        console.error("Error fetching profile for edit:", error);
        toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
      } finally {
        setIsFetchingProfile(false);
      }
    };
    fetchProfile();
  }, [userId, form, toast]);

  async function onSubmit(values: ProfileEditFormValues) {
    setIsLoading(true);
    if (!auth.currentUser) {
        toast({title: "Error", description: "You must be logged in to update your profile.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    try {
      const userDocRef = doc(db, 'users', userId);
      
      const dataToSet: Partial<UserProfileData> = {
        fullName: values.fullName,
      };

      if (!initialProfileData) {
        dataToSet.email = auth.currentUser.email;
        dataToSet.createdAt = serverTimestamp();
        dataToSet.favoriteHouseIds = []; // Initialize favorites if creating profile
      } else if (initialProfileData && !initialProfileData.email) {
        dataToSet.email = auth.currentUser.email;
      }
      
      // Ensure favoriteHouseIds exists if profile existed but didn't have it
      if (initialProfileData && !initialProfileData.favoriteHouseIds) {
        dataToSet.favoriteHouseIds = [];
      }


      await setDoc(userDocRef, dataToSet, { merge: true });
      
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved.",
      });
      router.push('/profile');
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetchingProfile) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading profile for editing...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Edit Your Profile</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
        </div>
        <CardDescription>Update your personal information below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg" disabled={isLoading || isFetchingProfile}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="text-sm text-muted-foreground">
        Your email address ({initialProfileData?.email || auth.currentUser?.email || 'N/A'}) cannot be changed here.
      </CardFooter>
    </Card>
  );
}
