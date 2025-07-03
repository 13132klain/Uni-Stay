import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// This endpoint receives C2B payment notifications from Safaricom
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received C2B payment notification:', body);

    // Extract relevant fields
    const transId = body.TransID;
    const amount = body.TransAmount;
    const phone = body.MSISDN;
    const billRef = body.BillRefNumber;
    const receivedAt = new Date();

    // Store payment in Firestore (in a 'payments' collection)
    if (db) {
      await addDoc(collection(db, 'payments'), {
        transId,
        amount,
        phone,
        billRef,
        receivedAt,
        raw: body,
      });
    } else {
      console.error('Firestore db instance is not initialized.');
    }

    // Respond with success as required by Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  } catch (error: any) {
    console.error('Error processing C2B payment:', error);
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
} 