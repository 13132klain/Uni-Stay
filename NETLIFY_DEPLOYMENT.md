# Netlify Deployment Guide for Uni-Stay

This guide will help you deploy your Uni-Stay Next.js application to Netlify.

## Prerequisites

1. A Netlify account (free tier is sufficient)
2. Your project repository on GitHub, GitLab, or Bitbucket
3. All environment variables configured

## Step 1: Prepare Your Repository

### 1.1 Commit All Changes
Make sure all your changes are committed and pushed to your repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 1.2 Verify Configuration Files
Ensure these files are in your repository root:
- `netlify.toml` ✅ (created)
- `package.json` ✅ (updated with Netlify scripts)
- `next.config.js` ✅ (configured for Netlify)

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to [Netlify](https://netlify.com)** and sign in
2. **Click "New site from Git"**
3. **Connect your Git provider** (GitHub, GitLab, or Bitbucket)
4. **Select your repository** (Uni-Stay)
5. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy
   ```

## Step 3: Configure Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables from your `env.example`:

### Required Environment Variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Functions URL
FIREBASE_FUNCTIONS_URL=https://us-central1-your-project-id.cloudfunctions.net

# M-Pesa Configuration (for production)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=https://your-netlify-domain.netlify.app/api/mpesa-c2b-callback

# Base URL for your application
NEXT_PUBLIC_BASE_URL=https://your-netlify-domain.netlify.app
```

## Step 4: Update M-Pesa Callback URL

After deployment, update your M-Pesa callback URL to point to your Netlify domain:

1. Get your Netlify domain (e.g., `https://your-app-name.netlify.app`)
2. Update the `MPESA_CALLBACK_URL` environment variable
3. Update your M-Pesa configuration with the new callback URL

## Step 5: Test Your Deployment

1. **Visit your Netlify URL** to test the frontend
2. **Test API endpoints:**
   - `/api/test-firebase`
   - `/api/test-env`
   - `/api/upload-image`

## Step 6: Custom Domain (Optional)

1. Go to **Domain settings** in Netlify
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Node.js version (should be 18)
   - Verify all dependencies are in `package.json`
   - Check build logs in Netlify dashboard

2. **API Routes Not Working:**
   - Ensure `@netlify/plugin-nextjs` is installed
   - Check that API routes are in `src/app/api/`

3. **Environment Variables Not Loading:**
   - Verify variables are set in Netlify dashboard
   - Check variable names match exactly
   - Redeploy after adding new variables

4. **Firebase Connection Issues:**
   - Verify Firebase configuration
   - Check Firebase project settings
   - Ensure Firebase project is active

### Build Logs:
Check build logs in Netlify dashboard under **Deploys** → **Deploy log**

## Performance Optimization

1. **Enable Netlify Analytics** (optional)
2. **Configure CDN** for static assets
3. **Set up form handling** if needed
4. **Configure redirects** for SEO

## Security Considerations

1. **Never commit sensitive data** to your repository
2. **Use environment variables** for all secrets
3. **Enable HTTPS** (automatic with Netlify)
4. **Review Firebase security rules**

## Support

If you encounter issues:
1. Check Netlify documentation
2. Review build logs
3. Test locally with `netlify dev`
4. Check Firebase console for backend issues

---

**Note:** This deployment uses Netlify's Next.js plugin which automatically handles API routes and server-side rendering. Your Firebase Functions will continue to work as backend services.
