// backend/test-server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/health", (req, res) => {
  res.json({ 
    status: "FinSight Backend is running!",
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
      azure_endpoint: process.env.AZURE_OPENAI_ENDPOINT ? "✓ Set" : "✗ Missing"
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;