import { NextRequest, NextResponse } from 'next/server';
import { updateInquiryStatus } from '@/lib/firestore-helpers';

export async function POST(request: NextRequest) {
  try {
    const { inquiryId, newStatus, adminUserId } = await request.json();
    await updateInquiryStatus(inquiryId, newStatus, adminUserId);

    // TODO: Send email notification to user about status change
    // This would typically use a service like SendGrid, Mailgun, or Firebase Functions
    console.log('Inquiry status updated:', {
      inquiryId,
      newStatus,
      adminUserId,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Inquiry status updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating inquiry status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update inquiry status' 
      },
      { status: 500 }
    );
  }
} 