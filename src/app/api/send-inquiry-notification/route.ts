import { NextRequest, NextResponse } from 'next/server';
import { submitInquiry } from '@/lib/firestore-helpers';

export async function POST(request: NextRequest) {
  try {
    const { inquiryData } = await request.json();
    const inquiryRef = await submitInquiry(inquiryData);

    // TODO: Send email notification to UniStay admin
    // This would typically use a service like SendGrid, Mailgun, or Firebase Functions
    // For now, we'll just log the inquiry
    console.log('New inquiry received:', {
      id: inquiryRef.id,
      ...inquiryData,
    });

    return NextResponse.json({ 
      success: true, 
      inquiryId: inquiryRef.id,
      message: 'Inquiry submitted successfully' 
    });
  } catch (error: any) {
    console.error('Error submitting inquiry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit inquiry' 
      },
      { status: 500 }
    );
  }
} 