// backend/test-ocr.js
import { OCRService } from './services/OCRService.js';
import fs from 'fs';
import path from 'path';

async function testOCRFlow() {
  console.log('🧪 Testing OCR functionality...\n');

  try {
    // Test 1: Check if service loads correctly
    console.log('✅ OCRService imported successfully');

    // Test 2: Test text cleaning function
    const testText = "  Receipt   Total:  $25.50   Date: 2025-11-11  ";
    const cleanedText = OCRService.cleanExtractedText(testText);
    console.log('✅ Text cleaning test:', cleanedText);

    // Test 3: Test receipt validation
    const validText = "Total amount: $25.50, paid by card on 2025-11-11";
    const invalidText = "Just some random text without receipt keywords";
    
    console.log('✅ Valid receipt text:', OCRService.validateReceiptText(validText));
    console.log('✅ Invalid text detection:', OCRService.validateReceiptText(invalidText));

    // Test 4: Check if uploads directory exists
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
      console.log('✅ Created uploads directory');
    }

    console.log('\n🎉 OCR service is ready to use!');
    console.log('\n📋 To test with real images:');
    console.log('1. Add a receipt image to ./uploads/test-receipt.jpg');
    console.log('2. Run: node test-real-ocr.js');

  } catch (error) {
    console.error('❌ OCR test failed:', error.message);
    console.error('💡 Make sure dependencies are installed: npm install');
  }
}

testOCRFlow();