import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, accountReference, transactionDesc } = await request.json();

    // Validate required fields
    if (!phone || !amount || !accountReference) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, amount, accountReference' },
        { status: 400 }
      );
    }

    // Format phone number (remove any non-digits and ensure it starts with 254)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
      // Already formatted correctly
    } else {
      formattedPhone = '254' + formattedPhone;
    }

    // M-Pesa API configuration
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      console.error('Missing M-Pesa environment variables');
      return NextResponse.json(
        { error: 'M-Pesa configuration not found' },
        { status: 500 }
      );
    }

    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    // STK Push request
    const stkPushData = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Ensure amount is an integer
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa-c2b-callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc || 'UniStay Marketplace Payment'
    };

    const stkPushResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    });

    const stkPushResult = await stkPushResponse.json();

    if (stkPushResult.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully',
        CheckoutRequestID: stkPushResult.CheckoutRequestID,
        MerchantRequestID: stkPushResult.MerchantRequestID
      });
    } else {
      console.error('STK Push failed:', stkPushResult);
      return NextResponse.json(
        { 
          error: 'STK Push failed', 
          details: stkPushResult.ErrorMessage || 'Unknown error' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

