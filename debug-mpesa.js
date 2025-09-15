#!/usr/bin/env node

require('dotenv').config();

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE;

console.log('🔍 Debugging M-Pesa API Call...');
console.log('================================');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CONSUMER_KEY:', CONSUMER_KEY ? 'SET' : 'MISSING');
console.log('CONSUMER_SECRET:', CONSUMER_SECRET ? 'SET' : 'MISSING');
console.log('SHORTCODE:', SHORTCODE);
console.log('PASSKEY:', PASSKEY ? 'SET' : 'MISSING');
console.log('BUSINESS_SHORTCODE:', BUSINESS_SHORTCODE);
console.log('');

// Test access token
async function testAccessToken() {
  try {
    console.log('🔄 Testing access token...');
    
    const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    // Use sandbox API for testing
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('Access token obtained:', data.access_token ? 'YES' : 'NO');
    return data.access_token;
    
  } catch (error) {
    console.log('Access token error:', error.message);
    return null;
  }
}

// Test STK push
async function testSTKPush(accessToken) {
  try {
    console.log('\n🔄 Testing STK push...');
    
    const password = generatePassword();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const formattedPhone = formatPhoneNumber('254708374149');

    const payload = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 500,
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: 'https://8207-154-79-248-18.ngrok-free.app/api/mpesa-c2b-callback',
      AccountReference: 'UNISTAY_test_123',
      TransactionDesc: 'UniStay Booking Fee',
    };

    console.log('STK Push payload:', JSON.stringify(payload, null, 2));
    
    // Use sandbox API for testing
    const stkPushUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    console.log('STK Push URL:', stkPushUrl);

    const response = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('STK Push response status:', response.status);
    
    const responseText = await response.text();
    console.log('STK Push response:', responseText);
    
    if (!response.ok) {
      console.log('STK Push failed');
      return false;
    }

    const data = JSON.parse(responseText);
    console.log('STK Push success:', data.ResultCode === '0');
    return data.ResultCode === '0';
    
  } catch (error) {
    console.log('STK Push error:', error.message);
    return false;
  }
}

// Helper functions
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
  return password;
}

function formatPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  } else {
    throw new Error('Invalid phone number format');
  }
}

// Run the test
async function runTest() {
  const accessToken = await testAccessToken();
  
  if (accessToken) {
    await testSTKPush(accessToken);
  } else {
    console.log('❌ Cannot test STK push without access token');
  }
}

runTest(); 