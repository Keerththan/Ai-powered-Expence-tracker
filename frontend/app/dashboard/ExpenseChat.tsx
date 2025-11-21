"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatMessage } from "@/types/expense";

export default function ExpenseChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "👋 Hello! I'm your FinSight AI assistant. I can help you analyze your expenses and answer questions about your spending. What would you like to know?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Enhanced suggested questions with emojis
  const suggestedQuestions = [
    "💰 How much did I spend this month?",
    "📊 What's my highest expense category?",
    "🥘 Show me all food expenses",
    "📅 How much did I spend last week?",
    "📈 What's my average daily spending?",
    "🏪 Which stores do I shop at most?",
    "💳 Show me my largest expenses",
    "📋 Give me a spending summary"
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
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);
  };

  const askAI = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question.trim();
    
    if (!questionToAsk) {
      setError("Please enter a question");
      return;
    }

    if (!user) {
      setError("Please log in to ask questions");
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
        user_id: user.id,
        question: questionToAsk,
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Use typewriter effect for AI response
        typeWriter(response.data.answer, aiMessage.id);
      } else {
        throw new Error(response.data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get AI response';
      
      // Update the AI message with error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, answer: `❌ Sorry, I encountered an error: ${errorMessage}. Please try again.` }
          : msg
      ));
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
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "👋 Chat cleared! What would you like to know about your expenses?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-lg">FinSight AI Assistant</h3>
        </div>
        <button
          onClick={clearChat}
          className="text-white/80 hover:text-white transition-colors text-sm"
          title="Clear chat"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-md border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
          <p className="text-sm text-gray-600 mb-3 font-medium">💡 Try asking:</p>
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
      <div className="border-t p-4 bg-white">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            ❌ {error}
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
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Ask me about spending patterns, categories, amounts, or specific time periods
        </div>
      </div>
    </div>
  );
}

export default function ExpenseChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "👋 Hello! I'm your FinSight AI assistant. I can help you analyze your expenses and answer questions about your spending. What would you like to know?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Enhanced suggested questions with emojis
  const suggestedQuestions = [
    "💰 How much did I spend this month?",
    "📊 What's my highest expense category?",
    "🥘 Show me all food expenses",
    "📅 How much did I spend last week?",
    "📈 What's my average daily spending?",
    "🏪 Which stores do I shop at most?",
    "💳 Show me my largest expenses",
    "📋 Give me a spending summary"
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
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);
  };

  const askAI = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question.trim();
    
    if (!questionToAsk) {
      setError("Please enter a question");
      return;
    }

    if (!user) {
      setError("Please log in to ask questions");
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
        user_id: user.id,
        question: questionToAsk,
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Use typewriter effect for AI response
        typeWriter(response.data.answer, aiMessage.id);
      } else {
        throw new Error(response.data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get AI response';
      
      // Update the AI message with error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, answer: `❌ Sorry, I encountered an error: ${errorMessage}. Please try again.` }
          : msg
      ));
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
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "👋 Chat cleared! What would you like to know about your expenses?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

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
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);
  };

  const askAI = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question.trim();
    
    if (!questionToAsk) {
      setError("Please enter a question");
      return;
    }

    if (!user) {
      setError("Please log in to ask questions");
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
        user_id: user.id,
        question: questionToAsk,
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Use typewriter effect for AI response
        typeWriter(response.data.answer, aiMessage.id);
      } else {
        throw new Error(response.data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get AI response';
      
      // Update the AI message with error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, answer: `❌ Sorry, I encountered an error: ${errorMessage}. Please try again.` }
          : msg
      ));
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
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: "welcome_" + Date.now(),
        question: "",
        answer: "👋 Chat cleared! What would you like to know about your expenses?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-lg">FinSight AI Assistant</h3>
        </div>
        <button
          onClick={clearChat}
          className="text-white/80 hover:text-white transition-colors text-sm"
          title="Clear chat"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-md border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
          <p className="text-sm text-gray-600 mb-3 font-medium">💡 Try asking:</p>
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
      <div className="border-t p-4 bg-white">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            ❌ {error}
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
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Ask me about spending patterns, categories, amounts, or specific time periods
        </div>
      </div>
    </div>
  );
}

    setMessages(prev => [...prev, userMessage]);
    setQuestion(""); // Clear input

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/chat`, {
        user_id: user?.id,
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

      // Update the user message with the AI response
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        if (lastMessageIndex >= 0) {
          newMessages[lastMessageIndex] = { 
            ...newMessages[lastMessageIndex], 
            answer: response.data.answer 
          };
        }
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
