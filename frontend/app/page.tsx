"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // Auto redirect to dashboard after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl text-white font-bold">₹</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            FinSight
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            AI-Powered Expense Management System
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">AI Extraction</h3>
            <p className="text-sm text-gray-600">Automatically extract expense details from receipts</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-800 mb-2">Smart Chat</h3>
            <p className="text-sm text-gray-600">Ask questions about your expenses in natural language</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">Get insights and track spending patterns</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={goToDashboard}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
        >
          Get Started →
        </button>

        {/* Auto redirect message */}
        <p className="mt-6 text-gray-500 text-sm">
          Redirecting to dashboard in 2 seconds...
        </p>
      </div>
    </div>
  );
}
