
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightIcon, SearchIcon, UserPlusIcon, UsersIcon, GraduationCapIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, type Timestamp } from 'firebase/firestore';
import type { House } from '@/lib/mock-data';

const features = [
  {
    icon: <SearchIcon className="h-8 w-8 text-primary mb-4" />,
    title: "Effortless Searching",
    description: "Quickly find your ideal room or apartment near campus with our easy-to-use filters and detailed listings.",
    link: "/listings",
    linkLabel: "Find a Home"
  },
  {
    icon: <UserPlusIcon className="h-8 w-8 text-primary mb-4" />,
    title: "Personalized Accounts",
    description: "Save your favorite places, track applications, and manage bookings all in one spot.",
    link: "/auth/signup",
    linkLabel: "Create Account"
  },
  {
    icon: <UsersIcon className="h-8 w-8 text-primary mb-4" />,
    title: "Roommate Finder (New!)",
    description: "Connect with fellow Meru University students to find compatible roommates for shared housing.",
    link: "/roommate-finder",
    linkLabel: "Find Roommates"
  }
];

// This interface will be used for the fetched properties
interface FeaturedHouse extends House {
  priceSuffix?: string; // Optional, as not all properties might have it
}

async function getFeaturedProperties(): Promise<FeaturedHouse[]> {
  try {
    const housesCollectionRef = collection(db, 'houses');
    const q = query(housesCollectionRef, orderBy('createdAt', 'desc'), limit(3));
    const querySnapshot = await getDocs(q);
    
    const fetchedHouses = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let createdAtDate: Date;
      if (data.createdAt && typeof (data.createdAt as Timestamp).toDate === 'function') {
        createdAtDate = (data.createdAt as Timestamp).toDate();
      } else if (data.createdAt instanceof Date) {
        createdAtDate = data.createdAt; 
      } else {
        // Fallback if createdAt is missing or not a recognizable timestamp/date
        // This helps avoid errors but means items without valid createdAt might not sort as expected
        createdAtDate = new Date(0); // Epoch time, will sort very old
        console.warn(`Document ${docSnap.id} has invalid or missing createdAt field. Using fallback date.`);
      }

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
        createdAt: createdAtDate,
      } as FeaturedHouse;
    });
    return fetchedHouses;
  } catch (error) {
    console.error("Error fetching featured properties from Firestore:", error);
    return []; // Return empty array on error
  }
}


export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedHouse[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      setLoadingFeatured(true);
      const properties = await getFeaturedProperties();
      setFeaturedProperties(properties);
      setLoadingFeatured(false);
    }
    loadFeatured();
  }, []);

  // Shorten description for display on card
  const getShortDescription = (description: string, maxLength: number = 70): string => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Gateway to <span className="text-primary">Ideal Student Living</span> at Meru University
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            UniStay connects Meru University students with safe, comfortable, and affordable housing. Focus on your studies, we'll help with the rest.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/listings">
                View Listings <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {authLoading ? (
              <Button size="lg" variant="outline" disabled>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </Button>
            ) : (
              !currentUser && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/signup">
                    Create Account
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose UniStay?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            We are dedicated to providing a seamless and trustworthy platform for your housing needs.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center text-center">
                  {feature.icon}
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4 min-h-[60px]">{feature.description}</CardDescription>
                  {(feature.linkLabel !== "Create Account" || (feature.linkLabel === "Create Account" && !currentUser && !authLoading)) && (
                    <Button variant="link" asChild className="text-primary">
                      <Link href={feature.link}>
                        {feature.linkLabel} <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Steps to Your New Home</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-md">1</div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-muted-foreground">Explore listings with powerful filters.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-md">2</div>
              <h3 className="text-xl font-semibold mb-2">Book</h3>
              <p className="text-muted-foreground">Securely book your chosen place online.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-md">3</div>
              <h3 className="text-xl font-semibold mb-2">Move In</h3>
              <p className="text-muted-foreground">Settle into your new student home.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tailored for Meru Students Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <GraduationCapIcon className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-3xl font-bold">Designed for Meru University Students</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              We understand your needs because we focus on the Meru University community.
            </p>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-foreground leading-relaxed mb-6">
              UniStay aims to simplify your housing search by curating listings that are ideal for student life at MUST. We prioritize proximity to campus, safety, affordability, and amenities that support your academic success and well-being.
            </p>
            <p className="text-lg text-foreground leading-relaxed">
              Let us help you find a comfortable and convenient place to call home, so you can make the most of your university experience.
            </p>
          </div>
        </div>
      </section>
      
      {/* Featured Properties Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Picks Near Campus</h2>
          {loadingFeatured ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Loading popular picks...</p>
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map(property => (
                <Card key={property.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                  <div className="aspect-[16/10] relative w-full">
                    <Image
                      src={property.imageUrl}
                      alt={property.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      data-ai-hint={property.imageAiHint || "house exterior"}
                    />
                  </div>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-1 truncate" title={property.name}>{property.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 min-h-[40px]">{getShortDescription(property.description)}</p>
                    <p className="text-primary font-bold text-lg mt-auto">
                      Ksh {property.price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">{property.priceSuffix || "/month"}</span>
                    </p>
                    <Button className="w-full mt-3" asChild>
                      <Link href={`/listings/${property.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No featured properties available at the moment. Check back soon!</p>
          )}
           <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-4">Ready to find your perfect student digs?</p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/listings">
                Explore All Listings <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
