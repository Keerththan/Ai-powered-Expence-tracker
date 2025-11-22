// frontend/store/useExpenseStore.ts
import { create } from "zustand";
import { Expense, ExpenseStore } from "../types/expense";
import axios from "axios";

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

  fetchExpenses: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`http://localhost:5000/api/expenses/${userId}`);
      if (response.data.success) {
        set({ 
          expenses: response.data.data, 
          loading: false, 
          error: null 
        });
        console.log(`Loaded ${response.data.count} expenses from database`);
      } else {
        throw new Error('Failed to fetch expenses');
      }
    } catch (error: any) {
      console.error('Fetch expenses error:', error);
      set({ 
        error: error.response?.data?.error || error.message || 'Failed to load expenses',
        loading: false 
      });
    }
  },
}));
