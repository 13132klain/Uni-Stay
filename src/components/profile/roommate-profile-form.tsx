
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Loader2, SaveIcon, UsersIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

const roommateProfileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters for the profile card." }),
  course: z.string().min(2, { message: "Course name must be at least 2 characters." }).max(100),
  yearOfStudy: z.string().min(1, {message: "Please select your year of study."}),
  gender: z.string().min(1, {message: "Please select your gender."}),
  bio: z.string().max(500, { message: "Bio must be 500 characters or less." }).optional().default(""),
  interests: z.string().max(200, {message: "Interests must be 200 characters or less."}).optional().default(""), // Comma-separated
  lookingFor: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().default(""),
  preferredContact: z.string().max(100, { message: "Contact info must be 100 characters or less."}).optional().describe("Your preferred email, social media link, or handle for others to contact you."),
  contactInstructions: z.string().max(200, { message: "Instructions must be 200 characters or less."}).optional().describe("Optional: Any specific instructions, e.g., 'DM on Instagram', 'Email preferred'."),
});

type RoommateProfileFormValues = z.infer<typeof roommateProfileSchema>;

interface RoommateProfileData extends DocumentData {
  userId?: string;
  fullName?: string;
  avatarUrl?: string;
  course?: string;
  yearOfStudy?: string;
  gender?: string;
  bio?: string;
  interests?: string[];
  lookingFor?: string;
  preferredContact?: string;
  contactInstructions?: string;
  updatedAt?: any;
  createdAt?: any;
}

type RoommateProfileFormProps = {
  userId: string;
};

export default function RoommateProfileForm({ userId }: RoommateProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const form = useForm<RoommateProfileFormValues>({
    resolver: zodResolver(roommateProfileSchema),
    defaultValues: {
      fullName: '',
      course: '',
      yearOfStudy: '',
      gender: '',
      bio: '',
      interests: '',
      lookingFor: '',
      preferredContact: '',
      contactInstructions: '',
    },
  });

  useEffect(() => {
    const fetchProfileAndUserData = async () => {
      if (!userId) {
        setIsFetchingProfile(false);
        toast({ title: "Error", description: "User ID not found.", variant: "destructive" });
        return;
      }
      setIsFetchingProfile(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const roommateProfileDocRef = doc(db, 'roommateProfiles', userId);

        const [userDocSnap, roommateProfileDocSnap] = await Promise.all([
          getDoc(userDocRef),
          getDoc(roommateProfileDocRef),
        ]);

        let currentFullName = auth.currentUser?.displayName || '';
        if (userDocSnap.exists()) {
          currentFullName = userDocSnap.data()?.fullName || currentFullName;
        }
        
        if (!currentFullName && auth.currentUser?.email) {
            currentFullName = auth.currentUser.email.split('@')[0]; // Fallback to email prefix
        }
        if (!currentFullName) {
            currentFullName = "UniStay User"; // Absolute fallback
        }


        if (roommateProfileDocSnap.exists()) {
          const data = roommateProfileDocSnap.data() as RoommateProfileData;
          form.reset({
            fullName: data.fullName || currentFullName,
            course: data.course || '',
            yearOfStudy: data.yearOfStudy || '',
            gender: data.gender || '',
            bio: data.bio || '',
            interests: (data.interests || []).join(', '),
            lookingFor: data.lookingFor || '',
            preferredContact: data.preferredContact || '',
            contactInstructions: data.contactInstructions || '',
          });
        } else {
           form.reset({
            ...form.getValues(), 
            fullName: currentFullName, 
            preferredContact: auth.currentUser?.email || '', // Pre-fill contact with user's email
          });
          toast({ title: "Info", description: "Create your roommate profile. Your name & email are pre-filled.", variant: "default" });
        }
      } catch (error) {
        console.error("Error fetching roommate profile and user data:", error);
        toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
      } finally {
        setIsFetchingProfile(false);
      }
    };
    fetchProfileAndUserData();
  }, [userId, form, toast]);

  async function onSubmit(values: RoommateProfileFormValues) {
    setIsLoading(true);
    try {
      const profileDocRef = doc(db, 'roommateProfiles', userId);
      const interestsArray = values.interests ? values.interests.split(',').map(s => s.trim()).filter(s => s) : [];
      
      const initials = values.fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'UU';
      const currentProfileSnap = await getDoc(profileDocRef);
      const dataToSet: RoommateProfileData = {
        userId: userId,
        fullName: values.fullName,
        course: values.course,
        yearOfStudy: values.yearOfStudy,
        gender: values.gender,
        bio: values.bio,
        interests: interestsArray,
        lookingFor: values.lookingFor,
        preferredContact: values.preferredContact,
        contactInstructions: values.contactInstructions,
        avatarUrl: `https://placehold.co/100x100.png?text=${initials}`,
        updatedAt: serverTimestamp(),
      };

      if (!currentProfileSnap.exists()) {
        dataToSet.createdAt = serverTimestamp();
      }

      await setDoc(profileDocRef, dataToSet, { merge: true });

      toast({
        title: "Roommate Profile Saved!",
        description: "Your roommate profile information has been updated.",
      });
      router.push('/roommate-finder');
    } catch (error: any) {
      console.error("Roommate profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update roommate profile. Please try again.",
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
        <p className="ml-3 text-muted-foreground">Loading roommate profile editor...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
         <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center">
            <UsersIcon className="mr-3 h-6 w-6 text-primary" />
            Your Roommate Profile
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/roommate-finder">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Finder
            </Link>
          </Button>
        </div>
        <CardDescription>
          Fill out this information to help others find you in the roommate search.
          This is separate from your main account profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (for profile card)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>This name will be displayed on your roommate profile card.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course/Program</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BSc. Computer Science" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell potential roommates a bit about yourself (e.g., study habits, lifestyle, what makes you a great roommate)." {...field} rows={4} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Max 500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Reading, Gaming, Hiking, Cooking" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Enter a comma-separated list of your interests. Max 200 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lookingFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you looking for?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your ideal roommate(s) or housing situation (e.g., 'Looking for a quiet and tidy roommate for a 2-bedroom flat near campus.')." {...field} rows={3} disabled={isLoading} />
                  </FormControl>
                   <FormDescription>Max 500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preferredContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Method</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., your@email.com, @social_handle, or https://..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Optional: Share how you'd like to be contacted. Max 100 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 'DM on Instagram', 'Email preferred for initial contact', 'Available evenings'." {...field} rows={2} disabled={isLoading}/>
                  </FormControl>
                  <FormDescription>Optional: Any specific instructions for contacting you. Max 200 characters.</FormDescription>
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
              Save Roommate Profile
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="text-sm text-muted-foreground">
        This information will be visible to other students using the Roommate Finder. Share wisely.
      </CardFooter>
    </Card>
  );
}
