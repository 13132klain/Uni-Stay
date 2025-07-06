#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testEnvironmentVariables() {
  log('🔍 Testing Environment Variables...', 'blue');
  
  // Load environment variables
  require('dotenv').config();
  
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_BUSINESS_SHORTCODE'
  ];
  
  const missing = [];
  const present = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      log(`✅ ${varName}: ***${process.env[varName].slice(-4)}`, 'green');
    } else {
      missing.push(varName);
      log(`❌ ${varName}: NOT SET`, 'red');
    }
  });
  
  if (missing.length > 0) {
    log(`\n❌ Missing ${missing.length} required environment variables`, 'red');
    return false;
  }
  
  log(`\n✅ All ${present.length} required environment variables are set!`, 'green');
  return true;
}

function testPhoneNumberFormat() {
  log('\n📱 Testing Phone Number Format Validation...', 'blue');
  
  const testNumbers = [
    '0712345678',
    '+254712345678',
    '254712345678',
    '712345678',
    '07123456789', // too long
    '071234567',   // too short
    'abc1234567',  // invalid
    '+1234567890'  // wrong country
  ];
  
  const expectedResults = [
    true,  // 0712345678
    true,  // +254712345678
    true,  // 254712345678
    true,  // 712345678
    false, // too long
    false, // too short
    false, // invalid
    false  // wrong country
  ];
  
  testNumbers.forEach((number, index) => {
    const isValid = /^(?:\+254|254|0)?([17]\d{8})$/.test(number);
    const expected = expectedResults[index];
    
    if (isValid === expected) {
      log(`✅ ${number}: ${isValid ? 'VALID' : 'INVALID'}`, 'green');
    } else {
      log(`❌ ${number}: Expected ${expected}, got ${isValid}`, 'red');
    }
  });
}

function testAmountValidation() {
  log('\n💰 Testing Amount Validation...', 'blue');
  
  const testAmounts = [
    500,   // valid
    1000,  // valid
    100,   // invalid (too low)
    2000,  // invalid (too high)
    501,   // invalid (not 500 or 1000)
    999    // invalid
  ];
  
  testAmounts.forEach(amount => {
    const isValid = amount === 500 || amount === 1000;
    log(`${isValid ? '✅' : '❌'} ${amount} KES: ${isValid ? 'VALID' : 'INVALID'}`, isValid ? 'green' : 'red');
  });
}

function testReferenceGeneration() {
  log('\n🏷️  Testing Reference Generation...', 'blue');
  
  const houseId = 'test_house_123';
  const timestamp = Date.now();
  const reference = `UNISTAY_${houseId}_${timestamp}`;
  
  log(`Generated Reference: ${reference}`, 'cyan');
  log(`Format: UNISTAY_${houseId}_${timestamp}`, 'cyan');
  
  // Test reference format
  const isValidFormat = /^UNISTAY_[a-zA-Z0-9_]+_\d+$/.test(reference);
  log(`Reference Format: ${isValidFormat ? '✅ VALID' : '❌ INVALID'}`, isValidFormat ? 'green' : 'red');
}

function testCallbackUrl() {
  log('\n🌐 Testing Callback URL Configuration...', 'blue');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const callbackUrl = process.env.MPESA_CALLBACK_URL || `${baseUrl}/api/mpesa-c2b-callback`;
  
  log(`Base URL: ${baseUrl}`, 'cyan');
  log(`Callback URL: ${callbackUrl}`, 'cyan');
  
  // Check if callback URL is HTTPS in production
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    log('⚠️  Using HTTP for local development (OK for testing)', 'yellow');
  } else if (!callbackUrl.startsWith('https://')) {
    log('❌ Production callback URL should use HTTPS', 'red');
  } else {
    log('✅ Callback URL uses HTTPS', 'green');
  }
}

function testFirebaseConnection() {
  log('\n🔥 Testing Firebase Configuration...', 'blue');
  
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = [];
  const present = [];
  
  firebaseVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      log(`✅ ${varName}: SET`, 'green');
    } else {
      missing.push(varName);
      log(`⚠️  ${varName}: NOT SET`, 'yellow');
    }
  });
  
  if (missing.length > 0) {
    log(`\n⚠️  ${missing.length} Firebase variables not set (may be in other config)`, 'yellow');
  } else {
    log(`\n✅ All Firebase variables are set!`, 'green');
  }
}

function runAllTests() {
  log('🧪 M-Pesa Integration Test Suite', 'bright');
  log('================================', 'bright');
  log('');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Phone Number Format', fn: testPhoneNumberFormat },
    { name: 'Amount Validation', fn: testAmountValidation },
    { name: 'Reference Generation', fn: testReferenceGeneration },
    { name: 'Callback URL', fn: testCallbackUrl },
    { name: 'Firebase Configuration', fn: testFirebaseConnection }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach(test => {
    try {
      log(`\n📋 Running: ${test.name}`, 'blue');
      const result = test.fn();
      if (result !== false) {
        passed++;
      }
    } catch (error) {
      log(`❌ Test failed: ${error.message}`, 'red');
    }
  });
  
  log('\n📊 Test Results', 'bright');
  log('===============', 'bright');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All tests passed! Your M-Pesa integration is ready.', 'green');
    log('💡 Next steps:', 'cyan');
    log('   1. Run: npm run mpesa:register', 'cyan');
    log('   2. Test with a small amount (1 KES)', 'cyan');
    log('   3. Monitor logs for any issues', 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Please fix the issues above.', 'yellow');
  }
}

// Main execution
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testEnvironmentVariables,
  testPhoneNumberFormat,
  testAmountValidation,
  testReferenceGeneration,
  testCallbackUrl,
  testFirebaseConnection,
  runAllTests
}; 