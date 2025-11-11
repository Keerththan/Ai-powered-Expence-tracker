# FinSight - AI-Powered Expense Management System

An intelligent expense tracking application that uses AI to automatically extract expense details from receipts and provides a conversational interface for querying financial data.

## 🚀 Features

- **AI Receipt Processing**: Upload receipts and automatically extract vendor, amount, category, date, and payment method
- **Smart Chat Interface**: Ask questions about your expenses in natural language
- **Real-time Dashboard**: View expense analytics, category breakdowns, and spending insights
- **Secure Storage**: All data stored securely in Supabase with user authentication
- **Modern UI**: Responsive design built with Next.js and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, Zustand
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Azure OpenAI (GPT-4o-mini)
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth (to be implemented)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Azure OpenAI account

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Keerththan/Ai-powered-Expence-tracker.git
cd Ai-powered-Expence-tracker
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend (.env)
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

### 5. Storage Setup

1. Go to Supabase Storage
2. Create a new bucket called `user_uploads`
3. Make it public
4. Add storage policies:

```sql
-- Allow file uploads
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user_uploads');

-- Allow file access
CREATE POLICY "Users can view files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user_uploads');
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
Server will start at: http://localhost:5000

### Start Frontend Application
```bash
cd frontend
npm run dev
```
Application will start at: http://localhost:3000

## 📁 Project Structure

```
├── backend/
│   ├── routes/
│   │   ├── chat.js          # AI chat endpoint
│   │   └── upload.js        # File upload & processing
│   ├── services/
│   │   ├── openaiService.js # Azure OpenAI integration
│   │   └── supabaseService.js # Database connection
│   ├── uploads/             # Temporary file storage
│   ├── server.js            # Express server
│   └── .env                 # Backend environment variables
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx     # Main dashboard
│   │   │   └── ExpenseChat.tsx # Chat component
│   │   ├── page.tsx         # Landing page
│   │   └── layout.tsx       # App layout
│   ├── components/
│   │   └── UploadForm.tsx   # File upload component
│   ├── store/
│   │   └── useExpenseStore.ts # Zustand state management
│   ├── types/
│   │   └── expense.ts       # TypeScript interfaces
│   └── .env.local           # Frontend environment variables
```

## 🔑 API Endpoints

- `POST /upload` - Upload and process receipt files
- `POST /chat` - Chat with AI about expenses
- `GET /health` - Health check endpoint

## 📝 Usage

1. **Upload Receipts**: Drag and drop receipt images/PDFs
2. **AI Processing**: System automatically extracts expense details
3. **View Dashboard**: See spending analytics and recent expenses
4. **Chat Interface**: Ask questions like "How much did I spend on food last month?"

## 🛡️ Security Features

- Row Level Security (RLS) policies
- Secure file upload validation
- Environment variable protection
- API key security

## 🚧 Future Enhancements

- [ ] User authentication with Supabase Auth
- [ ] OCR integration for better text extraction
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Budget setting and alerts
- [ ] Export functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, email keerththan@example.com or create an issue in the GitHub repository.