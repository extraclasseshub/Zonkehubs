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
  Sparkles,
  ChevronDown
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'goals'>('chat');
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: CoachingMessage = {
      id: '1',
      type: 'coach',
      content: `Hello ${provider.businessName || provider.name}! I'm your AI business coach. I'm here to help you grow your ${provider.serviceType} business, improve customer satisfaction, and increase your revenue. What would you like to work on today?`,
      timestamp: new Date(),
      category: 'business'
    };
    setMessages([welcomeMessage]);

    // Generate initial insights
    generateInsights();
  }, [provider]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const generateInsights = () => {
    const mockInsights: BusinessInsight[] = [
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
      }
    ];
    setInsights(mockInsights);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: CoachingMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response with random business advice
    setTimeout(() => {
      const coachResponse: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: generateCoachResponse(inputMessage),
        timestamp: new Date(),
        category: 'business',
        actionItems: generateActionItems()
      };
      setMessages(prev => [...prev, coachResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateCoachResponse = (userInput: string): string => {
    const responses = [
      `Great question about your ${provider.serviceType} business! Based on your current rating of ${provider.rating}/5, I'd recommend focusing on customer retention. Studies show that increasing customer retention by just 5% can increase profits by 25-95%.`,
      
      `That's an excellent point! For ${provider.serviceType} services, I suggest implementing a follow-up system. Contact customers 24-48 hours after service completion to ensure satisfaction and encourage reviews.`,
      
      `I understand your concern. Let's break this down: Your business in ${provider.location.address} has great potential. Consider expanding your service radius from ${provider.workRadius}km to capture more customers.`,
      
      `Excellent thinking! Your ${provider.businessType} approach is smart. To boost visibility, make sure your profile showcases your expertise. ${provider.workPortfolio?.length || 0} portfolio images is a good start, but aim for 10-15 for maximum impact.`,
      
      `That's a common challenge for ${provider.serviceType} providers. I recommend setting clear expectations upfront, providing detailed quotes, and always following through on promises. This builds trust and leads to repeat business.`,
      
      `Smart question! For your type of business, pricing strategy is crucial. Research competitors in ${provider.location.address}, factor in your ${provider.yearsExperience || 0} years of experience, and don't undervalue your expertise.`,
      
      `Good insight! Customer communication is key in the ${provider.serviceType} industry. Respond to inquiries within 2 hours when possible, and always be professional and helpful in your messaging.`,
      
      `That's a valuable observation! Building a strong online presence starts with your Zonke Hub profile. Make sure it's complete, professional, and showcases your best work. This is often the first impression potential customers have.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateActionItems = (): string[] => {
    const actionSets = [
      [
        'Update your service descriptions with specific details',
        'Add 3-5 new portfolio images this week',
        'Follow up with recent customers for reviews'
      ],
      [
        'Review and optimize your pricing strategy',
        'Expand your service area by 5km if feasible',
        'Create a customer follow-up checklist'
      ],
      [
        'Improve response time to under 2 hours',
        'Add professional certifications to your profile',
        'Schedule weekly business performance reviews'
      ],
      [
        'Research competitor pricing in your area',
        'Create templates for common customer inquiries',
        'Set up a customer feedback collection system'
      ]
    ];
    
    return actionSets[Math.floor(Math.random() * actionSets.length)];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'text-blue-400 bg-blue-900/20';
      case 'opportunity': return 'text-green-400 bg-green-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      case 'success': return 'text-emerald-400 bg-emerald-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
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

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'chat': return 'AI Chat';
      case 'insights': return 'Business Insights';
      case 'goals': return 'Growth Goals';
      default: return tab;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'chat': return MessageSquare;
      case 'insights': return Lightbulb;
      case 'goals': return Target;
      default: return MessageSquare;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white rounded-full p-2 sm:p-3">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-[#3db2ff]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">AI Business Coach</h2>
            <p className="text-white/90 text-sm sm:text-base">Personalized guidance for your {provider.serviceType} business</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700">
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex">
          {['chat', 'insights', 'goals'].map((tab) => {
            const Icon = getTabIcon(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 px-4 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-700 text-[#3db2ff] border-b-2 border-[#3db2ff]'
                    : 'text-[#cbd5e1] hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{getTabLabel(tab)}</span>
                  <span className="md:hidden">{tab === 'chat' ? 'Chat' : tab === 'insights' ? 'Insights' : 'Goals'}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Mobile Navigation Dropdown */}
        <div className="sm:hidden">
          <div className="relative">
            <button
              onClick={() => setShowMobileDropdown(!showMobileDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 text-white"
            >
              <div className="flex items-center space-x-2">
                {React.createElement(getTabIcon(activeTab), { className: "h-4 w-4" })}
                <span>{getTabLabel(activeTab)}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMobileDropdown && (
              <div className="absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-lg z-10">
                {['chat', 'insights', 'goals'].map((tab) => {
                  const Icon = getTabIcon(tab);
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab as any);
                        setShowMobileDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                        activeTab === tab ? 'bg-slate-700 text-[#3db2ff]' : 'text-[#cbd5e1]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{getTabLabel(tab)}</span>
                    </button>
                  );
                })}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          <p className="text-xs font-medium opacity-75">Action Items:</p>
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
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
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
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask your AI coach anything about growing your business..."
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Quick suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "How can I get more customers?",
                  "What should I charge?",
                  "Improve my profile?",
                  "Marketing tips?"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-[#cbd5e1] px-3 py-1 rounded-full transition-colors"
                    disabled={isLoading}
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
                      <div className={`p-2 rounded-lg ${getCategoryColor(insight.category)}`}>
                        <insight.icon className="h-5 w-5" />
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