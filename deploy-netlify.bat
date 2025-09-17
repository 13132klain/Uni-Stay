@echo off
echo Deploying Uni-Stay to Netlify...
echo.

echo Step 1: Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying to Netlify...
call netlify deploy --prod
if %errorlevel% neq 0 (
    echo Deployment failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Deployment completed successfully!
echo Your site should be available at the URL shown above.
pause
