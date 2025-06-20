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

  // Dappier API configuration - Replace with your actual API key
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fallback responses for common questions about Zonke Hub
  const getFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('how') && (message.includes('work') || message.includes('it work'))) {
      return "Zonke Hub is simple to use! As a customer, you can search for local service providers by location and service type, view their profiles, ratings, and portfolios, then contact them directly through our platform. Service providers can create profiles, showcase their work, set their service areas, and connect with potential customers. Everything is free to use!";
    }
    
    if (message.includes('free') || message.includes('cost') || message.includes('price')) {
      return "Yes, Zonke Hub is completely free! There are no fees for customers to search and contact service providers, and no fees for service providers to create profiles and connect with customers. We believe in making local services accessible to everyone.";
    }
    
    if (message.includes('register') || message.includes('sign up') || message.includes('account')) {
      return "Getting started is easy! Click the 'Sign Up' button and choose whether you're looking for services (User account) or offering services (Provider account). You'll just need to provide basic information like your name, email, and location. Providers can then add details about their services, upload portfolio images, and set their service areas.";
    }
    
    if (message.includes('safe') || message.includes('security') || message.includes('trust')) {
      return "Your safety is our priority! Zonke Hub features a comprehensive rating and review system so you can see feedback from other customers. All service providers have verified profiles, and our built-in messaging system lets you communicate safely before meeting. We also provide multiple contact options so you can choose how to connect.";
    }
    
    if (message.includes('service') && (message.includes('type') || message.includes('kind') || message.includes('what'))) {
      return "Zonke Hub connects you with a wide variety of local service providers including: plumbers, electricians, barbers, hair stylists, cleaners, gardeners, handymen, tutors, fitness trainers, photographers, and many more! If you need a local service, chances are you'll find the right professional on our platform.";
    }
    
    if (message.includes('location') || message.includes('area') || message.includes('radius')) {
      return "Zonke Hub uses location-based matching to connect you with nearby service providers. You can search by your specific location, and service providers can set their preferred work radius. This ensures you find professionals who actually serve your area and can respond quickly to your needs.";
    }
    
    if (message.includes('contact') || message.includes('message') || message.includes('communicate')) {
      return "You can contact service providers through our secure built-in messaging system, or use the phone and email contact options provided on their profiles. Our messaging system is great for discussing details, sharing photos, and getting quotes before deciding to hire someone.";
    }
    
    if (message.includes('rating') || message.includes('review') || message.includes('feedback')) {
      return "Our rating system helps you make informed decisions! Customers can rate service providers from 1-5 stars and leave detailed written reviews about their experience. You can see the overall rating, number of reviews, and read specific feedback to help choose the right professional for your needs.";
    }
    
    if (message.includes('provider') && (message.includes('become') || message.includes('join') || message.includes('offer'))) {
      return "Becoming a service provider on Zonke Hub is free and easy! Sign up for a Provider account, complete your profile with your services, experience, and portfolio images. Set your service area and availability, then start connecting with customers in your area. You'll have access to our messaging system and can build your reputation through customer reviews.";
    }
    
    if (message.includes('help') || message.includes('support') || message.includes('problem')) {
      return "I'm here to help! You can ask me about how Zonke Hub works, how to find services, how to become a provider, our safety features, pricing, and much more. If you have a specific question about using the platform, feel free to ask and I'll do my best to provide helpful information.";
    }
    
    if (message.includes('thank') || message.includes('thanks')) {
      return "You're welcome! I'm always here to help you make the most of Zonke Hub. Whether you're looking for services or want to offer your own, feel free to ask if you have any other questions about our platform.";
    }
    
    // Default response for unmatched queries
    return "Thanks for your question! I understand you're looking for information about Zonke Hub. While I may not have a specific answer for that exact question, I can tell you that Zonke Hub is a free platform connecting customers with local service providers across South Africa. You can search for services by location, view provider profiles and ratings, and contact them directly. Is there something specific about finding services, becoming a provider, or using our platform that I can help you with?";
  };

  // Get response from Dappier API
  const getOpenRouterResponse = async (userMessage: string): Promise<string> => {
    try {
      if (!OPENROUTER_API_KEY) {
        // Return fallback response immediately if no API key
        return getFallbackResponse(userMessage);
      }
      
      setApiError(null);
      
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Zonke Hub Assistant',
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
          model: 'openai/gpt-3.5-turbo',
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
      console.error('OpenRouter API error:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Re-throw error to be handled in handleSendMessage
      throw error;
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
      // Get response from OpenRouter API
      const responseContent = await getOpenRouterResponse(userMessage.content);
      
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantResponse]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Use fallback response instead of error message to maintain conversation flow
      const fallbackResponse = getFallbackResponse(userMessage.content);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
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
                  <span>Using offline mode - I can still help with general questions about Zonke Hub</span>
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