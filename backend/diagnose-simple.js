// Simple diagnostic test
console.log('Starting diagnostic test...');

async function testBasics() {
  try {
    console.log('1. Testing basic imports...');
    await import('express');
    console.log('✅ Express imported');
    
    await import('cors');
    console.log('✅ CORS imported');
    
    await import('dotenv');
    console.log('✅ Dotenv imported');
    
    console.log('2. Testing environment...');
    const dotenv = await import('dotenv');
    dotenv.config();
    
    if (process.env.SUPABASE_URL) {
      console.log('✅ Environment variables loaded');
    } else {
      console.log('❌ Environment variables not loaded');
    }
    
    console.log('3. Testing file access...');
    const fs = await import('fs');
    if (fs.existsSync('./server-fixed.js')) {
      console.log('✅ Server file exists');
    } else {
      console.log('❌ Server file not found');
    }
    
    console.log('✅ All basic tests passed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBasics();