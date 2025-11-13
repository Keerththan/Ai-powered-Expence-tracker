// backend/test-real-image-ocr.js  
import { OCRService } from './services/OCRService.js';
import fs from 'fs';
import path from 'path';

async function testRealImageOCR() {
  console.log('🖼️ === TESTING OCR WITH REAL IMAGE ===\n');

  const testImagePath = './uploads/test-receipt.png';
  const testPdfPath = './uploads/test-receipt.pdf';

  try {
    // Check if test image exists
    if (!fs.existsSync(testImagePath) && !fs.existsSync(testPdfPath)) {
      console.log('📸 No test files found. Please add:');
      console.log('   - A receipt image at: ./uploads/test-receipt.png');
      console.log('   - OR a receipt PDF at: ./uploads/test-receipt.pdf');
      console.log('\n💡 Then run this test again to verify OCR works with real files');
      return;
    }

    // Test image OCR if image exists
    if (fs.existsSync(testImagePath)) {
      console.log('📸 Testing image OCR...');
      console.log('File:', testImagePath);
      console.log('Size:', fs.statSync(testImagePath).size, 'bytes');
      
      const startTime = Date.now();
      try {
        const extractedText = await OCRService.extractTextFromFile(testImagePath, 'image/png');
        const processingTime = Date.now() - startTime;
        
        console.log('✅ Image OCR completed in', processingTime, 'ms');
        console.log('Extracted text length:', extractedText.length);
        console.log('Text preview:', extractedText.substring(0, 200) + '...');
        
        const isValidReceipt = OCRService.validateReceiptText(extractedText);
        console.log('Receipt validation:', isValidReceipt ? '✅ Valid' : '⚠️ Invalid');
        
      } catch (imageOcrError) {
        console.log('❌ Image OCR failed:', imageOcrError.message);
      }
    }

    // Test PDF OCR if PDF exists  
    if (fs.existsSync(testPdfPath)) {
      console.log('\n📄 Testing PDF text extraction...');
      console.log('File:', testPdfPath);
      console.log('Size:', fs.statSync(testPdfPath).size, 'bytes');
      
      const startTime = Date.now();
      try {
        const extractedText = await OCRService.extractTextFromFile(testPdfPath, 'application/pdf');
        const processingTime = Date.now() - startTime;
        
        console.log('✅ PDF extraction completed in', processingTime, 'ms');
        console.log('Extracted text length:', extractedText.length);
        console.log('Text preview:', extractedText.substring(0, 200) + '...');
        
        const isValidReceipt = OCRService.validateReceiptText(extractedText);
        console.log('Receipt validation:', isValidReceipt ? '✅ Valid' : '⚠️ Invalid');
        
      } catch (pdfOcrError) {
        console.log('❌ PDF extraction failed:', pdfOcrError.message);
      }
    }

    console.log('\n🎉 REAL FILE OCR TEST COMPLETED!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testRealImageOCR();