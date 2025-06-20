import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Minimize2, Maximize2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface ChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatAssistant({ isOpen, onToggle }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your Zonke Hub assistant. I'm here to help you understand our platform and answer any questions you might have. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dappier API configuration
  const DAPPIER_API_KEY = 'ak_01jy7azf14fe3sf8sh1cjej3d2';
  const DAPPIER_API_URL = 'https://api.dappier.com/app/datamodelconversation';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get response from Dappier API
  const getDappierResponse = async (userMessage: string): Promise<string> => {
    try {
      setApiError(null);
      
      const response = await fetch(DAPPIER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAPPIER_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for Zonke Hub, a South African platform that connects users with local service providers. 
              
              Key information about Zonke Hub:
              - Free platform for both users and service providers
              - Connects customers with local professionals (plumbers, electricians, barbers, cleaners, etc.)
              - Features include: search by location, ratings & reviews, direct messaging, portfolio viewing
              - Two account types: User (finds services) and Provider (offers services)
              - Providers can set service radius, upload portfolios, set availability
              - Built-in chat system, phone/email contact options
              - Rating system with 1-5 stars and written reviews
              - Location-based matching within customizable radius
              
              Always be helpful, friendly, and focus on how Zonke Hub can solve the user's needs. Provide specific, actionable guidance.`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          model: 'gpt-4',
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Dappier API error:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Fallback response
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or feel free to explore Zonke Hub to find local service providers in your area!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get response from Dappier API
      const responseContent = await getDappierResponse(userMessage.content);
      
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantResponse]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again later or explore Zonke Hub to discover local service providers!",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] text-white p-3 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse"
        aria-label="Open chat assistant"
        style={{ zIndex: 9999 }}
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onToggle} />
      
      {/* Chat Window */}
      <div className={`fixed z-50 transition-all duration-300 ${
        // Mobile: Full screen when open, positioned at bottom-right when minimized
        isMinimized 
          ? 'bottom-4 right-4 w-72 h-14 sm:bottom-6 sm:right-6 sm:w-80 sm:h-16'
          : 'inset-4 md:bottom-6 md:right-6 md:top-auto md:left-auto md:w-96 md:h-[500px] lg:w-[420px] lg:h-[550px]'
      } bg-slate-800 rounded-lg shadow-2xl border border-slate-700`}
      style={{ zIndex: 9999 }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] rounded-t-lg">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-white rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-[#3db2ff]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">Zonke Assistant</h3>
              {!isMinimized && (
                <p className="text-white/80 text-xs hidden sm:block">Always here to help</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hidden md:block"
              aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onToggle}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ 
              height: 'calc(100% - 140px)', // Adjust for header and input
              maxHeight: 'calc(100vh - 200px)' // Ensure it doesn't exceed viewport
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-[#3db2ff]' 
                        : 'bg-gradient-to-r from-[#00c9a7] to-[#3db2ff]'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg p-2 sm:p-3 ${
                      message.type === 'user'
                        ? 'bg-[#3db2ff] text-white'
                        : message.error 
                          ? 'bg-red-900/20 border border-red-600 text-red-300'
                          : 'bg-slate-700 text-[#cbd5e1]'
                    }`}>
                      {message.error && (
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <span className="text-xs text-red-400">Connection Error</span>
                        </div>
                      )}
                      <div className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[90%] sm:max-w-[85%]">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#00c9a7] to-[#3db2ff] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="bg-slate-700 rounded-lg p-2 sm:p-3">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3db2ff] rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3db2ff] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3db2ff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* API Error Banner */}
            {apiError && (
              <div className="px-3 sm:px-4 py-2 bg-red-900/20 border-t border-red-600">
                <div className="flex items-center space-x-2 text-red-400 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>API Connection Issue: {apiError}</span>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800 rounded-b-lg">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Zonke Hub..."
                  className="flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none text-xs sm:text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-md transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex-shrink-0 flex items-center justify-center"
                >
                  {isTyping ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
              
              {/* Quick suggestions - Hide on very small screens */}
              <div className="mt-2 flex flex-wrap gap-1 hidden sm:flex">
                {[
                  "How does it work?",
                  "Is it free?",
                  "How to register?",
                  "Safety features?"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-[#cbd5e1] px-2 py-1 rounded transition-colors"
                    disabled={isTyping}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              
              {/* Mobile quick suggestions - Show only on small screens */}
              <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                {[
                  "How it works?",
                  "Free?",
                  "Register?",
                  "Safe?"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-[#cbd5e1] px-2 py-1 rounded transition-colors"
                    disabled={isTyping}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}