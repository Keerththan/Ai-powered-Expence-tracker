import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { supabase } from "../services/supabaseService.js";
import { extractExpenseData } from "../services/openaiService.js";
import { OCRService } from "../services/OCRService.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed!'), false);
    }
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const file = req.file;
    const { user_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`📁 Processing upload: ${file.originalname} (${file.mimetype}) for user ${user_id}`);

    // Step 1: Upload original file to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage...');
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `${user_id}/${Date.now()}_${file.originalname}`;
    
    const { data: uploaded, error: storageError } = await supabase.storage
      .from("user_uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error("❌ Storage upload failed:", storageError);
      throw new Error("Failed to upload file to storage");
    }

    console.log('✅ File uploaded to storage');

    // Step 2: Extract text using OCR
    console.log('🔍 Starting OCR text extraction...');
    const extractedText = await OCRService.extractTextFromFile(file.path, file.mimetype);
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error("Could not extract readable text from the uploaded file. Please ensure the image is clear and contains text.");
    }

    // Step 3: Validate if it looks like a receipt
    if (!OCRService.validateReceiptText(extractedText)) {
      console.warn('⚠️ Extracted text may not be from a receipt');
    }

    console.log('✅ Text extracted:', extractedText.substring(0, 100) + '...');

    // Step 4: Analyze with Azure OpenAI
    console.log('🤖 Analyzing text with Azure OpenAI...');
    const aiResponse = await extractExpenseData(extractedText);
    
    let expenseData;
    try {
      // Clean the AI response - remove markdown code block markers if present
      let cleanedResponse = aiResponse.trim();
      
      // Remove ```json and ``` markers if they exist
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned AI response for parsing:', cleanedResponse.substring(0, 100) + '...');
      
      expenseData = JSON.parse(cleanedResponse);
      console.log('✅ AI response parsed successfully:', expenseData);
    } catch (parseError) {
      console.error('❌ AI response parsing failed:', parseError);
      console.error('Raw AI response:', aiResponse);
      throw new Error("AI failed to parse expense data properly");
    }

    // Step 5: Get file URL for database storage
    const { data: { publicUrl } } = supabase.storage
      .from("user_uploads")
      .getPublicUrl(fileName);

    // Step 6: Prepare data for database
    const expenseRecord = {
      user_id,
      amount: parseFloat(expenseData.amount) || 0,
      vendor: expenseData.vendor || expenseData.description || 'Unknown',
      category: expenseData.category || 'Other',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      payment_method: expenseData.payment_method || 'Unknown',
      file_url: publicUrl,
      extracted_text: extractedText.substring(0, 1000) // Store first 1000 chars
    };

    // Step 7: Save to database
    console.log('💾 Saving to database...');
    const { data: inserted, error: dbError } = await supabase
      .from("expenses")
      .insert([expenseRecord])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Database save failed:", dbError);
      throw new Error("Failed to save expense data to database");
    }

    // Step 8: Clean up temporary file
    try {
      if (fs.existsSync(file.path)) {
        // Add a small delay to ensure file handles are released
        setTimeout(() => {
          try {
            fs.unlinkSync(file.path);
            console.log('🧹 Temporary file cleaned up');
          } catch (cleanupError) {
            console.warn('⚠️ Could not clean up temporary file:', cleanupError.message);
          }
        }, 100);
      }
    } catch (cleanupError) {
      console.warn('⚠️ File cleanup warning:', cleanupError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Upload completed in ${processingTime}ms`);

    res.json({ 
      success: true, 
      data: inserted,
      extractedText: extractedText.substring(0, 500),
      processingTime: `${processingTime}ms`,
      message: "Receipt processed successfully with OCR!"
    });

  } catch (error) {
    console.error("❌ Upload processing error:", error);
    
    // Clean up file on error with better error handling
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        // Add delay to ensure file handles are released
        setTimeout(() => {
          try {
            fs.unlinkSync(req.file.path);
            console.log('🧹 Error cleanup: Temporary file removed');
          } catch (cleanupError) {
            console.warn('⚠️ Error cleanup: Could not remove temporary file:', cleanupError.message);
          }
        }, 100);
      } catch (cleanupError) {
        console.warn('⚠️ Error cleanup warning:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      error: error.message || "Processing failed",
      details: "Please ensure the uploaded file contains clear, readable text"
    });
  }
});

export default router;