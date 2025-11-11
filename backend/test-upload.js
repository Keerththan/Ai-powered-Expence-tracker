// backend/test-upload.js
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { supabase } from "./services/supabaseService.js";
import { extractExpenseData } from "./services/openaiService.js";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Test endpoints
app.get("/test", (req, res) => {
  res.json({ status: "Backend is running!", timestamp: new Date().toISOString() });
});

// Test Supabase connection
app.get("/test/supabase", async (req, res) => {
  try {
    const { data, error } = await supabase.from('expenses').select('count(*)', { count: 'exact' });
    if (error) throw error;
    res.json({ success: true, message: "Supabase connected!", data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test OpenAI connection
app.get("/test/openai", async (req, res) => {
  try {
    const testText = "Receipt from test store, $10.50, food, cash payment on 2025-11-11";
    const result = await extractExpenseData(testText);
    res.json({ success: true, message: "OpenAI connected!", result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple upload test
app.post("/test/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("📁 File upload test started...");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const file = req.file;
    const { user_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "No user_id provided" });
    }

    console.log("✅ File received:", file.originalname);
    console.log("✅ User ID:", user_id);

    // Test file reading
    const fileBuffer = fs.readFileSync(file.path);
    console.log("✅ File read successfully, size:", fileBuffer.length);

    // Test Supabase storage upload
    const fileName = `test_${user_id}_${Date.now()}_${file.originalname}`;
    console.log("📤 Uploading to Supabase storage:", fileName);

    const { data: uploaded, error: storageError } = await supabase.storage
      .from("user_uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      });

    if (storageError) {
      console.error("❌ Storage error:", storageError);
      throw storageError;
    }

    console.log("✅ File uploaded to storage:", uploaded.path);

    // Test AI extraction
    console.log("🤖 Testing AI extraction...");
    const mockText = `Receipt from Test Store, Rs. 1250, groceries, card payment on ${new Date().toISOString().split('T')[0]}`;
    const aiResponse = await extractExpenseData(mockText);
    console.log("✅ AI response:", aiResponse);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
      console.log("✅ AI response parsed:", parsed);
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    // Test database insertion
    console.log("💾 Testing database insertion...");
    const expenseData = { 
      ...parsed, 
      user_id,
      file_url: uploaded.path,
      created_at: new Date().toISOString()
    };

    console.log("Data to insert:", expenseData);

    const { data: dbData, error: dbError } = await supabase
      .from("expenses")
      .insert([expenseData])
      .select();

    if (dbError) {
      console.error("❌ Database error:", dbError);
      throw dbError;
    }

    console.log("✅ Database insertion successful:", dbData);

    // Clean up temporary file
    fs.unlinkSync(file.path);
    console.log("✅ Temporary file cleaned up");

    res.json({ 
      success: true, 
      message: "Upload test completed successfully!",
      data: parsed,
      file_url: uploaded.path,
      db_result: dbData
    });

  } catch (error) {
    console.error("❌ Upload test failed:", error);
    
    // Clean up temp file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Upload Test Server running on port ${PORT}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/test`);
  console.log(`   GET  http://localhost:${PORT}/test/supabase`);
  console.log(`   GET  http://localhost:${PORT}/test/openai`);
  console.log(`   POST http://localhost:${PORT}/test/upload`);
});