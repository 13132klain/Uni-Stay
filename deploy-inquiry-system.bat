@echo off
echo 🚀 Deploying UniStay Inquiry System...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Login to Firebase
echo 🔐 Logging into Firebase...
firebase login

REM Deploy Firestore rules and indexes
echo 📋 Deploying Firestore rules and indexes...
firebase deploy --only firestore:rules,firestore:indexes

REM Deploy functions (if any)
echo ⚙️ Deploying Firebase functions...
firebase deploy --only functions

REM Deploy hosting
echo 🌐 Deploying web app...
firebase deploy --only hosting

echo ✅ Deployment complete!
echo.
echo 📝 Next steps:
echo 1. Set up email notifications (SendGrid, Mailgun, etc.)
echo 2. Configure admin user permissions
echo 3. Test the inquiry flow end-to-end
echo 4. Set up monitoring and alerts
echo.
echo 🔗 Admin portal: https://your-app.firebaseapp.com/portal/manage-bookings
pause
