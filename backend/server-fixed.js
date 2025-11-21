// backend/server-fixed.js - Simplified robust server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "FinSight Backend is running!",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Load routes with error handling
console.log('🚀 Starting FinSight Backend Server...');

// Upload route
try {
  const { default: uploadRoute } = await import("./routes/upload.js");
  app.use("/api/upload", uploadRoute);
  console.log('✅ Upload route loaded');
} catch (uploadError) {
  console.error('❌ Upload route failed to load:', uploadError.message);
  // Create fallback upload endpoint
  app.post("/api/upload", (req, res) => {
    res.status(500).json({ 
      error: "Upload service temporarily unavailable",
      details: "Route failed to initialize: " + uploadError.message
    });
  });
}

// Chat route
try {
  const { default: chatRoute } = await import("./routes/chat.js");
  app.use("/api/chat", chatRoute);
  console.log('✅ Chat route loaded');
} catch (chatError) {
  console.error('❌ Chat route failed to load:', chatError.message);
  // Create fallback chat endpoint
  app.post("/api/chat", (req, res) => {
    res.status(500).json({ 
      error: "Chat service temporarily unavailable",
      details: "Route failed to initialize: " + chatError.message
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - no wildcards
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'POST /api/upload',
      'POST /api/chat'
    ]
  });
});

// Environment check
console.log('📊 Environment check:');
console.log(`   Node.js version: ${process.version}`);
console.log(`   Working directory: ${process.cwd()}`);

const criticalVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_KEY'
];

let envIssues = 0;
criticalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: configured`);
  } else {
    console.log(`   ❌ ${varName}: missing`);
    envIssues++;
  }
});

if (envIssues > 0) {
  console.warn(`⚠️  ${envIssues} environment variables are missing`);
}

// Start server
app.listen(PORT, () => {
  console.log('\n🎉 Server startup complete!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log('🔄 Ready to accept requests\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;