"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const goToRegister = () => {
    router.push("/register");
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goToRegister}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
            >
              Get Started Free →
            </button>
            <button
              onClick={goToLogin}
              className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
          
          {user && (
            <button
              onClick={goToDashboard}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}