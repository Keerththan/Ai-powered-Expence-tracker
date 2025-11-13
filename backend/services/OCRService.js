import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Fix for pdf-parse CommonJS import in ES module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export class OCRService {
  /**
   * Extract text from uploaded file (image or PDF)
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} - Extracted text
   */
  static async extractTextFromFile(filePath, mimeType) {
    try {
      console.log(`🔍 Starting OCR for file: ${filePath} (${mimeType})`);

      if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(filePath);
      } else if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('❌ OCR Error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from image using Tesseract.js
   * @param {string} imagePath - Path to image file
   * @returns {Promise<string>} - Extracted text
   */
  static async extractTextFromImage(imagePath) {
    console.log('📸 Processing image with Tesseract OCR...');
    
    try {
      // Step 1: Preprocess image for better OCR accuracy
      const processedImagePath = `${imagePath}_processed.jpg`;
      
      await sharp(imagePath)
        .resize(2000, null, { withoutEnlargement: true }) // Scale up if small
        .gamma(1.2)                                       // Adjust brightness (valid range: 1.0-3.0)
        .normalize()                                      // Auto-adjust contrast
        .sharpen()                                        // Sharpen text
        .jpeg({ quality: 95 })                           // High quality output
        .toFile(processedImagePath);

      console.log('✅ Image preprocessed for better OCR');

      // Step 2: Extract text using Tesseract
      const { data: { text, confidence } } = await Tesseract.recognize(
        processedImagePath,
        'eng', // Language
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          preserve_interword_spaces: '1',
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/:-$ ',
        }
      );

      // Clean up processed image
      if (fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }

      console.log(`✅ OCR completed with ${confidence}% confidence`);
      
      return this.cleanExtractedText(text);
      
    } catch (error) {
      console.error('❌ Image OCR failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from PDF
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<string>} - Extracted text
   */
  static async extractTextFromPDF(pdfPath) {
    console.log('📄 Extracting text from PDF...');
    
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      console.log('✅ PDF text extraction completed');
      
      return this.cleanExtractedText(pdfData.text);
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw error;
    }
  }

  /**
   * Clean and format extracted text
   * @param {string} rawText - Raw OCR output
   * @returns {string} - Cleaned text
   */
  static cleanExtractedText(rawText) {
    if (!rawText) return '';

    return rawText
      .replace(/\s+/g, ' ')                    // Multiple spaces to single
      .replace(/[^\w\s.,:/\-$]/g, '')          // Remove special characters
      .replace(/\n\s*\n/g, '\n')               // Remove empty lines
      .trim();
  }

  /**
   * Validate if extracted text contains receipt-like content
   * @param {string} text - Extracted text
   * @returns {boolean} - True if looks like a receipt
   */
  static validateReceiptText(text) {
    if (!text || text.length < 10) {
      return false;
    }

    // Look for receipt indicators
    const receiptKeywords = [
      'total', 'amount', 'receipt', 'invoice', 'bill', 'paid', 'cash', 'card',
      'subtotal', 'tax', 'date', 'time', '$', 'rs', 'rupees', 'price'
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = receiptKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;

    return foundKeywords >= 2; // At least 2 receipt-related keywords
  }
}
