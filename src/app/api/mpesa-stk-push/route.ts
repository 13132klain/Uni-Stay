import { NextRequest, NextResponse } from 'next/server';

// Hardcoded M-Pesa credentials for local development. Replace with your real values.
const MPESA_CONSUMER_KEY = '8AsOL61VCu3ZApe8dPoaMCwx4ZAP9adDuLwulFu4glXPskE0';
const MPESA_CONSUMER_SECRET = 'apanqjbpGOgY6iniyv41wkqfhrUazcWRQfRedEscHlAEWA3n8EfvIZomMiMV3Ajw';
const MPESA_SHORTCODE = '174379';
const MPESA_PASSKEY = 'YOUR_MPESA_PASSKEY_HERE';
const MPESA_CALLBACK_URL = 'https://yourdomain.com/api/mpesa-callback';
const MPESA_ENV: string = 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  if (!res.ok) throw new Error('Failed to get M-Pesa access token');
  const data = await res.json();
  return data.access_token;
}

function getTimestamp() {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function getPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(shortcode + passkey + timestamp).toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, type = 'paybill', shortcode } = await req.json();
    if (!phone || !amount || !shortcode) {
      return NextResponse.json({ error: 'Phone, amount, and shortcode are required' }, { status: 400 });
    }

    const access_token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = getPassword(shortcode, MPESA_PASSKEY, timestamp);

    // Determine transaction type and PartyB based on 'type'
    let TransactionType = 'CustomerPayBillOnline';
    let PartyB = shortcode;
    if (type === 'till') {
      TransactionType = 'CustomerBuyGoodsOnline';
      // For BuyGoods, PartyB is the till number
      PartyB = shortcode;
    }

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType,
      Amount: amount,
      PartyA: phone,
      PartyB,
      PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: 'UniStay',
      TransactionDesc: 'Booking Payment',
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.errorMessage || 'M-Pesa STK Push failed', details: data }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 