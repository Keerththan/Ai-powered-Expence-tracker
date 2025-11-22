# FinSight - AI-Powered Expense Tracker

![FinSight Banner](https://img.shields.io/badge/FinSight-AI%20Expense%20Tracker-blue?style=for-the-badge)

## 🌟 Project Overview

FinSight is a modern, intelligent expense tracking application that leverages cutting-edge AI technology to automatically extract and categorize expenses from uploaded receipts and bills. Built with Next.js 15 and powered by Azure OpenAI, FinSight provides users with comprehensive expense management and intelligent financial insights.

## ✨ Key Features

### 🤖 AI-Powered OCR Processing
- **Smart Receipt Scanning**: Automatically extracts expense details from photos of receipts
- **High Accuracy**: Advanced OCR technology with 90%+ accuracy rates
- **Multi-Format Support**: Supports images (JPG, PNG, WebP) and PDF documents

### 💬 Intelligent Chat Assistant
- **Natural Language Queries**: Ask questions about your expenses in plain English
- **Financial Insights**: Get detailed analysis of spending patterns and trends
- **Real-time Analytics**: Instant responses with categorized expense breakdowns

### 🔐 Secure Authentication
- **Supabase Authentication**: Enterprise-grade security and user management
- **Protected Routes**: Secure access to personal financial data
- **Session Management**: Automatic login/logout with secure token handling

### 📊 Expense Management
- **Automatic Categorization**: AI categorizes expenses (Food, Transport, Shopping, etc.)
- **Real-time Storage**: Instant saving to secure cloud database
- **Data Persistence**: All expenses saved and accessible across sessions
- **Export Capabilities**: Easy data export for accounting and tax purposes

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: Zustand for efficient state handling
- **UI Components**: Custom React components with TypeScript

### Backend
- **Runtime**: Node.js with Express.js
- **AI Integration**: Azure OpenAI (GPT-4o-mini deployment)
- **OCR Engine**: Tesseract.js with Sharp image processing
- **File Upload**: Multer with secure file handling

### Database & Storage
- **Database**: Supabase PostgreSQL with Row-Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for secure file management
- **Real-time Features**: Supabase real-time subscriptions

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Azure OpenAI API access
- Supabase account and project setup

### Environment Configuration

#### Backend (.env)
```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Server Configuration
PORT=5000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Installation Steps

1. **Clone the repository**
```bash
git clone [repository-url]
cd Ai-powered-Expence-tracker
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up Database**
Run the provided SQL schema in your Supabase dashboard:
```sql
-- See backend/create-tables.sql for full schema
```

5. **Start the Application**

**Backend (Terminal 1):**
```bash
cd backend
node server.js
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or sign in with existing credentials
2. **Upload Receipt**: Take a photo or upload an image of your receipt
3. **Review Details**: Check the automatically extracted expense information
4. **Save Expense**: Confirm and save the expense to your account
5. **Chat with AI**: Ask questions about your spending patterns

### AI Chat Examples
- "How much did I spend this month?"
- "What's my biggest expense category?"
- "Show me all food-related expenses"
- "What was my average daily spending last week?"

## 🏗 Project Structure

```
FinSight/
├── backend/
│   ├── routes/
│   │   ├── upload.js       # File upload and OCR processing
│   │   ├── chat.js         # AI chat functionality
│   │   └── expenses.js     # Expense management
│   ├── services/
│   │   ├── OCRService.js   # OCR text extraction
│   │   ├── openaiService.js # AI processing
│   │   └── supabaseService.js # Database operations
│   └── server.js           # Express server setup
├── frontend/
│   ├── app/
│   │   ├── dashboard/      # Main dashboard pages
│   │   ├── login/          # Authentication pages
│   │   └── register/
│   ├── components/         # Reusable React components
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript type definitions
│   └── lib/               # Utility libraries
└── README.md
```

## 🔧 API Endpoints

### Upload API
- `POST /api/upload` - Upload and process receipt images

### Chat API
- `POST /api/chat` - Send questions to AI assistant

### Expenses API
- `GET /api/expenses/:userId` - Retrieve user expenses

## 🛡 Security Features

- **Row-Level Security**: Database-level security ensuring users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **File Validation**: Strict file type and size validation
- **Input Sanitization**: Protection against injection attacks
- **CORS Protection**: Controlled cross-origin resource sharing

## 📈 Performance Optimizations

- **Image Compression**: Automatic image optimization for faster processing
- **Lazy Loading**: Component and image lazy loading for improved performance
- **Efficient State Management**: Optimized state updates and re-renders
- **Database Indexing**: Optimized database queries and indexing

## 🎯 Production Deployment

### Backend Deployment
1. Deploy to cloud platform (AWS, Google Cloud, Azure)
2. Configure environment variables
3. Set up domain and SSL certificate
4. Configure CORS for production URLs

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Configure environment variables
4. Update API URLs for production

## 📞 Support & Maintenance

### System Requirements
- **Minimum**: 1GB RAM, 1 CPU core
- **Recommended**: 2GB RAM, 2 CPU cores
- **Storage**: 10GB minimum for file uploads

### Monitoring
- Monitor API response times
- Track OCR accuracy rates
- Monitor file upload success rates
- Database performance monitoring

## 📄 License

This project is developed for client use. All rights reserved.

## 🤝 Professional Support

For technical support, feature requests, or maintenance services, please contact the development team.

---

**FinSight - Intelligent Expense Management Made Simple** 🚀