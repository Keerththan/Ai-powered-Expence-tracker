-- SQL commands to run in Supabase Dashboard SQL Editor
-- Go to https://app.supabase.com → Your Project → SQL Editor

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  payment_method TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- 3. Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for user access (users can only see their own expenses)
DROP POLICY IF EXISTS "Users can access own expenses" ON expenses;
CREATE POLICY "Users can access own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- 5. Allow service role to bypass RLS (for backend operations)
DROP POLICY IF EXISTS "Service role can access all expenses" ON expenses;
CREATE POLICY "Service role can access all expenses" ON expenses
  FOR ALL TO service_role USING (true);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;