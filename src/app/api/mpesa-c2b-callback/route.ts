import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

// Validate callback request
function validateCallbackRequest(body: any): boolean {
  // Check if it's an STK push callback
  if (body.Body && body.Body.stkCallback) {
    const stkCallback = body.Body.stkCallback;
    return !!(stkCallback.ResultCode && stkCallback.CheckoutRequestID);
  }
  
  // Check if it's a C2B payment
  if (body.TransID) {
    return !!(body.TransAmount && body.MSISDN);
  }
  
  return false;
}

// Process STK push callback
async function processSTKPushCallback(stkCallback: any) {
  const resultCode = stkCallback.ResultCode;
  const checkoutRequestId = stkCallback.CheckoutRequestID;
  const merchantRequestId = stkCallback.MerchantRequestID;
  const resultDesc = stkCallback.ResultDesc;

  console.log(`Processing STK push callback: ${checkoutRequestId}, Result: ${resultCode}`);

  if (resultCode === '0') {
    // Payment successful
    const callbackMetadata = stkCallback.CallbackMetadata;
    
    if (!callbackMetadata || !callbackMetadata.Item) {
      console.error('Missing callback metadata for successful payment:', checkoutRequestId);
      throw new Error('Missing payment metadata');
    }

    const items = callbackMetadata.Item;
    let mpesaReceiptNumber = '';
    let amount = 0;
    let transactionDate = '';

    for (const item of items) {
      if (item.Name === 'MpesaReceiptNumber') {
        mpesaReceiptNumber = item.Value;
      } else if (item.Name === 'Amount') {
        amount = item.Value;
      } else if (item.Name === 'TransactionDate') {
        transactionDate = item.Value;
      }
    }

    if (!mpesaReceiptNumber) {
      console.error('Missing M-Pesa receipt number for payment:', checkoutRequestId);
      throw new Error('Missing receipt number');
    }

    // Update payment record in Firestore
    if (!db) {
      throw new Error('Database not available');
    }

    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('checkoutRequestId', '==', checkoutRequestId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('Payment record not found for checkout request:', checkoutRequestId);
      throw new Error('Payment record not found');
    }

    const paymentDoc = querySnapshot.docs[0];
    const paymentData = paymentDoc.data();

    // Check if payment is already processed
    if (paymentData.status === 'completed') {
      console.log('Payment already processed:', checkoutRequestId);
      return;
    }

    // Update payment status
    await updateDoc(doc(db, 'payments', paymentDoc.id), {
      status: 'completed',
      mpesaReceiptNumber,
      transactionDate,
      completedAt: serverTimestamp(),
      resultDesc,
    });

    // Create booking record
    const bookingData = {
      userId: paymentData.userId,
      userEmail: paymentData.userEmail,
      userName: paymentData.userName,
      houseId: paymentData.houseId,
      houseName: paymentData.houseName,
      phoneNumber: paymentData.phoneNumber,
      bookingFee: paymentData.amount,
      mpesaReceiptNumber,
      status: 'confirmed',
      paymentReference: paymentData.reference,
      merchantRequestId,
      checkoutRequestId,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'bookings'), bookingData);

    console.log(`Booking confirmed for ${paymentData.userName} - Property: ${paymentData.houseName}, Receipt: ${mpesaReceiptNumber}`);
    
    // TODO: Send notification to user (email/SMS)
    // TODO: Send notification to property owner
    
  } else {
    // Payment failed
    console.log(`Payment failed for checkout request ${checkoutRequestId}: ${resultDesc}`);

    if (!db) {
      throw new Error('Database not available');
    }

    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('checkoutRequestId', '==', checkoutRequestId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const paymentDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'payments', paymentDoc.id), {
        status: 'failed',
        failureReason: resultDesc,
        failedAt: serverTimestamp(),
      });
    }
  }
}

// Process C2B payment (if needed)
async function processC2BPayment(body: any) {
  const transId = body.TransID;
  const amount = body.TransAmount;
  const msisdn = body.MSISDN;
  const billReference = body.BillReferenceNumber;
  const businessShortCode = body.BusinessShortCode;

  console.log(`C2B payment received: ${transId} for ${amount} from ${msisdn}`);

  // TODO: Implement C2B payment processing if needed
  // This would be for direct payments to your paybill/till number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('M-Pesa callback received:', JSON.stringify(body, null, 2));

    // Validate callback request
    if (!validateCallbackRequest(body)) {
      console.error('Invalid callback request format');
      return NextResponse.json(
        { error: 'Invalid callback format' },
        { status: 400 }
      );
    }

    // Handle STK push result
    if (body.Body && body.Body.stkCallback) {
      await processSTKPushCallback(body.Body.stkCallback);
    }

    // Handle C2B payment (if any)
    if (body.TransID) {
      await processC2BPayment(body);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('M-Pesa callback error:', error);
    
    // Log detailed error for debugging
    console.error('Callback error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
} 