// backend/server-simple.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Simple routes
app.get("/", (req, res) => {
  res.json({ message: "FinSight Backend API" });
});

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

// Try loading routes one by one
try {
  const uploadRoute = await import("./routes/upload.js");
  app.use("/upload", uploadRoute.default);
  console.log("✓ Upload route loaded");
} catch (error) {
  console.error("✗ Error loading upload route:", error.message);
}

try {
  const chatRoute = await import("./routes/chat.js");
  app.use("/chat", chatRoute.default);
  console.log("✓ Chat route loaded");
} catch (error) {
  console.error("✗ Error loading chat route:", error.message);
}

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

app.listen(PORT, () => {
  console.log(`🚀 FinSight Backend Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;