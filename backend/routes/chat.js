// backend/routes/chat.js
import express from "express";
import { supabase } from "../services/supabaseService.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Azure OpenAI configuration
const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

router.post("/", async (req, res) => {
  const { user_id, question } = req.body;
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user_id);

  const context = JSON.stringify(expenses);
  const prompt = `
  You are a financial assistant.
  The user's expenses data: ${context}
  Answer this question based only on that data: ${question}
  `;

  const result = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME, // Use deployment name for Azure
    messages: [{ role: "user", content: prompt }],
  });

  res.json({ answer: result.choices[0].message.content });
});

export default router;
