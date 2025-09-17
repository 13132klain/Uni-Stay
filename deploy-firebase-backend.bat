@echo off
echo Deploying Firebase Backend for UniStay...

echo.
echo 1. Deploying Firestore Rules...
firebase deploy --only firestore:rules

echo.
echo 2. Deploying Firestore Indexes...
firebase deploy --only firestore:indexes

echo.
echo 3. Deploying Firebase Functions...
firebase deploy --only functions

echo.
echo 4. Deploying Firebase Hosting...
firebase deploy --only hosting

echo.
echo Firebase Backend deployment completed!
echo.
echo Available Functions:
echo - createMarketplaceItem
echo - updateMarketplaceItem
echo - deleteMarketplaceItem
echo - createLaundryBooking
echo - updateLaundryBookingStatus
echo - addToCart
echo - addToWishlist
echo - onMarketplaceItemCreated
echo - onMarketplaceItemUpdated
echo - onLaundryBookingCreated
echo.
echo Collections created:
echo - marketplace
echo - laundryBookings
echo - cart
echo - wishlist
echo.
pause

