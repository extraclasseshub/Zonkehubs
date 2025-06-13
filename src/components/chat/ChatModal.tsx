import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceProvider, ChatMessage } from '../../types';
import { X, Send, User, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChatModalProps {
  provider: ServiceProvider;
  onClose: () => void;
}

export default function ChatModal({ provider, onClose }: ChatModalProps) {
  const { user, sendMessage, markMessagesAsRead } = useAuth();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshConversation = async () => {
    if (user && !loading) {
      setLoading(true);
      try {
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${provider.id}),and(sender_id.eq.${provider.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching conversation:', error);
          return;
        }

        const chatMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          read: msg.read,
        }));

        setConversation(chatMessages);
        
        // Mark messages from provider as read
        await markMessagesAsRead(provider.id, user.id);
      } catch (error) {
        console.error('Error refreshing conversation:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshConversation();
  }, [user, provider.id]);

  // Set up polling for new messages (every 5 seconds)
  useEffect(() => {
    intervalRef.current = setInterval(refreshConversation, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, provider.id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setSendingMessage(true);
    try {
      await sendMessage(provider.id, message.trim());
      setMessage('');
      
      // Immediately refresh conversation to show the new message
      setTimeout(refreshConversation, 200);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl h-[90vh] sm:h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 bg-slate-900 rounded-t-lg">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt={provider.businessName || provider.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#3db2ff] flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {provider.businessName || provider.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#3db2ff] truncate">{provider.serviceType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700 flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-800 to-slate-900">
          {loading && conversation.length === 0 ? (
            <div className="text-center text-[#cbd5e1] py-8 sm:py-12">
              <Loader2 className="h-8 w-8 text-[#3db2ff] mx-auto mb-4 animate-spin" />
              <p className="text-sm sm:text-base">Loading conversation...</p>
            </div>
          ) : conversation.length === 0 ? (
            <div className="text-center text-[#cbd5e1] py-8 sm:py-12">
              <div className="bg-slate-700 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-[#3db2ff]" />
              </div>
              <p className="mb-2 text-sm sm:text-base font-medium">Start a conversation</p>
              <p className="text-xs sm:text-sm text-gray-400 px-4">
                Send a message to {provider.businessName || provider.name} to get started!
              </p>
            </div>
          ) : (
            conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[85%] sm:max-w-xs lg:max-w-md">
                  <div
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-lg ${
                      msg.senderId === user.id
                        ? 'bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-br-md'
                        : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                  <p className={`text-xs mt-1 px-2 ${
                    msg.senderId === user.id 
                      ? 'text-blue-200 text-right' 
                      : 'text-gray-500 text-left'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-700 bg-slate-900 rounded-b-lg">
          <div className="flex space-x-2 sm:space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendingMessage}
              placeholder="Type your message..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-2 focus:ring-[#3db2ff]/20 focus:outline-none text-sm sm:text-base transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendingMessage}
              className="bg-gradient-to-r from-[#3db2ff] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-full transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex-shrink-0 flex items-center justify-center"
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}