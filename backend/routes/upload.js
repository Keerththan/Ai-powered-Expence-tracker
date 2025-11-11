// backend/routes/upload.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { supabase } from "../services/supabaseService.js";
import { extractExpenseData } from "../services/openaiService.js";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { user_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read file content
    const fileBuffer = fs.readFileSync(file.path);
    
    // Upload file to Supabase Storage
    const fileName = `${user_id}_${Date.now()}_${file.originalname}`;
    const { data: uploaded, error: storageError } = await supabase.storage
      .from("user_uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      throw storageError;
    }

    // Mock extracted text → real app would use OCR for image/PDF
    const text = `Receipt from Keells, Rs. 2570, groceries, paid via card on ${new Date().toISOString().split('T')[0]}`;
    const response = await extractExpenseData(text);
    
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse AI response:", response);
      throw new Error("Invalid AI response format");
    }

    // Save to DB with proper error handling
    const { data: dbData, error: dbError } = await supabase
      .from("expenses")
      .insert([{ 
        ...parsed, 
        user_id,
        file_url: uploaded.path,
        created_at: new Date().toISOString()
      }])
      .select();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    // Clean up temporary file
    fs.unlinkSync(file.path);

    res.json({ 
      success: true, 
      data: parsed,
      file_url: uploaded.path,
      message: "Expense processed successfully!"
    });
  } catch (e) {
    console.error("Upload processing error:", e);
    res.status(500).json({ 
      error: "Processing failed", 
      details: e.message 
    });
  }
});

export default router;
