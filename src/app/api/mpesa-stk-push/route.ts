import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// M-Pesa API credentials (should be in environment variables)
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE;

// Validate environment variables
function validateEnvironmentVariables() {
  const missingVars = [];
  if (!CONSUMER_KEY) missingVars.push('MPESA_CONSUMER_KEY');
  if (!CONSUMER_SECRET) missingVars.push('MPESA_CONSUMER_SECRET');
  if (!SHORTCODE) missingVars.push('MPESA_SHORTCODE');
  if (!PASSKEY) missingVars.push('MPESA_PASSKEY');
  if (!BUSINESS_SHORTCODE) missingVars.push('MPESA_BUSINESS_SHORTCODE');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Get M-Pesa access token
async function getAccessToken(): Promise<string> {
  try {
    validateEnvironmentVariables();
    
    const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    // Use sandbox API for testing
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Access token request failed:', response.status, errorText);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Access token not found in response');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Generate password for STK push
function generatePassword(): string {
  if (!PASSKEY) {
    throw new Error('M-Pesa passkey is required');
  }
  
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
  return password;
}

// Format phone number for M-Pesa
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  } else {
    throw new Error('Invalid phone number format. Please use format: 0712345678 or +254712345678');
  }
}

// Initiate STK push
async function initiateSTKPush(phoneNumber: string, amount: number, reference: string): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    const password = generatePassword();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Get callback URL from environment or use default
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mpesa-c2b-callback`;

    const payload = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: reference,
      TransactionDesc: 'UniStay Booking Fee',
    };

    console.log('STK Push payload:', { ...payload, Password: '[HIDDEN]' });

    // Use sandbox API for testing
    const stkPushUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    const response = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('STK Push response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`STK Push failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    
    // Check for M-Pesa specific errors
    if (data.ResultCode && data.ResultCode !== '0') {
      throw new Error(`M-Pesa error: ${data.ResultDesc || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('STK Push error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, amount, houseId, houseName, userId, userName, userEmail } = await request.json();

    // Validate required fields
    if (!phoneNumber || !amount || !houseId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, houseId, userId' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount !== 500 && amount !== 1000) {
      return NextResponse.json(
        { error: 'Invalid booking fee amount. Must be 500 or 1000 KES' },
        { status: 400 }
      );
    }

    // Validate phone number format
    try {
      formatPhoneNumber(phoneNumber);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `UNISTAY_${houseId}_${Date.now()}`;

    // Initiate STK push
    const stkResponse = await initiateSTKPush(phoneNumber, amount, reference);

    // Save payment record to Firestore
    const paymentData = {
      userId,
      userEmail,
      userName,
      houseId,
      houseName,
      phoneNumber,
      amount,
      reference,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      status: 'pending',
      type: 'booking_fee',
      createdAt: serverTimestamp(),
    };

    if (db) {
      await addDoc(collection(db, 'payments'), paymentData);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment initiated successfully',
      checkoutRequestId: stkResponse.CheckoutRequestID,
      reference,
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Failed to initiate payment';
    
    if (error.message.includes('Missing required environment variables')) {
      errorMessage = 'Payment service is not properly configured. Please contact support.';
    } else if (error.message.includes('Invalid phone number')) {
      errorMessage = error.message;
    } else if (error.message.includes('M-Pesa error')) {
      errorMessage = `Payment service error: ${error.message.split('M-Pesa error: ')[1]}`;
    } else if (error.message.includes('Access token')) {
      errorMessage = 'Payment service authentication failed. Please try again later.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 