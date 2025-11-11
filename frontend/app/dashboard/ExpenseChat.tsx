"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ChatMessage } from "@/types/expense";

export default function ExpenseChat({ userId }: { userId: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggested questions
  const suggestedQuestions = [
    "How much did I spend this month?",
    "What's my highest expense category?",
    "Show me all grocery expenses",
    "How much did I spend on food last week?",
    "What was my average daily spending?",
  ];

  const askAI = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question;
    
    if (!questionToAsk.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + "_user",
      question: questionToAsk,
      answer: "",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion(""); // Clear input

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        user_id: userId,
        question: questionToAsk,
      }, {
        timeout: 15000, // 15 second timeout
      });

      // Add AI response
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "_ai",
        question: questionToAsk,
        answer: response.data.answer,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...userMessage, answer: response.data.answer };
        return newMessages;
      });

    } catch (error: any) {
      console.error("Chat error:", error);
      setError(
        error.response?.data?.error || 
        error.message || 
        "Failed to get AI response. Please try again."
      );
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-700">AI Assistant</h3>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p className="mb-4">Ask me anything about your expenses!</p>
            <div className="grid grid-cols-1 gap-2">
              <p className="text-xs font-medium text-gray-600 mb-2">Try asking:</p>
              {suggestedQuestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => askAI(suggestion)}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                <p className="text-sm">{message.question}</p>
              </div>
            </div>

            {/* AI Answer */}
            {message.answer && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                  <p className="text-sm whitespace-pre-wrap">{message.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask about your expenses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => askAI()}
            disabled={isLoading || !question.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isLoading || !question.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {suggestedQuestions.slice(3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuestion(suggestion)}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
