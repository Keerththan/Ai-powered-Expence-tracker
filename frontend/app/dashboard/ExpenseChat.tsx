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
        answer: "Welcome to FinSight AI Assistant! \n\nI'm here to help you understand your spending patterns and manage your expenses more effectively. \n\nYou can ask me about:\n• Monthly and weekly spending totals\n• Expense categories and trends\n• Specific vendor purchases\n• Spending analytics and insights\n\nWhat would you like to explore first?",
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
        answer: "Chat cleared! \n\nI'm ready to help you analyze your expenses again. What would you like to know?",
        timestamp: new Date().toISOString(),
        isBot: true
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
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
                <div className="bg-blue-600 text-white px-5 py-3 rounded-lg max-w-[75%] shadow-sm">
                  <p className="text-sm leading-relaxed">{message.question}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-500">
                    <span className="text-xs text-blue-100">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-blue-100">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>You</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* AI Response */}
            {message.answer && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-[85%]">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
                    AI
                  </div>
                  <div className="bg-white px-5 py-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {/* Format the response with better structure */}
                      {message.answer.split('\n').map((line, lineIndex) => {
                        let trimmedLine = line.trim();
                        if (!trimmedLine) return <br key={lineIndex} />;
                        
                        // Clean up markdown formatting
                        // Remove multiple asterisks and format bold text
                        trimmedLine = trimmedLine
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') // Bold text
                          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') // Italic text
                          .replace(/#{1,6}\s*(.*)/g, '<strong class="font-semibold text-gray-900 text-base">$1</strong>') // Headers
                          .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>'); // Code
                        
                        // Handle bullet points
                        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                          const content = trimmedLine.substring(1).trim();
                          const cleanContent = content
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
                          return (
                            <div key={lineIndex} className="flex items-start space-x-2 my-1">
                              <span className="text-blue-500 font-bold mt-0.5">•</span>
                              <span dangerouslySetInnerHTML={{ __html: cleanContent }} />
                            </div>
                          );
                        }
                        
                        // Handle numbered lists
                        if (/^\d+\./.test(line.trim())) {
                          const match = trimmedLine.match(/^(\d+\.\s*)(.*)/);
                          if (match) {
                            const cleanContent = match[2]
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
                            return (
                              <div key={lineIndex} className="flex items-start space-x-2 my-1">
                                <span className="text-blue-500 font-semibold">{match[1]}</span>
                                <span dangerouslySetInnerHTML={{ __html: cleanContent }} />
                              </div>
                            );
                          }
                        }
                        
                        // Handle headings (text with colons or standalone bold text)
                        if (trimmedLine.includes(':') && trimmedLine.length < 60) {
                          const cleanHeading = trimmedLine
                            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove asterisks from headings
                            .replace(/\*(.*?)\*/g, '$1');
                          return (
                            <div key={lineIndex} className="font-semibold text-gray-900 mt-3 mb-1 first:mt-0">
                              {cleanHeading}
                            </div>
                          );
                        }
                        
                        // Handle monetary values and clean formatting
                        let formattedLine = trimmedLine
                          // Handle dollar and rupee amounts
                          .replace(/(\$[\d,]+(?:\.\d{2})?|\bRs?\.?\s*[\d,]+(?:\.\d{2})?)/g, 
                            '<span class="font-semibold text-green-600">$1</span>')
                          // Clean up any remaining stray asterisks
                          .replace(/\*+/g, '');
                        
                        // Regular paragraph
                        return (
                          <div key={lineIndex} className="mb-2 last:mb-0">
                            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>AI Response</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator - Only show when actually processing */}
        {isLoading && !messages.some(m => m.id.includes('_ai') && !m.answer) && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                AI
              </div>
              <div className="bg-white px-5 py-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-sm text-gray-600">Analyzing your expenses...</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">This may take a few seconds</div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t bg-blue-50">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-gray-700 font-medium">Quick questions to get you started:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQuestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => askAI(suggestion)}
                className="text-left text-sm p-3 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm group"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 group-hover:text-blue-600 transition-colors">▶</span>
                  <span className="group-hover:text-gray-900 transition-colors">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            Click any question above or type your own below
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
            placeholder="Ask me about your expenses..."
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