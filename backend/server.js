// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoute from "./routes/upload.js";
import chatRoute from "./routes/chat.js";
import expensesRoute from "./routes/expenses.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoute);
app.use("/api/expenses", expensesRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "FinSight Backend is running!", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 FinSight Backend Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;