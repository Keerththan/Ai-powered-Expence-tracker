// backend/test-services.js
import dotenv from "dotenv";
dotenv.config();

console.log("Testing service imports...\n");

// Test environment variables
console.log("Environment Variables:");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing");
console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "✓ Set" : "✗ Missing");
console.log("AZURE_OPENAI_ENDPOINT:", process.env.AZURE_OPENAI_ENDPOINT ? "✓ Set" : "✗ Missing");
console.log("AZURE_OPENAI_API_KEY:", process.env.AZURE_OPENAI_API_KEY ? "✓ Set" : "✗ Missing");
console.log();

// Test Supabase service
try {
  const { supabase } = await import("./services/supabaseService.js");
  console.log("✓ Supabase service imported successfully");
  
  // Test connection
  const { data, error } = await supabase.from("expenses").select("count").limit(1);
  if (error) {
    console.log("⚠️ Supabase connection test failed:", error.message);
  } else {
    console.log("✓ Supabase connection test passed");
  }
} catch (error) {
  console.error("✗ Supabase service import failed:", error.message);
}

// Test OpenAI service
try {
  const { extractExpenseData } = await import("./services/openaiService.js");
  console.log("✓ OpenAI service imported successfully");
  
  // Test extraction (with mock data)
  const testResult = await extractExpenseData("Test receipt from Store ABC, $25.99, groceries");
  console.log("✓ OpenAI service test passed");
  console.log("Test result:", testResult);
} catch (error) {
  console.error("✗ OpenAI service import/test failed:", error.message);
}

console.log("\nService testing complete!");