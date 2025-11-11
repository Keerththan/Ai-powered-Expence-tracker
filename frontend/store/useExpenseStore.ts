// frontend/store/useExpenseStore.ts
import { create } from "zustand";
import { Expense, ExpenseStore } from "../types/expense";

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  loading: false,
  error: null,
  
  setExpenses: (expenses: Expense[]) => 
    set({ expenses, error: null }),
    
  addExpense: (expense: Expense) => 
    set((state) => ({ 
      expenses: [...state.expenses, expense],
      error: null 
    })),
    
  setLoading: (loading: boolean) => 
    set({ loading }),
    
  setError: (error: string | null) => 
    set({ error, loading: false }),
}));
