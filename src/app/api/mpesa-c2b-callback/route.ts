import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log('M-Pesa Callback received:', callbackData);

    // Extract callback data
    const {
      Body: {
        stkCallback: {
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata
        } = {}
      } = {}
    } = callbackData;

    if (!CheckoutRequestID) {
      console.error('No CheckoutRequestID in callback');
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    // Find the order by payment reference (CheckoutRequestID)
    // Note: In a real implementation, you'd store the CheckoutRequestID with the order
    // For now, we'll log the callback and return success
    
    if (ResultCode === 0) {
      // Payment successful
      console.log('Payment successful for CheckoutRequestID:', CheckoutRequestID);
      
      // Extract payment details
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;

      console.log('Payment details:', {
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        transactionDate
      });

      // TODO: Update order status in Firestore
      // You would need to find the order by CheckoutRequestID and update its status
      // For now, we'll just log the successful payment

    } else {
      // Payment failed
      console.log('Payment failed for CheckoutRequestID:', CheckoutRequestID);
      console.log('Error:', ResultDesc);
    }

    // Always return success to M-Pesa (they expect a 200 response)
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    
    // Still return success to M-Pesa to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  }
}

// Handle GET requests (M-Pesa sometimes sends GET requests for validation)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'M-Pesa callback endpoint is active'
  });
}

