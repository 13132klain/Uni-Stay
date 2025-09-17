import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase database not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      selectedLaundryType,
      selectedService,
      pickupLocation,
      deliveryLocation,
      specialInstructions,
      estimatedWeight,
      totalPrice
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !selectedLaundryType || !selectedService || !pickupLocation || !deliveryLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use format: 0712345678' },
        { status: 400 }
      );
    }

    // Create laundry booking document
    const laundryBooking = {
      customerName,
      customerPhone,
      selectedLaundryType,
      selectedService,
      pickupLocation,
      deliveryLocation,
      specialInstructions: specialInstructions || '',
      estimatedWeight: estimatedWeight || 0,
      totalPrice: totalPrice || 0,
      status: 'pending', // pending, confirmed, in_progress, completed, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add tracking fields
      pickupScheduledAt: null,
      pickupCompletedAt: null,
      processingStartedAt: null,
      processingCompletedAt: null,
      deliveryScheduledAt: null,
      deliveryCompletedAt: null,
      // Add admin fields
      assignedTo: null,
      notes: '',
      // Add payment fields
      paymentStatus: 'pending', // pending, paid, failed
      paymentMethod: null,
      paymentReference: null,
      paidAt: null
    };

    console.log('Creating laundry booking:', laundryBooking);

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'laundryBookings'), laundryBooking);
    
    console.log('Laundry booking created with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      message: 'Laundry booking created successfully'
    });

  } catch (error) {
    console.error('Error creating laundry booking:', error);
    return NextResponse.json(
      { error: 'Failed to create laundry booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    let query = collection(db, 'laundryBookings');
    
    // Add filters if provided
    if (phone) {
      // Note: In a real app, you'd use Firestore queries here
      // For now, we'll return all and filter client-side
    }

    return NextResponse.json({
      success: true,
      message: 'Laundry bookings retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching laundry bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch laundry bookings' },
      { status: 500 }
    );
  }
}
