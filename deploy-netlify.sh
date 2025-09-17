#!/bin/bash

echo "Deploying Uni-Stay to Netlify..."
echo

echo "Step 1: Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed! Please check the errors above."
    exit 1
fi

echo
echo "Step 2: Deploying to Netlify..."
netlify deploy --prod
if [ $? -ne 0 ]; then
    echo "Deployment failed! Please check the errors above."
    exit 1
fi

echo
echo "Deployment completed successfully!"
echo "Your site should be available at the URL shown above."
