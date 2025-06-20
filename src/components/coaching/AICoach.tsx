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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'goals'>('chat');
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: CoachingMessage = {
      id: '1',
      type: 'coach',
      content: `Hello ${provider.business_name || 'there'}! I'm your AI business coach. I'm here to help you grow your service business, improve customer satisfaction, and increase your revenue. What would you like to work on today?`,
      timestamp: new Date(),
      category: 'business'
    };
    setMessages([welcomeMessage]);

    // Generate initial insights
    generateBusinessInsights();
  }, [provider]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll, isUserScrolling]);

  const generateBusinessInsights = () => {
    const mockInsights: BusinessInsight[] = [
      {
        id: '1',
        title: 'Optimize Your Response Time',
        description: 'Customers who receive responses within 1 hour are 7x more likely to book your services.',
        category: 'opportunity',
        icon: MessageSquare,
        priority: 'high',
        actionable: true
      },
      {
        id: '2',
        title: 'Strong Rating Performance',
        description: `Your ${provider.rating}/5 rating is above average. Keep up the excellent work!`,
        category: 'success',
        icon: Star,
        priority: 'medium',
        actionable: false
      },
      {
        id: '3',
        title: 'Expand Service Portfolio',
        description: 'Consider adding complementary services to increase average order value.',
        category: 'opportunity',
        icon: TrendingUp,
        priority: 'medium',
        actionable: true
      }
    ];
    setInsights(mockInsights);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: CoachingMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const coachResponse: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: generateCoachResponse(inputMessage),
        timestamp: new Date(),
        category: 'business',
        actionItems: generateActionItems(inputMessage)
      };
      setMessages(prev => [...prev, coachResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateCoachResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('pricing') || input.includes('price')) {
      return "Great question about pricing! Here are some strategies: 1) Research competitor pricing in your area, 2) Consider value-based pricing rather than just cost-plus, 3) Offer tiered service packages, 4) Don't compete solely on price - emphasize your unique value proposition. Would you like me to help you analyze your current pricing strategy?";
    }
    
    if (input.includes('marketing') || input.includes('customers')) {
      return "Marketing is crucial for growth! Focus on: 1) Building a strong online presence with professional photos, 2) Encouraging satisfied customers to leave reviews, 3) Using social media to showcase your work, 4) Networking with other local businesses for referrals. What's your current biggest marketing challenge?";
    }
    
    if (input.includes('time') || input.includes('schedule')) {
      return "Time management is key to scaling your business! Try: 1) Blocking similar tasks together, 2) Using scheduling software to reduce back-and-forth, 3) Setting clear boundaries with clients, 4) Automating repetitive tasks where possible. What part of your schedule feels most chaotic right now?";
    }
    
    return "That's an interesting point! Based on your business profile, I'd recommend focusing on building strong customer relationships and consistently delivering quality service. This leads to repeat business and referrals, which are the most cost-effective ways to grow. What specific aspect of your business would you like to improve first?";
  };

  const generateActionItems = (userInput: string): string[] => {
    const input = userInput.toLowerCase();
    
    if (input.includes('pricing')) {
      return [
        "Research 3 competitor prices in your area",
        "Calculate your true hourly costs including overhead",
        "Create 3 service package options"
      ];
    }
    
    if (input.includes('marketing')) {
      return [
        "Update your profile with professional photos",
        "Ask your last 3 customers for reviews",
        "Post one piece of content on social media this week"
      ];
    }
    
    return [
      "Identify your top business priority for this month",
      "Set aside 30 minutes daily for business development",
      "Track one key metric to measure progress"
    ];
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Mark as user scrolling
      setIsUserScrolling(true);
      
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      setShouldAutoScroll(isAtBottom);
      
      // Reset user scrolling flag after delay
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return Target;
      case 'marketing': return TrendingUp;
      case 'customer-service': return Users;
      case 'pricing': return BarChart3;
      case 'growth': return Lightbulb;
      default: return Bot;
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'performance': return BarChart3;
      case 'opportunity': return TrendingUp;
      case 'warning': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (category: string) => {
    switch (category) {
      case 'performance': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'opportunity': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Business Coach</h2>
            <p className="text-indigo-100">Personalized guidance for your service business</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'goals', label: 'Goals', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="h-96">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((message) => {
                const CategoryIcon = getCategoryIcon(message.category || 'business');
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.type === 'coach' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-1 bg-indigo-100 rounded-full">
                            <Bot className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">AI Coach</span>
                          {message.category && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <CategoryIcon className="w-3 h-3" />
                              <span className="capitalize">{message.category}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.actionItems && message.actionItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-2">Action Items:</p>
                            <ul className="space-y-1">
                              {message.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start space-x-2 text-xs">
                                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-600">AI Coach is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about pricing, marketing, time management, or anything else..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Refresh Analysis
              </button>
            </div>
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${getInsightColor(insight.category)}`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {insight.priority} priority
                        </span>
                      </div>
                      <p className="text-sm mt-1 opacity-90">{insight.description}</p>
                      {insight.actionable && (
                        <button className="flex items-center space-x-1 text-sm font-medium mt-2 hover:underline">
                          <span>Take Action</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="p-6 space-y-4 overflow-y-auto h-full">
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Goal Tracking</h3>
              <p className="text-gray-600 mb-4">Set and track your business goals with AI guidance</p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Set Your First Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}