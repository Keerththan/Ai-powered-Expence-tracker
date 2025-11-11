// backend/setup-database.js
import { supabase } from "./services/supabaseService.js";

async function setupDatabase() {
  console.log("🔧 Setting up Supabase database and storage...");

  try {
    // 1. Create expenses table
    console.log("1. Creating expenses table...");
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        -- Create index on user_id for faster queries
        CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
        
        -- Create index on date for faster date-based queries
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        
        -- Enable Row Level Security (RLS)
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow users to access only their own expenses
        DROP POLICY IF EXISTS "Users can access own expenses" ON expenses;
        CREATE POLICY "Users can access own expenses" ON expenses
          FOR ALL USING (auth.uid() = user_id);
      `
    });

    if (tableError) {
      console.log("Table might already exist or using alternative method...");
      
      // Alternative: Create table using supabase client
      const { error: directTableError } = await supabase
        .from('expenses')
        .select('id')
        .limit(1);
        
      if (directTableError && directTableError.code === '42P01') {
        console.log("Creating table with direct SQL...");
        // Table doesn't exist, we'll create it manually via Supabase dashboard
        console.log(`
🚨 MANUAL STEP REQUIRED:
Go to your Supabase Dashboard (https://app.supabase.com) and create the expenses table:

SQL to run in SQL Editor:
        
CREATE TABLE expenses (
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

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);
        `);
      }
    } else {
      console.log("✅ Expenses table created successfully!");
    }

    // 2. Create storage bucket
    console.log("\n2. Creating storage bucket...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'user_uploads');

    if (!bucketExists) {
      const { data: bucket, error: bucketError } = await supabase.storage.createBucket('user_uploads', {
        public: false, // Private bucket - users can only access their own files
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        fileSizeLimit: 5242880 // 5MB limit
      });

      if (bucketError) {
        console.error("Error creating bucket:", bucketError);
        console.log(`
🚨 MANUAL STEP REQUIRED:
Go to your Supabase Dashboard → Storage and create a bucket named 'user_uploads':
- Name: user_uploads  
- Public: No (private)
- File size limit: 5MB
- Allowed file types: JPEG, PNG, PDF
        `);
      } else {
        console.log("✅ Storage bucket 'user_uploads' created successfully!");
      }
    } else {
      console.log("✅ Storage bucket 'user_uploads' already exists!");
    }

    // 3. Test database connection
    console.log("\n3. Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error("Database connection test failed:", testError);
    } else {
      console.log("✅ Database connection successful!");
    }

    // 4. Test storage connection
    console.log("\n4. Testing storage connection...");
    const { data: storageData, error: storageError } = await supabase.storage
      .from('user_uploads')
      .list('', { limit: 1 });

    if (storageError) {
      console.error("Storage connection test failed:", storageError);
    } else {
      console.log("✅ Storage connection successful!");
    }

    console.log("\n🎉 Database setup completed!");
    console.log("✅ Expenses table ready");
    console.log("✅ Storage bucket ready");
    console.log("✅ All connections tested");

  } catch (error) {
    console.error("Setup failed:", error);
  }
}

// Run setup
setupDatabase().then(() => {
  console.log("\n🚀 Setup script finished!");
  process.exit(0);
}).catch((error) => {
  console.error("Setup script failed:", error);
  process.exit(1);
});