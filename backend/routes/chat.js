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

// Enhanced expense data analysis
function analyzeExpenses(expenses) {
  if (!expenses || expenses.length === 0) {
    return {
      totalCount: 0,
      totalAmount: 0,
      categories: {},
      recentExpenses: [],
      dateRange: null,
      averageAmount: 0
    };
  }

  const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const totalCount = expenses.length;
  
  // Category breakdown
  const categories = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 };
    }
    acc[category].count++;
    acc[category].amount += parseFloat(exp.amount) || 0;
    return acc;
  }, {});

  // Recent expenses (last 10)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Date range
  const dates = expenses.map(exp => new Date(exp.date)).sort();
  const dateRange = dates.length > 0 ? {
    earliest: dates[0],
    latest: dates[dates.length - 1]
  } : null;

  return {
    totalCount,
    totalAmount: Math.round(totalAmount * 100) / 100,
    categories,
    recentExpenses,
    dateRange,
    averageAmount: totalCount > 0 ? Math.round((totalAmount / totalCount) * 100) / 100 : 0
  };
}

router.post("/", async (req, res) => {
  try {
    const { user_id, question } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    // Process chat question for user

    // Fetch user's expense data
    const { data: expenses, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Analyze expense data
    const analysis = analyzeExpenses(expenses);
    
    // Analyze expense data for AI context

    // Create enhanced AI prompt
    const systemPrompt = `You are FinSight AI, an intelligent financial assistant helping users understand their spending patterns. 

You have access to the user's expense data and should provide helpful, accurate, and actionable insights.

Guidelines:
- Be conversational and friendly
- Provide specific numbers and details
- Offer helpful insights and trends
- Use emojis sparingly but effectively
- If asked about data you don't have, politely explain the limitation
- Format monetary values clearly (e.g., $123.45)
- When showing lists, format them nicely

User's Expense Summary:
- Total Expenses: ${analysis.totalCount} transactions
- Total Amount: $${analysis.totalAmount}
- Average per transaction: $${analysis.averageAmount}
- Categories: ${Object.keys(analysis.categories).join(", ") || "None yet"}

Full Expense Data:
${JSON.stringify(expenses, null, 2)}`;

    const userPrompt = `User Question: "${question}"

Please analyze the expense data and provide a helpful response to the user's question.`;

    // Call Azure OpenAI
    const result = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiAnswer = result.choices[0].message.content;

    res.json({ 
      success: true,
      answer: aiAnswer,
      expenseCount: analysis.totalCount,
      totalAmount: analysis.totalAmount
    });

  } catch (error) {
    res.status(500).json({ 
      error: error.message || "Failed to process chat request",
      details: "Please try again or rephrase your question"
    });
  }
});

export default router;
