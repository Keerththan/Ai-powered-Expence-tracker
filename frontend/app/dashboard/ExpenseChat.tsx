"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ChatMessage } from "@/types/expense";

interface ExpenseChatProps {
  userId: string;
}

export default function ExpenseChat({ userId }: ExpenseChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Only scroll if not locked and user is near bottom
    if (scrollLocked) return;
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isNearBottom || messages.length <= 2) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: "end"
          });
        }, 100);
      }
    }
  };

  useEffect(() => {
    // Only auto-scroll for new complete messages
    if (!isLoading && !isTyping) {
      scrollToBottom();
    }
  }, [messages.length, isLoading, isTyping]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "Hello! I'm your FinSight AI assistant. I can help you analyze your expenses and answer questions about your spending. What would you like to know?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Enhanced suggested questions
  const suggestedQuestions = [
    "How much did I spend this month?",
    "What's my highest expense category?",
    "Show me all food expenses",
    "How much did I spend last week?",
    "What's my average daily spending?",
    "Which stores do I shop at most?",
    "Show me my largest expenses",
    "Give me a spending summary"
  ];

  const typeWriter = (text: string, messageId: string) => {
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, answer: text.substring(0, index + 1) }
            : msg
        ));
        index += 3; // Speed up typing (3 characters at a time)
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 50); // Slower interval to reduce UI strain
  };

  const askAI = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question.trim();
    
    if (!questionToAsk) {
      setError("Please enter a question");
      return;
    }

    if (!userId) {
      setError("Please log in to ask questions");
      return;
    }

    setIsLoading(true);
    setError(null);
    setScrollLocked(true); // Lock scrolling during response
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + "_user",
      question: questionToAsk,
      answer: "",
      timestamp: new Date().toISOString(),
      isBot: false
    };

    // Create placeholder for AI response
    const aiMessage: ChatMessage = {
      id: Date.now().toString() + "_ai",
      question: "",
      answer: "",
      timestamp: new Date().toISOString(),
      isBot: true
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setQuestion("");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/chat`, {
        user_id: userId,
        question: questionToAsk,
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Instant response with slight delay for better UX
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, answer: response.data.answer }
              : msg
          ));
          setScrollLocked(false); // Unlock scrolling after response
        }, 300);
      } else {
        throw new Error(response.data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      // Handle chat error
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get AI response';
      
      // Update the AI message with error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, answer: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
          : msg
      ));
      setScrollLocked(false); // Unlock on error
    } finally {
      setIsLoading(false);
      // Ensure scroll is unlocked after a delay
      setTimeout(() => {
        setScrollLocked(false);
      }, 1000);
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
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "Chat cleared! What would you like to know about your expenses?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-lg">FinSight AI Assistant</h3>
        </div>
        <button
          onClick={clearChat}
          className="text-white/80 hover:text-white transition-colors text-sm"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scroll-smooth"
        style={{ scrollBehavior: scrollLocked ? 'auto' : 'smooth' }}
      >
        {messages.map((message, index) => (
          <div key={message.id} className="space-y-2">
            {/* User Message */}
            {message.question && (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-4 py-3 rounded-lg max-w-[80%] shadow-md">
                  <p className="text-sm">{message.question}</p>
                  <span className="text-xs text-blue-100 block mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
            
            {/* AI Response */}
            {message.answer && (
              <div className="flex justify-start">
                <div className="flex space-x-2 max-w-[80%]">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    AI
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg shadow-md border">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {message.answer}
                    </div>
                    <span className="text-xs text-gray-500 block mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator - Only show when actually processing */}
        {isLoading && !messages.some(m => m.id.includes('_ai') && !m.answer) && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-md border">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                  <span className="text-sm text-gray-600">Analyzing your expenses...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t bg-white">
          <p className="text-sm text-gray-600 mb-3 font-medium">Try asking:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => askAI(suggestion.split(' ').slice(1).join(' '))}
                className="text-left text-xs p-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors text-blue-700 border border-blue-200"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-3 bg-white">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            Error: {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyPress}
            placeholder="Ask me about your expenses... (Press Enter to send)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={() => askAI()}
            disabled={isLoading || !question.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              isLoading || !question.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transform hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Ask me about spending patterns, categories, amounts, or specific time periods
        </div>
      </div>
    </div>
  );
}