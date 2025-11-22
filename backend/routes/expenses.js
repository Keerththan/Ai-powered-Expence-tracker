// backend/routes/expenses.js
import express from "express";
import { supabase } from "../services/supabaseService.js";

const router = express.Router();

// GET /api/expenses/:userId - Fetch all expenses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`Fetching expenses for user: ${userId}`);

    // Fetch user's expenses from database
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database fetch error:", error);
      throw error;
    }

    console.log(`Found ${expenses.length} expenses for user`);

    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
      message: "Expenses retrieved successfully"
    });

  } catch (error) {
    console.error("Fetch expenses error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch expenses",
      details: "Please try again later"
    });
  }
});

// GET /api/expenses/:userId/summary - Get expense summary/stats
router.get("/:userId/summary", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`Generating expense summary for user: ${userId}`);

    // Fetch user's expenses for summary
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("amount, category, date, created_at")
      .eq("user_id", userId);

    if (error) {
      console.error("Summary fetch error:", error);
      throw error;
    }

    // Calculate summary statistics
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    
    // This month expenses
    const now = new Date();
    const thisMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    });
    
    const thisMonthAmount = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    const summary = {
      totalAmount,
      expenseCount,
      thisMonthAmount,
      thisMonthCount: thisMonthExpenses.length,
      categoryBreakdown,
      averageAmount: expenseCount > 0 ? totalAmount / expenseCount : 0
    };

    console.log(`Summary generated: ${expenseCount} expenses, total: ${totalAmount}`);

    res.json({
      success: true,
      data: summary,
      message: "Expense summary generated successfully"
    });

  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate summary",
      details: "Please try again later"
    });
  }
});

export default router;