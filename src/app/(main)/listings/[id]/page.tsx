import { notFound } from 'next/navigation';
import type { House } from '@/lib/mock-data';
import PropertyDetailClient from '@/components/listings/property-detail-client';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, type Timestamp } from 'firebase/firestore';

type HouseDetailPageProps = {
  params: { id: string };
};


async function getHouseFromFirestore(id: string): Promise<House | null> {
  try {
    if (!db) {
      console.error("Firebase is not initialized");
      return null;
    }
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
        status: data.status || 'available',
        availableUnits: data.availableUnits || 0,
        images: data.images || [data.imageUrl], // Support multiple images
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
  const resolvedParams = await params;
  const house = await getHouseFromFirestore(resolvedParams.id);

  if (!house) {
    notFound();
  }

  return <PropertyDetailClient initialHouse={house} />;
}

export async function generateStaticParams() {
  try {
    if (!db) {
      console.error("Firebase is not initialized");
      return [];
    }
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

    