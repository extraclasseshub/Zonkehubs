import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceProvider } from '../../types';
import { 
  Bot, 
  Send, 
  Loader2, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  BarChart3, 
  Users, 
  Star, 
  MessageSquare, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';
import { ChevronDown } from 'lucide-react';

interface CoachingMessage {
  id: string;
  type: 'user' | 'coach';
  content: string;
  timestamp: Date;
  category?: 'business' | 'marketing' | 'customer-service' | 'pricing' | 'growth';
  actionItems?: string[];
}

interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'opportunity' | 'warning' | 'success';
  icon: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface AICoachProps {
  provider: ServiceProvider;
}

export default function AICoach({ provider }: AICoachProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'goals'>('chat');
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // OpenRouter API configuration
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  useEffect(() => {
    // Initialize with welcome message and business insights
    initializeCoach();
    generateBusinessInsights();
    // Mark as initialized after a brief delay to prevent initial scroll
    setTimeout(() => setIsInitialized(true), 100);
  }, [provider]);

  useEffect(() => {
    // Only auto-scroll if component is initialized and other conditions are met
    if (isInitialized && shouldAutoScroll && messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      
      // Only scroll if user is near bottom, but never on initial load
      if (isNearBottom && messages.length > 1) {
        scrollToBottom();
      }
    }
  }, [messages, shouldAutoScroll, isInitialized]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll events to determine if user is manually scrolling
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      setShouldAutoScroll(isAtBottom);
    }
  };

  const initializeCoach = () => {
    const welcomeMessage: CoachingMessage = {
      id: '1',
      type: 'coach',
      content: `Hello ${provider.name}! I'm your AI Business Coach, here to help you grow your ${provider.serviceType} business. I've analyzed your profile and I'm ready to provide personalized advice on improving your services, attracting more customers, and increasing your revenue. What would you like to work on today?`,
      timestamp: new Date(),
      category: 'business',
      actionItems: [
        'Review your current business performance',
        'Optimize your service offerings',
        'Improve customer satisfaction',
        'Develop marketing strategies'
      ]
    };
    setMessages([welcomeMessage]);
  };

  const generateBusinessInsights = () => {
    const businessInsights: BusinessInsight[] = [
      {
        id: '1',
        title: 'Profile Completion',
        description: provider.isPublished 
          ? 'Your profile is published and visible to customers!' 
          : 'Complete and publish your profile to increase visibility by up to 300%',
        category: provider.isPublished ? 'success' : 'warning',
        icon: CheckCircle,
        priority: provider.isPublished ? 'low' : 'high',
        actionable: !provider.isPublished
      },
      {
        id: '2',
        title: 'Customer Reviews',
        description: provider.reviewCount > 0 
          ? `You have ${provider.reviewCount} reviews with an average rating of ${provider.rating}/5` 
          : 'Getting your first customer review can increase bookings by 70%',
        category: provider.reviewCount > 0 ? 'success' : 'opportunity',
        icon: Star,
        priority: provider.reviewCount > 0 ? 'low' : 'high',
        actionable: provider.reviewCount === 0
      },
      {
        id: '3',
        title: 'Service Portfolio',
        description: provider.workPortfolio && provider.workPortfolio.length > 0
          ? `You have ${provider.workPortfolio.length} portfolio images showcasing your work`
          : 'Adding portfolio images can increase customer inquiries by 85%',
        category: provider.workPortfolio && provider.workPortfolio.length > 0 ? 'success' : 'opportunity',
        icon: Award,
        priority: 'medium',
        actionable: !provider.workPortfolio || provider.workPortfolio.length === 0
      },
      {
        id: '4',
        title: 'Business Hours',
        description: provider.availability && Object.keys(provider.availability).length > 0
          ? 'Your availability schedule is set up for customer convenience'
          : 'Setting clear business hours helps customers know when to contact you',
        category: provider.availability && Object.keys(provider.availability).length > 0 ? 'success' : 'opportunity',
        icon: Calendar,
        priority: 'medium',
        actionable: !provider.availability || Object.keys(provider.availability).length === 0
      },
      {
        id: '5',
        title: 'Market Positioning',
        description: 'Analyze your competitive advantage and unique value proposition',
        category: 'opportunity',
        icon: TrendingUp,
        priority: 'medium',
        actionable: true
      }
    ];

    setInsights(businessInsights);
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
      }

      const systemPrompt = `You are an expert business coach specializing in helping service providers grow their businesses. You're coaching ${provider.name}, who provides ${provider.serviceType} services.

Provider Details:
- Business Type: ${provider.businessType}
- Service Type: ${provider.serviceType}
- Experience: ${provider.yearsExperience || 0} years
- Rating: ${provider.rating || 0}/5 (${provider.reviewCount || 0} reviews)
- Published: ${provider.isPublished ? 'Yes' : 'No'}
- Location: ${provider.location.address}
- Service Radius: ${provider.workRadius}km
- Portfolio Items: ${provider.workPortfolio?.length || 0}
- Specialties: ${provider.specialties?.join(', ') || 'None listed'}
- Certifications: ${provider.certifications?.join(', ') || 'None listed'}

Provide specific, actionable business advice. Focus on:
1. Practical strategies for growth
2. Customer acquisition and retention
3. Service quality improvement
4. Pricing optimization
5. Marketing and online presence
6. Operational efficiency

Keep responses conversational, encouraging, and under 200 words. Include specific action items when relevant.`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Zonke Hub AI Coach',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return getFallbackResponse(userMessage);
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('customer') || message.includes('client')) {
      return `Great question about customers! Here are some proven strategies: 1) Follow up within 24 hours of inquiries, 2) Ask satisfied customers for reviews, 3) Offer referral incentives, 4) Maintain consistent communication. Your ${provider.serviceType} business can benefit from building strong customer relationships through excellent service delivery and professional communication.`;
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('rate')) {
      return `Pricing strategy is crucial for your ${provider.serviceType} business. Consider: 1) Research competitor rates in ${provider.location.address}, 2) Factor in your ${provider.yearsExperience || 0} years of experience, 3) Include material costs and travel time, 4) Offer package deals for multiple services. Remember, competing on value rather than just price often leads to better long-term success.`;
    }
    
    if (message.includes('market') || message.includes('advertis') || message.includes('promot')) {
      return `Marketing your ${provider.serviceType} services effectively: 1) Optimize your Zonke Hub profile with clear descriptions and portfolio images, 2) Encourage satisfied customers to leave reviews, 3) Use social media to showcase your work, 4) Network with complementary service providers for referrals. Your ${provider.workRadius}km service area gives you a good local market to focus on.`;
    }
    
    if (message.includes('grow') || message.includes('expand') || message.includes('scale')) {
      return `To grow your ${provider.serviceType} business: 1) Focus on service quality to generate repeat customers and referrals, 2) Consider expanding your service offerings within your expertise, 3) Build a strong online presence with portfolio examples, 4) Develop systems for efficient scheduling and customer communication. With ${provider.reviewCount || 0} reviews so far, building your reputation should be a priority.`;
    }
    
    return `That's a great question about your ${provider.serviceType} business! Based on your profile, I'd recommend focusing on: 1) Building your online presence and customer reviews, 2) Showcasing your work through portfolio images, 3) Optimizing your service area and availability, 4) Developing competitive pricing strategies. What specific aspect would you like to dive deeper into?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Enable auto-scroll when user sends a message
    setShouldAutoScroll(true);

    const userMessage: CoachingMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const responseContent = await getAIResponse(userMessage.content);
      
      const coachResponse: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: responseContent,
        timestamp: new Date(),
        category: 'business'
      };

      setMessages(prev => [...prev, coachResponse]);
    } catch (error) {
      console.error('Error getting coach response:', error);
      const errorResponse: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: "I'm experiencing some technical difficulties, but I'm still here to help! Let me provide some general business advice based on your profile...",
        timestamp: new Date(),
        category: 'business'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'text-blue-400';
      case 'opportunity': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-full p-3">
            <Brain className="h-8 w-8 text-[#3db2ff]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Business Coach</h2>
            <p className="text-white/90">Personalized guidance for your {provider.serviceType} business</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex">
          <button
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('chat');
            }}
            className={`flex-1 py-3 px-4 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-slate-700 text-[#3db2ff] border-b-2 border-[#3db2ff]'
                : 'text-[#cbd5e1] hover:text-white hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat Coach</span>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('insights');
            }}
            className={`flex-1 py-3 px-4 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-slate-700 text-[#3db2ff] border-b-2 border-[#3db2ff]'
                : 'text-[#cbd5e1] hover:text-white hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Business Insights</span>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('goals');
            }}
            className={`flex-1 py-3 px-4 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
              activeTab === 'goals'
                ? 'bg-slate-700 text-[#3db2ff] border-b-2 border-[#3db2ff]'
                : 'text-[#cbd5e1] hover:text-white hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Growth Goals</span>
            </div>
          </button>
        </nav>
        
        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden">
          <div className="relative">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 text-white rounded-t-lg"
            >
              <div className="flex items-center space-x-2">
                {activeTab === 'chat' && (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat Coach</span>
                  </>
                )}
                {activeTab === 'insights' && (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    <span>Business Insights</span>
                  </>
                )}
                {activeTab === 'goals' && (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Growth Goals</span>
                  </>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileNav ? 'rotate-180' : ''}`} />
            </button>

            {showMobileNav && (
              <div className="absolute top-full left-0 right-0 bg-slate-700 border-t border-slate-600 shadow-lg z-10">
                <button
                  onClick={() => { setActiveTab('chat'); setShowMobileNav(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors ${activeTab === 'chat' ? 'bg-slate-600 text-[#3db2ff]' : 'text-[#cbd5e1]'}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat Coach</span>
                </button>
                <button
                  onClick={() => { setActiveTab('insights'); setShowMobileNav(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors ${activeTab === 'insights' ? 'bg-slate-600 text-[#3db2ff]' : 'text-[#cbd5e1]'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Business Insights</span>
                </button>
                <button
                  onClick={() => { setActiveTab('goals'); setShowMobileNav(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors rounded-b-lg ${activeTab === 'goals' ? 'bg-slate-600 text-[#3db2ff]' : 'text-[#cbd5e1]'}`}
                >
                  <Target className="h-4 w-4" />
                  <span>Growth Goals</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-96 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ height: 'calc(100% - 140px)' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-[#3db2ff]' 
                        : 'bg-gradient-to-r from-[#00c9a7] to-[#3db2ff]'
                    }`}>
                      {message.type === 'user' ? (
                        <Users className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-[#3db2ff] text-white'
                        : 'bg-slate-700 text-[#cbd5e1]'
                    }`}>
                      <div className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </div>
                      {message.actionItems && (
                        <div className="mt-3 space-y-1">
                          {message.actionItems.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <ArrowRight className="h-3 w-3" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`text-xs mt-2 ${
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
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00c9a7] to-[#3db2ff] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#3db2ff] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#3db2ff] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#3db2ff] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask your AI coach anything about growing your business..."
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center"
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Quick suggestions */}
              <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto">
                {[
                  "How can I get more customers?",
                  "What should I charge for my services?",
                  "How do I improve my online presence?",
                  "Tips for better customer service?"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={(e) => {
                      e.preventDefault();
                      setInputMessage(suggestion);
                    }}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-[#cbd5e1] px-3 py-1 rounded-full transition-colors"
                    disabled={isTyping}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              
              {/* Mobile quick suggestions - Show only on small screens */}
              <div className="mt-2 flex flex-wrap gap-1 md:hidden">
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
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="h-6 w-6 text-[#3db2ff]" />
                <h3 className="text-xl font-semibold text-white">Business Performance Insights</h3>
              </div>
              
              {insights.map((insight) => (
                <div key={insight.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        insight.category === 'success' ? 'bg-green-500/20' :
                        insight.category === 'warning' ? 'bg-yellow-500/20' :
                        insight.category === 'opportunity' ? 'bg-blue-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        <insight.icon className={`h-5 w-5 ${getCategoryColor(insight.category)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-white">{insight.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(insight.priority)}`}>
                            {insight.priority}
                          </span>
                        </div>
                        <p className="text-[#cbd5e1] text-sm">{insight.description}</p>
                      </div>
                    </div>
                    {insight.actionable && (
                      <button className="bg-[#3db2ff] hover:bg-blue-500 text-white px-3 py-1 rounded text-xs transition-colors">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="h-6 w-6 text-[#00c9a7]" />
                <h3 className="text-xl font-semibold text-white">Growth Goals & Milestones</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">Customer Satisfaction</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#cbd5e1]">Current Rating</span>
                      <span className="text-white">{provider.rating || 0}/5</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((provider.rating || 0) / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">Goal: Maintain 4.5+ rating</p>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Customer Reviews</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#cbd5e1]">Total Reviews</span>
                      <span className="text-white">{provider.reviewCount || 0}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((provider.reviewCount || 0) / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">Goal: 50 reviews</p>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Award className="h-5 w-5 text-purple-400" />
                    <h4 className="font-semibold text-white">Portfolio Showcase</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#cbd5e1]">Portfolio Items</span>
                      <span className="text-white">{provider.workPortfolio?.length || 0}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((provider.workPortfolio?.length || 0) / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">Goal: 20 portfolio images</p>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-white">Business Growth</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#cbd5e1]">Profile Status</span>
                      <span className={`text-white ${provider.isPublished ? 'text-green-400' : 'text-yellow-400'}`}>
                        {provider.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: provider.isPublished ? '100%' : '50%' }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400">Goal: Maintain published status</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#3db2ff]/10 to-[#00c9a7]/10 border border-[#3db2ff]/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="h-5 w-5 text-[#3db2ff]" />
                  <h4 className="font-semibold text-white">Recommended Next Steps</h4>
                </div>
                <ul className="space-y-2 text-sm text-[#cbd5e1]">
                  {!provider.isPublished && (
                    <li className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-[#3db2ff]" />
                      <span>Complete and publish your profile to increase visibility</span>
                    </li>
                  )}
                  {(provider.reviewCount || 0) < 5 && (
                    <li className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-[#3db2ff]" />
                      <span>Focus on getting your first 5 customer reviews</span>
                    </li>
                  )}
                  {(!provider.workPortfolio || provider.workPortfolio.length < 5) && (
                    <li className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-[#3db2ff]" />
                      <span>Add more portfolio images to showcase your work quality</span>
                    </li>
                  )}
                  <li className="flex items-center space-x-2">
                    <ArrowRight className="h-3 w-3 text-[#3db2ff]" />
                    <span>Optimize your service description with relevant keywords</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}