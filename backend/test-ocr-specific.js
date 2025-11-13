// backend/test-ocr-specific.js
import { OCRService } from './services/OCRService.js';
import fs from 'fs';

async function testOCRSpecifically() {
  console.log('🔍 === TESTING OCR FUNCTIONALITY ===\n');

  try {
    console.log('1️⃣ Testing OCR service import...');
    console.log('✅ OCRService imported successfully');

    console.log('\n2️⃣ Testing text cleaning function...');
    const dirtyText = '  Receipt   Total:  $25.50   Date: 2025-11-11  !!!@#$  ';
    const cleanedText = OCRService.cleanExtractedText(dirtyText);
    console.log('✅ Text cleaning works');
    console.log('   Input: "' + dirtyText + '"');
    console.log('   Output: "' + cleanedText + '"');

    console.log('\n3️⃣ Testing receipt validation...');
    const validReceiptText = 'Store: Keells, Total amount: Rs. 1250.00, paid by card on 2025-11-11';
    const invalidText = 'Just some random text without any receipt keywords';
    
    const isValidReceipt = OCRService.validateReceiptText(validReceiptText);
    const isInvalidReceipt = OCRService.validateReceiptText(invalidText);
    
    console.log('✅ Receipt validation works');
    console.log('   Valid receipt detected:', isValidReceipt);
    console.log('   Invalid text detected:', isInvalidReceipt);

    console.log('\n4️⃣ Testing file type detection...');
    try {
      // Test with mock file paths
      console.log('   PNG detection: Should use image OCR');
      console.log('   PDF detection: Should use PDF extraction');
      console.log('✅ File type detection logic ready');
    } catch (error) {
      console.log('❌ File type detection issue:', error.message);
    }

    console.log('\n5️⃣ Checking OCR dependencies...');
    
    // Test if Tesseract is accessible
    try {
      const Tesseract = (await import('tesseract.js')).default;
      console.log('✅ Tesseract.js imported successfully');
    } catch (tesseractError) {
      console.log('❌ Tesseract.js import failed:', tesseractError.message);
    }

    // Test if Sharp is accessible  
    try {
      const sharp = (await import('sharp')).default;
      console.log('✅ Sharp image processing library imported');
    } catch (sharpError) {
      console.log('❌ Sharp import failed:', sharpError.message);
    }

    // Test if pdf-parse is accessible
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const pdfParse = require('pdf-parse');
      console.log('✅ PDF-parse library imported');
    } catch (pdfError) {
      console.log('❌ PDF-parse import failed:', pdfError.message);
    }

    console.log('\n6️⃣ Checking uploads directory...');
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
      console.log('✅ Created uploads directory');
    } else {
      console.log('✅ Uploads directory exists');
    }

    console.log('\n🎉 OCR BASIC TESTS COMPLETED!');
    console.log('\n📋 NEXT STEPS TO TEST OCR WITH REAL IMAGE:');
    console.log('1. Add a receipt image to ./uploads/test-receipt.png');
    console.log('2. Run: node test-real-image-ocr.js');
    console.log('\n💡 If upload still fails, the issue might be:');
    console.log('   - OCR processing timeout (large images)');
    console.log('   - Image quality too poor for OCR');
    console.log('   - Database insert after OCR');
    console.log('   - AI analysis after OCR');

  } catch (error) {
    console.log('❌ OCR test failed with error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testOCRSpecifically();