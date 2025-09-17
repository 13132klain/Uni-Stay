import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types for marketplace items
export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  sellerName: string;
  sellerPhone: string;
  imageUrl: string;
  images: string[];
  postedDate: string;
  isNegotiable: boolean;
  tags: string[];
  stock: number;
  inStock: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection references
export const marketplaceCollection = collection(db, 'marketplace');
export const laundryBookingsCollection = collection(db, 'laundryBookings');
export const cartCollection = collection(db, 'cart');
export const wishlistCollection = collection(db, 'wishlist');

// Marketplace item functions
export const addMarketplaceItem = async (item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(marketplaceCollection, {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding marketplace item:', error);
    throw error;
  }
};

export const getMarketplaceItems = async (limitCount?: number) => {
  try {
    const q = limitCount 
      ? query(marketplaceCollection, orderBy('createdAt', 'desc'), limit(limitCount))
      : query(marketplaceCollection, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceItem[];
  } catch (error) {
    console.error('Error getting marketplace items:', error);
    throw error;
  }
};

export const getMarketplaceItem = async (id: string) => {
  try {
    const docRef = doc(marketplaceCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as MarketplaceItem;
    } else {
      throw new Error('Item not found');
    }
  } catch (error) {
    console.error('Error getting marketplace item:', error);
    throw error;
  }
};

export const updateMarketplaceItem = async (id: string, updates: Partial<MarketplaceItem>) => {
  try {
    const docRef = doc(marketplaceCollection, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating marketplace item:', error);
    throw error;
  }
};

export const deleteMarketplaceItem = async (id: string) => {
  try {
    const docRef = doc(marketplaceCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    throw error;
  }
};

export const getMarketplaceItemsByCategory = async (category: string) => {
  try {
    const q = query(
      marketplaceCollection, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceItem[];
  } catch (error) {
    console.error('Error getting marketplace items by category:', error);
    throw error;
  }
};

export const searchMarketplaceItems = async (searchTerm: string) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - for production, consider using Algolia or similar
    const q = query(marketplaceCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceItem[];
    
    // Filter on client side (not ideal for large datasets)
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  } catch (error) {
    console.error('Error searching marketplace items:', error);
    throw error;
  }
};

// Laundry booking functions
export interface LaundryBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  laundryType: string;
  serviceType: string;
  pickupLocation: string;
  deliveryLocation: string;
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const addLaundryBooking = async (booking: Omit<LaundryBooking, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(laundryBookingsCollection, {
      ...booking,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding laundry booking:', error);
    throw error;
  }
};

export const getLaundryBookings = async () => {
  try {
    const q = query(laundryBookingsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LaundryBooking[];
  } catch (error) {
    console.error('Error getting laundry bookings:', error);
    throw error;
  }
};

export const updateLaundryBookingStatus = async (id: string, status: LaundryBooking['status']) => {
  try {
    const docRef = doc(laundryBookingsCollection, id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating laundry booking status:', error);
    throw error;
  }
};

// Cart and wishlist functions
export interface CartItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  addedAt: Timestamp;
}

export interface WishlistItem {
  id: string;
  userId: string;
  itemId: string;
  addedAt: Timestamp;
}

export const addToCart = async (userId: string, itemId: string, quantity: number = 1) => {
  try {
    // Check if item already exists in cart
    const q = query(
      cartCollection,
      where('userId', '==', userId),
      where('itemId', '==', itemId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing item quantity
      const existingItem = querySnapshot.docs[0];
      await updateDoc(doc(cartCollection, existingItem.id), {
        quantity: existingItem.data().quantity + quantity,
      });
    } else {
      // Add new item to cart
      await addDoc(cartCollection, {
        userId,
        itemId,
        quantity,
        addedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const getCartItems = async (userId: string) => {
  try {
    const q = query(
      cartCollection,
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CartItem[];
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

export const removeFromCart = async (cartItemId: string) => {
  try {
    const docRef = doc(cartCollection, cartItemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const addToWishlist = async (userId: string, itemId: string) => {
  try {
    
    // Check if item already exists in wishlist
    const q = query(
      wishlistCollection,
      where('userId', '==', userId),
      where('itemId', '==', itemId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      await addDoc(wishlistCollection, {
        userId,
        itemId,
        addedAt: new Date(),
      });
    } else {
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

export const removeFromWishlist = async (userId: string, itemId: string) => {
  try {
    const q = query(
      wishlistCollection,
      where('userId', '==', userId),
      where('itemId', '==', itemId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(wishlistCollection, querySnapshot.docs[0].id);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

export const getWishlistItems = async (userId: string) => {
  try {
    const q = query(
      wishlistCollection,
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WishlistItem[];
    return items;
  } catch (error) {
    console.error('Error getting wishlist items:', error);
    throw error;
  }
};