import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }

    // Validate price is a number
    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json({ 
        error: 'Price must be a positive number' 
      }, { status: 400 });
    }

    // Get Firebase Functions URL
    const functionsUrl = process.env.FIREBASE_FUNCTIONS_URL || 'https://us-central1-unistay-e18e3.cloudfunctions.net';
    
    // Prepare the marketplace item data
    const marketplaceItem = {
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      condition: body.condition || 'good',
      location: body.location || '',
      sellerName: body.sellerName || '',
      sellerPhone: body.sellerPhone || '',
      stock: body.stock || 1,
      inStock: body.inStock !== undefined ? body.inStock : true,
      tags: body.tags || [],
      images: body.images || [],
      postedDate: body.postedDate || new Date().toISOString(),
      sellerId: body.sellerId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating marketplace item via Firebase Function:', marketplaceItem);

    // Call Firebase Function to create the item
    const response = await fetch(`${functionsUrl}/createMarketplaceItem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(marketplaceItem),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase Function error:', errorText);
      throw new Error(`Firebase Function failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Marketplace item created successfully:', result);

    return NextResponse.json({ 
      success: true, 
      item: result
    });

  } catch (error) {
    console.error('Error creating marketplace item:', error);
    return NextResponse.json({ 
      error: 'Failed to create marketplace item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}