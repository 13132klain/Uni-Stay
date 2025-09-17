// Script to add sample marketplace items to Firebase
// Run this with: node scripts/add-sample-marketplace-items.js

const functionsUrl = 'https://us-central1-unistay-e18e3.cloudfunctions.net';

async function addSampleItems() {
  try {
    console.log('Adding sample marketplace items...');
    
    const response = await fetch(`${functionsUrl}/addSampleMarketplaceItems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Sample items added successfully!');
      console.log(`📦 Added ${result.items.length} items:`);
      result.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - Ksh ${item.price.toLocaleString()}`);
      });
      console.log('\n🎉 You can now see these items in your marketplace!');
    } else {
      console.error('❌ Failed to add sample items:', result.error);
    }
  } catch (error) {
    console.error('❌ Error adding sample items:', error.message);
  }
}

addSampleItems();

