import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Smart response system
  const getAssistantResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! Welcome to Zonke Hub. I'm here to help you navigate our platform. Are you looking to find services or offer your own services?";
    }
    
    // How it works
    if (message.includes('how') && (message.includes('work') || message.includes('use'))) {
      return "Zonke Hub works in two ways:\n\n**For Service Seekers:**\n1. Create a user account\n2. Search for services by type and location\n3. View provider profiles, ratings, and reviews\n4. Contact providers directly via chat, phone, or email\n\n**For Service Providers:**\n1. Register as a provider\n2. Complete your business profile with photos\n3. Publish your profile to be visible to customers\n4. Receive inquiries and build your reputation through reviews";
    }
    
    // Registration questions
    if (message.includes('register') || message.includes('sign up') || message.includes('account')) {
      return "Registration is easy! Click the 'Login / Register' button and choose:\n\n• **User Account** - if you're looking for services\n• **Provider Account** - if you want to offer services\n\nYou'll need to provide your name, email, and create a password. Provider accounts require additional business information to complete your profile.";
    }
    
    // Services questions
    if (message.includes('service') && (message.includes('type') || message.includes('available') || message.includes('offer'))) {
      return "We support a wide range of services including:\n\n• **Home Services:** Plumbing, Electrical, Cleaning, Carpentry, Painting\n• **Personal Services:** Barbering, Fitness Training, Tutoring\n• **Professional Services:** IT Support, Photography, Catering\n• **Outdoor Services:** Gardening, Auto Repair\n\nProviders can offer any legitimate service - just specify your service type when creating your profile!";
    }
    
    // Pricing questions
    if (message.includes('cost') || message.includes('price') || message.includes('fee') || message.includes('pay')) {
      return "Zonke Hub is **completely free** for both users and service providers! There are no subscription fees, listing fees, or commission charges.\n\nService providers set their own prices and handle payments directly with customers. We simply connect you - the rest is up to you!";
    }
    
    // Safety and trust
    if (message.includes('safe') || message.includes('trust') || message.includes('verify') || message.includes('reliable')) {
      return "Your safety is our priority:\n\n• **Verified Profiles:** All providers must complete detailed profiles\n• **Rating System:** Real customer reviews and ratings\n• **Direct Communication:** Chat with providers before hiring\n• **Transparent Information:** View provider details, portfolio, and contact info\n\nWe recommend always communicating through our platform initially and checking reviews before hiring any service provider.";
    }
    
    // Location and radius
    if (message.includes('location') || message.includes('area') || message.includes('radius') || message.includes('distance')) {
      return "Our location-based matching helps you find nearby providers:\n\n• **Search by Location:** Enter your area or address\n• **Service Radius:** Each provider sets their service area (5-50km)\n• **Distance Filtering:** Adjust search radius to find providers within your preferred distance\n\nThis ensures you find providers who can actually serve your location efficiently!";
    }
    
    // Reviews and ratings
    if (message.includes('review') || message.includes('rating') || message.includes('feedback')) {
      return "Our review system builds trust in the community:\n\n• **5-Star Rating System:** Rate providers from 1-5 stars\n• **Written Reviews:** Share detailed feedback about your experience\n• **Verified Reviews:** Only customers who've contacted providers can leave reviews\n• **Edit/Delete:** You can update or remove your own reviews\n• **Top Rated:** Best providers are featured on the homepage\n\nHonest reviews help everyone make better decisions!";
    }
    
    // Communication and messaging
    if (message.includes('chat') || message.includes('message') || message.includes('contact') || message.includes('communicate')) {
      return "Multiple ways to connect with service providers:\n\n• **Built-in Chat:** Secure messaging system within the platform\n• **Phone Calls:** Direct phone numbers (if provided)\n• **Email:** Contact via email addresses\n• **Real-time Messaging:** Instant notifications for new messages\n\nStart with our chat system to discuss your needs, then move to phone/email for detailed planning!";
    }
    
    // Provider profile questions
    if (message.includes('profile') && (message.includes('complete') || message.includes('create') || message.includes('setup'))) {
      return "Creating a strong provider profile:\n\n**Required Information:**\n• Service type and description\n• Service area and radius\n• Contact information\n• Profile picture\n\n**Optional but Recommended:**\n• Business name (if applicable)\n• Phone number\n• Work portfolio photos\n• Detailed service description\n\n**Publishing:** Once complete, publish your profile to appear in search results!";
    }
    
    // Getting started
    if (message.includes('start') || message.includes('begin') || message.includes('first')) {
      return "Getting started is simple:\n\n**Looking for Services?**\n1. Click 'Login / Register' → Choose 'User'\n2. Browse featured providers or use search\n3. Contact providers that interest you\n\n**Offering Services?**\n1. Click 'Login / Register' → Choose 'Provider'\n2. Complete your business profile\n3. Add photos and publish your profile\n4. Start receiving customer inquiries!\n\nNeed help with any specific step?";
    }
    
    // Technical support
    if (message.includes('problem') || message.includes('issue') || message.includes('bug') || message.includes('error')) {
      return "I'm sorry you're experiencing issues! Here are some quick fixes:\n\n• **Refresh the page** - solves most temporary issues\n• **Clear browser cache** - helps with loading problems\n• **Check internet connection** - ensure stable connectivity\n• **Try different browser** - compatibility issues\n\nIf problems persist, please note the specific error message and contact our support team. What specific issue are you encountering?";
    }
    
    // Business questions
    if (message.includes('business') || message.includes('company') || message.includes('individual')) {
      return "We welcome both individual providers and businesses:\n\n**Individual Providers:**\n• Solo professionals (plumbers, tutors, etc.)\n• Freelancers and independent contractors\n• Personal service providers\n\n**Business Providers:**\n• Companies with multiple employees\n• Established service businesses\n• Teams and partnerships\n\nBoth types can create profiles and offer services. Just select the appropriate business type during registration!";
    }
    
    // Portfolio and photos
    if (message.includes('photo') || message.includes('portfolio') || message.includes('image') || message.includes('picture')) {
      return "Visual content helps build trust:\n\n**Profile Picture:**\n• Professional headshot or business logo\n• Required for publishing your profile\n• First impression for potential customers\n\n**Work Portfolio:**\n• Upload photos of completed projects\n• Show before/after transformations\n• Demonstrate quality and style\n• Multiple images recommended\n\n**Tips:** Use high-quality, well-lit photos that showcase your best work!";
    }
    
    // Search and discovery
    if (message.includes('search') || message.includes('find') || message.includes('discover')) {
      return "Finding the right provider is easy:\n\n**Search Methods:**\n• **Keyword Search:** Enter service type (e.g., 'plumber')\n• **Location Filter:** Specify your area\n• **Radius Selection:** Choose distance preference\n• **Browse Categories:** Click service type buttons\n\n**Results Show:**\n• Provider ratings and reviews\n• Service area and distance\n• Profile photos and portfolios\n• Contact information\n\n**Sorting:** Results are sorted by rating, then by newest providers.";
    }
    
    // Default helpful response
    const helpfulResponses = [
      "I'd be happy to help! Could you be more specific about what you'd like to know? I can explain how Zonke Hub works, help with registration, or answer questions about finding/offering services.",
      "Great question! I can help you with information about our platform, how to get started, pricing, safety features, or any other aspect of Zonke Hub. What would you like to know more about?",
      "I'm here to assist! Whether you're looking to find services or offer your own, I can guide you through the process. What specific information would be most helpful for you?",
      "Thanks for asking! I can explain how our platform works, help you understand the registration process, or answer questions about safety, pricing, and features. What interests you most?",
      "I'd love to help you learn more about Zonke Hub! I can cover topics like how to find services, how to become a provider, our review system, messaging features, and much more. What would you like to explore?"
    ];
    
    return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
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

    // Simulate typing delay for more natural feel
    setTimeout(() => {
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getAssistantResponse(userMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
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
                        : 'bg-slate-700 text-[#cbd5e1]'
                    }`}>
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