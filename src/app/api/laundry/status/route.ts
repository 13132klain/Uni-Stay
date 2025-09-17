import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, notes, assignedTo } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    // Add status-specific timestamps
    const now = new Date();
    switch (status) {
      case 'confirmed':
        updateData.pickupScheduledAt = now;
        break;
      case 'in_progress':
        updateData.pickupCompletedAt = now;
        updateData.processingStartedAt = now;
        break;
      case 'completed':
        updateData.processingCompletedAt = now;
        updateData.deliveryScheduledAt = now;
        break;
    }

    // Add optional fields
    if (notes) updateData.notes = notes;
    if (assignedTo) updateData.assignedTo = assignedTo;

    // Update the document
    await updateDoc(doc(db, 'laundryBookings', bookingId), updateData);

    return NextResponse.json({
      success: true,
      message: 'Laundry booking status updated successfully'
    });

  } catch (error) {
    console.error('Error updating laundry booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update laundry booking status' },
      { status: 500 }
    );
  }
}
