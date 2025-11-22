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

    // Process the uploaded file

    // Step 1: Upload original file to Supabase Storage
    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `${user_id}/${Date.now()}_${file.originalname}`;
    
    const { data: uploaded, error: storageError } = await supabase.storage
      .from("user_uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error("Storage upload failed:", storageError);
      throw new Error("Failed to upload file to storage");
    }

    // File uploaded successfully, proceed with OCR

    // Step 2: Extract text using OCR
    // Extract text from the uploaded file
    const extractedText = await OCRService.extractTextFromFile(file.path, file.mimetype);
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error("Could not extract readable text from the uploaded file. Please ensure the image is clear and contains text.");
    }

    // Step 3: Validate if it looks like a receipt
    if (!OCRService.validateReceiptText(extractedText)) {
      console.warn('Warning: Extracted text may not be from a receipt');
    }

    // Text extraction completed successfully

    // Step 4: Analyze with Azure OpenAI
    // Analyze extracted text with AI
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
      
      // Parse the cleaned response
      expenseData = JSON.parse(cleanedResponse);
    } catch (parseError) {
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
    // Save expense to database
    const { data: inserted, error: dbError } = await supabase
      .from("expenses")
      .insert([expenseRecord])
      .select()
      .single();

    if (dbError) {
      console.error("Database save failed:", dbError);
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
            console.warn('Warning: Could not clean up temporary file:', cleanupError.message);
          }
        }, 100);
      }
    } catch (cleanupError) {
      // File cleanup warning ignored
    }

    const processingTime = Date.now() - startTime;
    // Processing completed successfully

    res.json({ 
      success: true, 
      data: inserted,
      extractedText: extractedText.substring(0, 500),
      processingTime: `${processingTime}ms`,
      message: "Receipt processed successfully with OCR!"
    });

  } catch (error) {
    // Handle upload processing errors
    
    // Clean up file on error with better error handling
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        // Add delay to ensure file handles are released
        setTimeout(() => {
          try {
            fs.unlinkSync(req.file.path);
            console.log('🧹 Error cleanup: Temporary file removed');
          } catch (cleanupError) {
            console.warn('Error cleanup: Could not remove temporary file:', cleanupError.message);
          }
        }, 100);
      } catch (cleanupError) {
        console.warn('Error cleanup warning:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      error: error.message || "Processing failed",
      details: "Please ensure the uploaded file contains clear, readable text"
    });
  }
});

export default router;