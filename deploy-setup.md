# Deployment Setup Guide

## Prerequisites Installation

### 1. Install Git
- Download from: https://git-scm.com/download/win
- Install with default settings
- Restart your terminal

### 2. Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Deployment Commands

### 1. Git Setup and Push
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Add laundry services and marketplace features"

# Add your GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/YourUsername/YourRepositoryName.git

# Push to GitHub
git push -u origin main
```

### 2. Firebase Deployment
```bash
# Login to Firebase
firebase login

# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## New Features Added

### Laundry Services (`/laundry`)
- Professional laundry service booking
- Multiple service tiers with pricing
- Pickup and delivery scheduling
- Firebase integration for bookings

### Student Marketplace (`/market`)
- Buy and sell second-hand items
- Advanced search and filtering
- Item listing with categories
- Contact system for buyers/sellers

### Navigation Updates
- Added Laundry and Marketplace to main navigation
- Updated homepage with 4 feature cards
- Mobile-responsive design

## Files Modified/Created

### New Files:
- `src/app/(main)/laundry/page.tsx`
- `src/app/(main)/market/page.tsx`

### Modified Files:
- `src/components/layout/header.tsx`
- `src/app/(main)/page.tsx`

## Testing

1. Run development server: `npm run dev`
2. Visit: http://localhost:9002
3. Test new features:
   - Navigate to Laundry page
   - Navigate to Marketplace page
   - Try booking a laundry service
   - Try listing an item for sale
