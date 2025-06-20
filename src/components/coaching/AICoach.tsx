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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
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
    generateInsights();
  }, [provider]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll, isUserScrolling]);

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

  const generateInsights = () => {
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

    // Simulate AI response
    setTimeout(() => {
      const coachResponse: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: generateCoachResponse(inputMessage),
        timestamp: new Date(),
        category: 'business',
        actionItems: [
          'Review your current pricing strategy',
          'Update your service descriptions',
          'Follow up with recent customers'
        ]
      };
      setMessages(prev => [...prev, coachResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateCoachResponse = (userInput: string): string => {
    const responses = [
      "That's a great question! Based on your service type and current performance, I'd recommend focusing on customer retention. Studies show that increasing customer retention by just 5% can increase profits by 25-95%.",
      "I understand your concern. Let's break this down into actionable steps. First, analyze your top-performing services and identify what makes them successful. Then, apply those insights to underperforming areas.",
      "Excellent point! Your business has strong fundamentals. To take it to the next level, consider implementing a customer feedback system and using those insights to refine your service delivery.",
      "That's a common challenge many service providers face. I suggest starting with small, measurable improvements. Track your response times, follow up consistently, and always exceed customer expectations."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return BarChart3;
      case 'opportunity': return Target;
      case 'warning': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Lightbulb;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'text-blue-600 bg-blue-50';
      case 'opportunity': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Business Coach</h1>
            <p className="text-indigo-100">Personalized guidance for your service business</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Growth Potential</span>
            </div>
            <p className="text-2xl font-bold">High</p>
            <p className="text-sm text-indigo-100">Based on your performance</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">Customer Satisfaction</span>
            </div>
            <p className="text-2xl font-bold">{provider.rating}/5</p>
            <p className="text-sm text-indigo-100">{provider.review_count} reviews</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="font-medium">Business Health</span>
            </div>
            <p className="text-2xl font-bold">Excellent</p>
            <p className="text-sm text-indigo-100">Keep up the great work!</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'chat', label: 'AI Chat', icon: MessageSquare },
          { id: 'insights', label: 'Business Insights', icon: Lightbulb },
          { id: 'goals', label: 'Growth Goals', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto p-6 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type === 'coach' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-600">AI Coach</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  
                  {message.actionItems && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {message.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2 text-xs">
                            <ArrowRight className="w-3 h-3 mt-0.5 text-indigo-600 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-600">AI Coach is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your AI coach anything about growing your business..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(insight.category)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    {insight.actionable && (
                      <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium">
                        <Zap className="w-4 h-4" />
                        <span>Take Action</span>
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Growth Goals Coming Soon</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We're working on personalized growth goals and tracking features to help you achieve your business objectives.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}