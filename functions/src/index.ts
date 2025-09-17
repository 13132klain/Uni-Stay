import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

// Marketplace Functions
export const createMarketplaceItem = onRequest(async (request, response) => {
  try {
    const { title, description, price, category, condition, stock, tags, images, inStock } = request.body;
    
    if (!title || !description || !price || !category || !condition) {
      response.status(400).json({ error: "Missing required fields" });
      return;
    }

    const itemData = {
      title,
      description,
      price: Number(price),
      category,
      condition,
      stock: Number(stock) || 0,
      tags: tags || [],
      images: images || [],
      inStock: inStock !== false,
      location: "UniStay Store",
      sellerName: "UniStay",
      sellerPhone: "0700 000 000",
      isNegotiable: false,
      postedDate: new Date().toLocaleDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('marketplace').add(itemData);
    
    response.status(201).json({ 
      success: true, 
      id: docRef.id,
      message: "Marketplace item created successfully" 
    });
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

export const updateMarketplaceItem = onRequest(async (request, response) => {
  try {
    const { id } = request.params;
    const updates = request.body;
    
    if (!id) {
      response.status(400).json({ error: "Item ID is required" });
      return;
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.createdAt;
    
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('marketplace').doc(id).update(updates);
    
    response.status(200).json({ 
      success: true, 
      message: "Marketplace item updated successfully" 
    });
  } catch (error) {
    console.error("Error updating marketplace item:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

export const deleteMarketplaceItem = onRequest(async (request, response) => {
  try {
    const { id } = request.params;
    
    if (!id) {
      response.status(400).json({ error: "Item ID is required" });
      return;
    }

    await db.collection('marketplace').doc(id).delete();
    
    response.status(200).json({ 
      success: true, 
      message: "Marketplace item deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting marketplace item:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

// Laundry Functions
export const createLaundryBooking = onRequest(async (request, response) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      laundryType, 
      serviceType, 
      pickupLocation, 
      deliveryLocation, 
      specialInstructions 
    } = request.body;
    
    if (!customerName || !customerPhone || !laundryType || !serviceType) {
      response.status(400).json({ error: "Missing required fields" });
      return;
    }

    const bookingData = {
      customerName,
      customerPhone,
      laundryType,
      serviceType,
      pickupLocation,
      deliveryLocation,
      specialInstructions: specialInstructions || "",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('laundryBookings').add(bookingData);
    
    response.status(201).json({ 
      success: true, 
      id: docRef.id,
      message: "Laundry booking created successfully" 
    });
  } catch (error) {
    console.error("Error creating laundry booking:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

export const updateLaundryBookingStatus = onRequest(async (request, response) => {
  try {
    const { id } = request.params;
    const { status } = request.body;
    
    if (!id || !status) {
      response.status(400).json({ error: "Booking ID and status are required" });
      return;
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      response.status(400).json({ error: "Invalid status" });
      return;
    }

    await db.collection('laundryBookings').doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    response.status(200).json({ 
      success: true, 
      message: "Laundry booking status updated successfully" 
    });
  } catch (error) {
    console.error("Error updating laundry booking status:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

// Cart and Wishlist Functions
export const addToCart = onRequest(async (request, response) => {
  try {
    const { userId, itemId, quantity = 1 } = request.body;
    
    if (!userId || !itemId) {
      response.status(400).json({ error: "User ID and Item ID are required" });
      return;
    }

    // Check if item already exists in cart
    const existingCartQuery = await db.collection('cart')
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .get();

    if (!existingCartQuery.empty) {
      // Update existing item quantity
      const existingItem = existingCartQuery.docs[0];
      await existingItem.ref.update({
        quantity: admin.firestore.FieldValue.increment(quantity),
      });
    } else {
      // Add new item to cart
      await db.collection('cart').add({
        userId,
        itemId,
        quantity,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    response.status(200).json({ 
      success: true, 
      message: "Item added to cart successfully" 
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

export const addToWishlist = onRequest(async (request, response) => {
  try {
    const { userId, itemId } = request.body;
    
    if (!userId || !itemId) {
      response.status(400).json({ error: "User ID and Item ID are required" });
      return;
    }

    // Check if item already exists in wishlist
    const existingWishlistQuery = await db.collection('wishlist')
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .get();

    if (existingWishlistQuery.empty) {
      await db.collection('wishlist').add({
        userId,
        itemId,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    response.status(200).json({ 
      success: true, 
      message: "Item added to wishlist successfully" 
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

// Firestore Triggers
export const onMarketplaceItemCreated = onDocumentCreated(
  "marketplace/{itemId}",
  async (event) => {
    const itemData = event.data?.data();
    console.log("New marketplace item created:", itemData?.title);
    
    // You can add additional logic here, such as:
    // - Send notifications
    // - Update analytics
    // - Generate thumbnails
  }
);

export const onMarketplaceItemUpdated = onDocumentUpdated(
  "marketplace/{itemId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    console.log("Marketplace item updated:", afterData?.title);
    
    // Check if stock changed
    if (beforeData?.stock !== afterData?.stock) {
      console.log(`Stock changed from ${beforeData?.stock} to ${afterData?.stock}`);
      
      // Update inStock status based on stock
      if (afterData?.stock === 0 && afterData?.inStock) {
        await event.data?.after.ref.update({
          inStock: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (afterData?.stock > 0 && !afterData?.inStock) {
        await event.data?.after.ref.update({
          inStock: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

export const onLaundryBookingCreated = onDocumentCreated(
  "laundryBookings/{bookingId}",
  async (event) => {
    const bookingData = event.data?.data();
    console.log("New laundry booking created:", bookingData?.customerName);
    
    // You can add additional logic here, such as:
    // - Send confirmation email
    // - Notify admin
    // - Update analytics
  }
);

// Utility function for testing
export const helloWorld = onRequest((request, response) => {
  response.send("Hello from Firebase Functions! UniStay backend is ready.");
});

// Function to add sample marketplace items
export const addSampleMarketplaceItems = onRequest(async (request, response) => {
  try {
    const sampleItems = [
      {
        title: 'Study Desk with Drawers',
        description: 'Perfect study desk with 3 drawers. Great condition, perfect for students. Solid wood construction.',
        price: 2500,
        category: 'furniture',
        condition: 'excellent',
        location: 'UniStay Store',
        sellerName: 'UniStay',
        sellerPhone: '0700 000 000',
        images: [
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png'
        ],
        postedDate: '2 days ago',
        isNegotiable: false,
        tags: ['study', 'desk', 'drawers', 'wood'],
        stock: 5,
        inStock: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Samsung Galaxy A32',
        description: 'Samsung Galaxy A32 in excellent condition. Comes with charger, case, and screen protector.',
        price: 15000,
        category: 'electronics',
        condition: 'excellent',
        location: 'UniStay Store',
        sellerName: 'UniStay',
        sellerPhone: '0700 000 000',
        images: [
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png'
        ],
        postedDate: '1 day ago',
        isNegotiable: false,
        tags: ['phone', 'samsung', 'android', 'smartphone'],
        stock: 3,
        inStock: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Complete Kitchen Utensil Set',
        description: 'Full set of kitchen utensils including pots, pans, plates, and cutlery. Everything you need to cook.',
        price: 3000,
        category: 'utensils',
        condition: 'good',
        location: 'UniStay Store',
        sellerName: 'UniStay',
        sellerPhone: '0700 000 000',
        images: [
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png'
        ],
        postedDate: '3 days ago',
        isNegotiable: false,
        tags: ['kitchen', 'cooking', 'complete set', 'utensils'],
        stock: 8,
        inStock: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'Engineering Textbooks Bundle',
        description: 'Collection of engineering textbooks for various courses. Great for students. Latest editions.',
        price: 2000,
        category: 'books',
        condition: 'good',
        location: 'UniStay Store',
        sellerName: 'UniStay',
        sellerPhone: '0700 000 000',
        images: [
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png'
        ],
        postedDate: '5 days ago',
        isNegotiable: false,
        tags: ['engineering', 'textbooks', 'academic', 'study'],
        stock: 12,
        inStock: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        title: 'LED Study Lamp',
        description: 'Bright LED study lamp with adjustable brightness. Perfect for late-night studying.',
        price: 1200,
        category: 'electronics',
        condition: 'excellent',
        location: 'UniStay Store',
        sellerName: 'UniStay',
        sellerPhone: '0700 000 000',
        images: [
          'https://placehold.co/600x400.png',
          'https://placehold.co/600x400.png'
        ],
        postedDate: '1 week ago',
        isNegotiable: false,
        tags: ['lamp', 'led', 'study', 'bright'],
        stock: 0,
        inStock: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const batch = db.batch();
    const addedItems = [];

    for (const item of sampleItems) {
      const docRef = db.collection('marketplace').doc();
      batch.set(docRef, item);
      addedItems.push({ id: docRef.id, ...item });
    }

    await batch.commit();

    response.status(200).json({
      success: true,
      message: "Sample marketplace items added successfully",
      items: addedItems
    });
  } catch (error) {
    console.error("Error adding sample marketplace items:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});
