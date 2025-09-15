@echo off
echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Add laundry services and marketplace features"

echo.
echo Please provide your GitHub repository URL:
echo Example: https://github.com/YourUsername/YourRepositoryName.git
set /p REPO_URL="Enter your GitHub repository URL: "

echo Adding remote origin...
git remote add origin %REPO_URL%

echo Pushing to GitHub...
git push -u origin main

echo.
echo Done! Your changes have been pushed to GitHub.
pause
