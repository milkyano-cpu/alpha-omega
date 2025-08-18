// Debug script to check Square SDK loading in production
// Add this to browser console in production to diagnose issues

console.log('🔍 Square SDK Debug Information');
console.log('================================');

// Check if Square SDK is loaded
console.log('1. Square SDK Status:', {
  'window.Square exists': typeof window !== 'undefined' && !!window.Square,
  'Square type': typeof window !== 'undefined' ? typeof window.Square : 'unknown'
});

// Check environment variables
console.log('2. Environment Variables:', {
  'NODE_ENV': 'production', // This will always be production in Vercel
  'NEXT_PUBLIC_SQUARE_ENVIRONMENT': process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'NOT_SET',
  'NEXT_PUBLIC_SQUARE_APP_ID': process.env.NEXT_PUBLIC_SQUARE_APP_ID ? 'SET' : 'NOT_SET',
  'NEXT_PUBLIC_SQUARE_LOCATION_ID': process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ? 'SET' : 'NOT_SET'
});

// Check script tags
console.log('3. Script Tags:');
const scripts = document.querySelectorAll('script[src*="square"]');
scripts.forEach((script, index) => {
  console.log(`   Script ${index + 1}:`, {
    src: script.src,
    loaded: script.readyState || 'unknown'
  });
});

// Check network errors
console.log('4. Network Check:');
if (scripts.length === 0) {
  console.error('   ❌ No Square script tags found!');
} else {
  console.log('   ✅ Square script tags found');
}

// Test Square SDK functionality
if (typeof window !== 'undefined' && window.Square) {
  console.log('5. Square SDK Test:');
  try {
    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    
    if (appId && locationId) {
      const payments = window.Square.payments(appId, locationId);
      console.log('   ✅ Square payments object created successfully');
    } else {
      console.error('   ❌ Missing Square credentials');
    }
  } catch (error) {
    console.error('   ❌ Square SDK test failed:', error);
  }
} else {
  console.error('5. ❌ Square SDK not available for testing');
}

// Browser compatibility check
console.log('6. Browser Info:', {
  userAgent: navigator.userAgent,
  isHttps: window.location.protocol === 'https:',
  domain: window.location.hostname
});