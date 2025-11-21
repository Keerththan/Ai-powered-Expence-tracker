// types/expense.ts
export interface Expense {
  id?: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  user_id: string;
  file_url?: string;
  created_at?: string;
}

export interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchExpenses: (userId: string) => Promise<void>;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export interface UploadResponse {
  success: boolean;
  data: Expense;
  file_url?: string;
  message: string;
}