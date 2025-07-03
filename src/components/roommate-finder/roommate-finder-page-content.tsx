
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, SearchIcon, UserPlusIcon, UsersIcon, MailIcon, LinkIcon, InfoIcon, ShieldAlertIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, getDocs, type DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

interface FetchedRoommateProfile extends DocumentData {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  course: string;
  yearOfStudy: string | number;
  gender: string;
  bio: string;
  interests: string[];
  lookingFor?: string;
  preferredContact?: string;
  contactInstructions?: string;
}

const roommateSearchSchema = z.object({
  course: z.string().optional(),
  yearOfStudy: z.string().optional().default(undefined), // No 'any' here, handle in UI
  interests: z.string().optional().describe("Comma separated interests, e.g., music, sports, coding"),
  preferredGender: z.string().optional().default('any'), // 'any' is a valid value
});

type RoommateSearchFormValues = z.infer<typeof roommateSearchSchema>;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

const RoommateProfileCard = ({ profile }: { profile: FetchedRoommateProfile }) => {
  const renderContactInfo = () => {
    if (!profile.preferredContact) {
      return <p className="text-xs text-muted-foreground">Contact information not shared.</p>;
    }

    let contactElement;
    if (isValidEmail(profile.preferredContact)) {
      contactElement = (
        <a href={`mailto:${profile.preferredContact}`} className="text-primary hover:underline break-all flex items-center">
          <MailIcon className="h-4 w-4 mr-1 shrink-0" /> {profile.preferredContact}
        </a>
      );
    } else if (isValidUrl(profile.preferredContact)) {
      contactElement = (
        <a href={profile.preferredContact} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all flex items-center">
          <LinkIcon className="h-4 w-4 mr-1 shrink-0" /> {profile.preferredContact}
        </a>
      );
    } else {
      contactElement = <span className="break-all flex items-center"><InfoIcon className="h-4 w-4 mr-1 shrink-0 text-muted-foreground" /> {profile.preferredContact}</span>;
    }

    return (
      <div className="space-y-1">
        <div className="text-sm">{contactElement}</div>
        {profile.contactInstructions && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Instructions:</span> {profile.contactInstructions}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-lg w-full flex flex-col h-full">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Image
          src={profile.avatarUrl || `https://placehold.co/100x100.png?text=${profile.fullName.substring(0,2).toUpperCase()}`}
          alt={profile.fullName || 'User Avatar'}
          width={80}
          height={80}
          className="rounded-full border object-cover aspect-square"
          data-ai-hint="student avatar"
        />
        <div className="flex-1">
          <CardTitle className="text-xl">{profile.fullName}</CardTitle>
          <CardDescription>{profile.course} - Year {profile.yearOfStudy}</CardDescription>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 h-[40px]">{profile.bio}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Interests</h4>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {profile.interests.map(interest => (
                <span key={interest} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{interest}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No interests listed.</p>
          )}
        </div>
        {profile.lookingFor && (
           <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Looking for</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{profile.lookingFor}</p>
          </div>
        )}
      </CardContent>
      <Separator className="my-0" />
      <CardFooter className="p-4 flex flex-col items-start space-y-1">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Contact Information</h4>
          {renderContactInfo()}
      </CardFooter>
    </Card>
  );
};


export default function RoommateFinderPageContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FetchedRoommateProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<FetchedRoommateProfile[]>([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RoommateSearchFormValues>({
    resolver: zodResolver(roommateSearchSchema),
    defaultValues: {
      course: '',
      yearOfStudy: 'any', // Default to 'any'
      interests: '',
      preferredGender: 'any', // Default to 'any'
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchProfiles = async () => {
      setIsFetchingProfiles(true);
      setError(null);
      try {
        const profilesCollectionRef = collection(db, 'roommateProfiles');
        const q = query(profilesCollectionRef);
        const querySnapshot = await getDocs(q);
        let fetchedData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const initials = (data.fullName || "UU").trim().split(' ').map((n:string) => n[0]).join('').toUpperCase().slice(0,2);
          return {
            id: doc.id,
            userId: data.userId || doc.id,
            fullName: data.fullName || "Unnamed User",
            avatarUrl: data.avatarUrl || `https://placehold.co/100x100.png?text=${initials}`,
            course: data.course || "N/A",
            yearOfStudy: data.yearOfStudy || "N/A",
            gender: data.gender || "N/A",
            bio: data.bio || "",
            interests: Array.isArray(data.interests) ? data.interests : [],
            lookingFor: data.lookingFor || "",
            preferredContact: data.preferredContact || "",
            contactInstructions: data.contactInstructions || "",
          } as FetchedRoommateProfile;
        });

        if (currentUser) {
          fetchedData = fetchedData.filter(profile => profile.userId !== currentUser.uid);
        }
        
        setAllProfiles(fetchedData);
        setSearchResults(fetchedData);

        if (fetchedData.length === 0) {
          setError("No other roommate profiles found yet. Check back later or be the first to add yours!");
        }
      } catch (err) {
        console.error("Error fetching roommate profiles:", err);
        setError("Failed to load roommate profiles. Please try again later.");
        setAllProfiles([]);
        setSearchResults([]);
      } finally {
        setIsFetchingProfiles(false);
      }
    };
    fetchProfiles();
  }, [authLoading, currentUser]);

  async function onSubmit(values: RoommateSearchFormValues) {
    setSearchLoading(true);
    setError(null);
    
    let filteredResults = [...allProfiles];

    if (currentUser) {
        filteredResults = filteredResults.filter(profile => profile.userId !== currentUser.uid);
    }

    if (values.course) {
      const searchTerm = values.course.toLowerCase();
      filteredResults = filteredResults.filter(p => p.course.toLowerCase().includes(searchTerm));
    }

    if (values.yearOfStudy && values.yearOfStudy !== 'any') {
      filteredResults = filteredResults.filter(p => p.yearOfStudy.toString() === values.yearOfStudy);
    }
    
    if (values.interests) {
      const searchInterests = values.interests.split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i);
      
      if (searchInterests.length > 0) {
        filteredResults = filteredResults.filter(p => {
          const profileInterestsLower = (p.interests || []).map(pi => pi.toLowerCase());
          return searchInterests.every(si => profileInterestsLower.some(pi => pi.includes(si)));
        });
      }
    }

    if (values.preferredGender && values.preferredGender !== 'any') {
       filteredResults = filteredResults.filter(p => p.gender.toLowerCase() === values.preferredGender.toLowerCase());
    }

    setSearchResults(filteredResults);
    if (filteredResults.length === 0 && allProfiles.filter(p => p.userId !== currentUser?.uid).length > 0) { 
      setError("No profiles match your criteria. Try broadening your search.");
    } else if (allProfiles.filter(p => p.userId !== currentUser?.uid).length === 0 && !isFetchingProfiles && !authLoading) {
        setError("No other roommate profiles found yet. Check back later!");
    }
    setSearchLoading(false);
  }
  
  if (authLoading || (isFetchingProfiles && !currentUser) ) { 
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Roommate Finder...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center py-12 px-4 text-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <ShieldAlertIcon className="mx-auto h-12 w-12 text-destructive mb-3" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">You must be logged in to find roommates.</p>
            <Button asChild size="lg">
              <Link href="/auth/login?redirect=/roommate-finder">Login to Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFetchingProfiles) {
     return (
      <div className="flex flex-col items-center justify-center py-10 text-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading roommate profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl">Find Your Perfect Roommate</CardTitle>
          <CardDescription>
            Connect with fellow Meru University students. Use the filters below to find compatible roommates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-6 border rounded-lg bg-card mb-8">
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course/Program</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'any'} defaultValue={field.value || 'any'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any Year</SelectItem>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                         <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Music, Hiking" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="preferredGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'any'} defaultValue={field.value || 'any'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full lg:col-span-4 mt-4" disabled={searchLoading || isFetchingProfiles} size="lg">
                {searchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Find Roommates
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && !isFetchingProfiles && searchResults.length === 0 && ( // Only show error if not fetching and no results due to error
         <Card className="shadow-md">
            <CardContent className="p-6 text-center text-destructive">
                <p>{error}</p>
            </CardContent>
         </Card>
      )}

      {!error && searchResults.length === 0 && !isFetchingProfiles && allProfiles.filter(p => p.userId !== currentUser?.uid).length > 0 && (
        <Card className="shadow-md">
            <CardContent className="p-10 text-center">
                <UsersIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Matching Profiles</h3>
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
            </CardContent>
         </Card>
      )}
       {!error && searchResults.length === 0 && !isFetchingProfiles && allProfiles.filter(p => p.userId !== currentUser?.uid).length === 0 && (
        <Card className="shadow-md">
            <CardContent className="p-10 text-center">
                <UsersIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Other Profiles Yet</h3>
                <p className="text-muted-foreground">Tell your friends to join or check back soon!</p>
                 <Button className="mt-6" asChild>
                    <Link href="/profile/roommate">Create Your Roommate Profile</Link>
                </Button>
            </CardContent>
         </Card>
      )}


      {searchResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center md:text-left">Matching Profiles ({searchResults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((profile) => (
              <RoommateProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>
      )}

      <Card className="mt-12 shadow-sm border-dashed">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><UserPlusIcon className="mr-2 h-5 w-5 text-primary"/>Your Roommate Profile</CardTitle>
            <CardDescription>Want to be discovered by others? Make sure your roommate profile is complete and up to date!</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">Having a complete and engaging roommate profile increases your chances of finding the perfect match.</p>
            <Button asChild>
                <Link href="/profile/roommate">Create or Edit Your Roommate Profile</Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
