# M-Pesa Integration Setup Guide

This guide will help you set up and configure M-Pesa payment integration for UniStay.

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
node setup-mpesa.js
```

This interactive script will:
- Guide you through entering your M-Pesa API credentials
- Create a `.env` file with the correct configuration
- Optionally run C2B registration

### 2. Manual Setup (Alternative)

If you prefer to set up manually:

1. Copy `env.example` to `.env`
2. Fill in your M-Pesa API credentials
3. Run C2B registration: `node register-c2b.js`

## 📋 Prerequisites

### M-Pesa API Credentials

You need to obtain the following from Safaricom Developer Portal:

1. **Consumer Key** - Your application's API key
2. **Consumer Secret** - Your application's secret key
3. **Shortcode** - Your M-Pesa Paybill or Till number
4. **Passkey** - Your M-Pesa API passkey

### Getting M-Pesa Credentials

1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and log in
3. Create a new app or use an existing one
4. Navigate to the app's credentials section
5. Copy the required credentials

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# M-Pesa API Credentials
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here

# M-Pesa Business Configuration
MPESA_SHORTCODE=3755770
MPESA_BUSINESS_SHORTCODE=3755770
MPESA_PASSKEY=your_passkey_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa-c2b-callback
```

### C2B Registration

After setting up your credentials, register your callback URLs:

```bash
node register-c2b.js
```

This registers your application to receive payment notifications from M-Pesa.

## 🧪 Testing

### Test Mode

For testing, you can use Safaricom's sandbox environment:

1. Use test credentials from the developer portal
2. Test with small amounts (1 KES)
3. Use test phone numbers provided by Safaricom

### Production Mode

For production:

1. Use live credentials from Safaricom
2. Ensure your callback URL is publicly accessible
3. Test with real phone numbers and amounts

## 📱 Payment Flow

### STK Push Flow

1. User clicks "Book Now" on a property
2. User enters their M-Pesa phone number
3. System initiates STK push via M-Pesa API
4. User receives M-Pesa prompt on their phone
5. User completes payment
6. M-Pesa sends callback to your server
7. System updates booking status and creates booking record

### Callback Processing

The system automatically processes M-Pesa callbacks:

- **Successful payments**: Creates booking record, updates payment status
- **Failed payments**: Updates payment status with failure reason
- **Duplicate callbacks**: Handled gracefully (no duplicate bookings)

## 🔍 Troubleshooting

### Common Issues

#### 1. "Missing required environment variables"

**Solution**: Run `node setup-mpesa.js` or check your `.env` file

#### 2. "STK Push failed"

**Possible causes**:
- Invalid phone number format
- Insufficient M-Pesa balance
- Invalid passkey
- Network issues

**Solutions**:
- Ensure phone number is in format: `0712345678` or `+254712345678`
- Check M-Pesa balance
- Verify passkey in Safaricom developer portal
- Check network connectivity

#### 3. "Callback not received"

**Possible causes**:
- Callback URL not registered
- URL not publicly accessible
- Firewall blocking requests

**Solutions**:
- Run `node register-c2b.js` to register callback URLs
- Ensure your domain is publicly accessible
- Check server logs for incoming requests

#### 4. "Payment not updating in database"

**Possible causes**:
- Firebase connection issues
- Database permissions
- Callback processing errors

**Solutions**:
- Check Firebase configuration
- Verify Firestore rules allow write operations
- Check server logs for errors

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will log all M-Pesa API requests and responses.

## 📊 Monitoring

### Payment Status Tracking

Payments are tracked in Firestore with the following statuses:

- `pending` - STK push initiated, waiting for user action
- `completed` - Payment successful, booking created
- `failed` - Payment failed, reason stored in `failureReason`

### Logs

Monitor these logs for payment activity:

- STK push requests and responses
- Callback processing
- Database operations
- Error messages

## 🔒 Security

### Best Practices

1. **Never commit credentials to version control**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Validate all inputs**
   - Phone number format validation
   - Amount validation
   - User authentication

3. **Handle callbacks securely**
   - Validate callback signatures (if available)
   - Implement idempotency
   - Log all callback activity

4. **Use HTTPS in production**
   - M-Pesa requires HTTPS for callbacks
   - Ensure SSL certificates are valid

## 🚀 Deployment

### Netlify Deployment

1. Set environment variables in Netlify dashboard
2. Deploy your application
3. Update callback URL to your production domain
4. Re-run C2B registration with production URL

### Other Platforms

For other deployment platforms:

1. Set environment variables in your platform's dashboard
2. Ensure your domain is publicly accessible
3. Update callback URLs accordingly
4. Test the integration

## 📞 Support

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test with small amounts first
4. Contact Safaricom support for API issues

### Useful Links

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

## 📝 API Reference

### STK Push Endpoint

**URL**: `/api/mpesa-stk-push`

**Method**: `POST`

**Body**:
```json
{
  "phoneNumber": "0712345678",
  "amount": 500,
  "houseId": "house_id",
  "houseName": "House Name",
  "userId": "user_id",
  "userName": "User Name",
  "userEmail": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "checkoutRequestId": "ws_CO_123456789",
  "reference": "UNISTAY_house_id_timestamp"
}
```

### Callback Endpoint

**URL**: `/api/mpesa-c2b-callback`

**Method**: `POST`

**Body**: M-Pesa callback payload (varies by payment type)

**Response**: `{ "success": true }`

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Monitor payment success rates**
2. **Review error logs**
3. **Update M-Pesa credentials if needed**
4. **Test integration periodically**

### Version Updates

When updating the integration:

1. Test in development environment
2. Update documentation
3. Deploy during low-traffic periods
4. Monitor for issues after deployment 