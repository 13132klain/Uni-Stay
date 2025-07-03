import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { House } from '@/lib/mock-data'; // Keep House type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingForm from '@/components/listings/booking-form';
import ListingFavoriteButton from '@/components/listings/listing-favorite-button';
import { 
  BedDoubleIcon, BathIcon, DollarSignIcon, WifiIcon, CarIcon, UtensilsIcon, ShieldCheckIcon, 
  MapPinIcon, UserCircleIcon, PhoneIcon, DropletsIcon, ZapIcon, SofaIcon, GalleryVerticalIcon,
  WashingMachineIcon, LandmarkIcon, UsersIcon as SharedUsersIcon, SparklesIcon, Flower2Icon,
  BatteryChargingIcon, NotebookTextIcon, ShirtIcon, ShoppingCartIcon, UtensilsCrossedIcon,
  TreesIcon, DogIcon, CheckCircleIcon, TvIcon, UsersIcon
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, type Timestamp } from 'firebase/firestore';

type HouseDetailPageProps = {
  params: { id: string };
};

const amenityIcons: { [key: string]: React.ElementType } = {
  'Water': DropletsIcon,
  'Electricity': ZapIcon,
  'WiFi': WifiIcon,
  'High-speed WiFi': WifiIcon,
  'Security': ShieldCheckIcon,
  '24/7 Security': ShieldCheckIcon,
  'Kitchenette': UtensilsIcon,
  'Full Kitchen': UtensilsIcon,
  'Modern Kitchen': UtensilsIcon,
  'Shared Kitchen': UtensilsIcon,
  'Furnished': SofaIcon,
  'Secure Parking': CarIcon,
  'Parking': CarIcon,
  'Parking for 2 Cars': CarIcon,
  'Balcony': GalleryVerticalIcon,
  'Laundry Facilities': WashingMachineIcon,
  'Laundry Area': WashingMachineIcon,
  'Gated Community': LandmarkIcon,
  'Shared Bathroom': SharedUsersIcon,
  'Common Room': UsersIcon,
  'Cleaning Services': SparklesIcon,
  'Private Garden': Flower2Icon,
  'Backup Generator': BatteryChargingIcon,
  'Study Desks': NotebookTextIcon,
  'Study Area': NotebookTextIcon,
  'Wardrobes': ShirtIcon,
  'Near Shops': ShoppingCartIcon,
  'Dining Area': UtensilsCrossedIcon,
  'Backyard': TreesIcon,
  'Pet-friendly (small pets)': DogIcon,
  'TV Included': TvIcon,
  'Ensuite Bathroom': BathIcon,
  'Modern Finishes': SparklesIcon,
  'Private Compound': LandmarkIcon,
  'Garden': Flower2Icon,
  'Private Yard': Flower2Icon,
  'Near Public Transport': CarIcon,
};

async function getHouseFromFirestore(id: string): Promise<House | null> {
  try {
    const houseDocRef = doc(db, 'houses', id);
    const docSnap = await getDoc(houseDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to Date if necessary for consistency
      const createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined;
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
        createdAt: createdAt,
        ownerId: data.ownerId,
      } as House;
    } else {
      console.log("No such document in Firestore for ID:", id);
      return null;
    }
  } catch (error) {
    console.error("Error fetching house from Firestore:", error);
    return null;
  }
}

export default async function HouseDetailPage({ params }: HouseDetailPageProps) {
  const house = await getHouseFromFirestore(params.id);

  if (!house) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden shadow-lg">
            <div className="aspect-[16/9] relative w-full">
              <Image
                src={house.imageUrl}
                alt={house.name}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
                priority
                data-ai-hint={house.imageAiHint || "house interior"}
              />
            </div>
             <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold tracking-tight flex-grow">{house.name}</h1>
                <ListingFavoriteButton houseId={house.id} className="ml-4 shrink-0" />
              </div>
              <p className="text-lg text-muted-foreground flex items-center mb-4">
                <MapPinIcon className="h-5 w-5 mr-2 shrink-0 text-primary" />
                {house.address}
              </p>
              <div className="flex flex-wrap gap-4 text-md text-foreground mb-4">
                <span className="flex items-center">
                  <BedDoubleIcon className="h-5 w-5 mr-2 text-primary" /> {house.bedrooms} Bedrooms
                </span>
                <span className="flex items-center">
                  <BathIcon className="h-5 w-5 mr-2 text-primary" /> {house.bathrooms} {house.bathrooms === 0 ? 'Shared Bath' : 'Bathrooms'}
                </span>
                <span className="flex items-center font-semibold text-xl">
                  <DollarSignIcon className="h-6 w-6 mr-1 text-primary" /> {house.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/month</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Property Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{house.description}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {house.amenities.map((amenity) => {
                  const IconComponent = amenityIcons[amenity] || CheckCircleIcon;
                  return (
                    <div key={amenity} className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

            <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Contact Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-2 text-primary" />
                    <p><strong>Name:</strong> {house.agent.name}</p>
                </div>
                <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2 text-primary" />
                    <p><strong>Phone:</strong> <a href={`tel:${house.agent.phone}`} className="text-primary hover:underline">{house.agent.phone}</a></p>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24">
            <BookingForm house={house} />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const housesCollectionRef = collection(db, 'houses');
    const querySnapshot = await getDocs(housesCollectionRef);
    const paths = querySnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    return paths;
  } catch (error) {
    console.error("Error fetching house IDs for generateStaticParams:", error);
    return []; // Return empty array on error to prevent build failure
  }
}

    