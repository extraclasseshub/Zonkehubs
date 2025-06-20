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
  // ... [rest of the code remains unchanged until the handleScroll function]

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

  // ... [rest of the code remains unchanged]

  return (
    // ... [rest of the JSX remains unchanged]
  );
}