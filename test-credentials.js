#!/usr/bin/env node

require('dotenv').config();

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;

console.log('🔍 Testing M-Pesa Credentials...');
console.log('================================');

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.log('❌ Missing credentials in .env file');
  console.log('Consumer Key:', CONSUMER_KEY ? 'SET' : 'MISSING');
  console.log('Consumer Secret:', CONSUMER_SECRET ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('✅ Credentials found in .env file');
console.log('Consumer Key:', CONSUMER_KEY.substring(0, 10) + '...');
console.log('Consumer Secret:', CONSUMER_SECRET.substring(0, 10) + '...');

// Test access token request
async function testAccessToken() {
  try {
    console.log('\n🔄 Testing access token request...');
    
    const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const startTime = Date.now();
    
    // Use sandbox API for testing
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Request took ${duration}ms`);
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      if (response.status === 401) {
        console.log('\n🔑 Authentication failed. Possible issues:');
        console.log('1. Consumer Key is incorrect');
        console.log('2. Consumer Secret is incorrect');
        console.log('3. Credentials are for wrong environment (test vs production)');
      }
      
      return false;
    }
    
    const data = await response.json();
    
    if (data.access_token) {
      console.log('✅ Access token obtained successfully!');
      console.log('Token:', data.access_token.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ No access token in response:', data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('\n🌐 Possible network issues:');
    console.log('1. Check your internet connection');
    console.log('2. Try again in a few minutes');
    console.log('3. Safaricom API might be temporarily down');
    return false;
  }
}

// Run the test
testAccessToken().then(success => {
  if (success) {
    console.log('\n🎉 Credentials are working!');
    console.log('You can now run: npm run mpesa:register');
  } else {
    console.log('\n⚠️  Credentials test failed.');
    console.log('Please check your credentials and try again.');
  }
}); 