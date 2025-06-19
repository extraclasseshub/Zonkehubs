import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage, User } from '../../types';
import { MessageCircle, User as UserIcon, Clock, Send, Search, Loader2, Bell, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Conversation {
  user: User;
  lastMessage: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
}

export default function ProviderMessages() {
  const { user, getUserById, sendMessage, markMessagesAsRead } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshConversations = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      // Get all messages where this provider is involved
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation (unique user pairs)
      const conversationMap = new Map<string, ChatMessage[]>();
      
      messages.forEach(msg => {
        const chatMessage: ChatMessage = {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          read: msg.read,
        };

        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, []);
        }
        conversationMap.get(otherUserId)!.push(chatMessage);
      });

      // Create conversation objects
      const conversationList: Conversation[] = [];
      for (const [userId, messages] of conversationMap) {
        const otherUser = await getUserById(userId);
        if (otherUser) {
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          const unreadCount = messages.filter(msg => 
            msg.senderId === userId && msg.receiverId === user.id && !msg.read
          ).length;

          conversationList.push({
            user: otherUser,
            lastMessage,
            unreadCount,
            messages: sortedMessages,
          });
        }
      }

      // Sort by last message timestamp
      conversationList.sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );

      setConversations(conversationList);

      // Update selected conversation if it exists - use user ID for comparison
      if (selectedConversation) {
        const updatedSelected = conversationList.find(conv => 
          conv.user.id === selectedConversation.user.id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        } else {
          // If the selected conversation no longer exists, clear it
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [user]);

  // Set up polling for new messages (every 10 seconds)
  useEffect(() => {
    intervalRef.current = setInterval(refreshConversations, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    console.log('💬 Selecting conversation with user:', conversation.user.id, conversation.user.name);
    
    // Clear any existing selection first
    setSelectedConversation(null);
    
    // Set the new selection
    setTimeout(() => {
      setSelectedConversation(conversation);
    }, 50);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation.user.id, user!.id);
      // Refresh conversations after a short delay to update unread count
      setTimeout(refreshConversations, 500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSendingMessage(true);
    try {
      await sendMessage(selectedConversation.user.id, newMessage.trim());
      setNewMessage('');

      // Immediately refresh conversations to show the new message
      setTimeout(refreshConversations, 200);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUserClick = (clickedUser: User) => {
    console.log('👤 User clicked:', clickedUser.name);
    // For now, just show an alert with user info since we don't have a user profile modal
    // In a full implementation, you'd create a UserModal component similar to ProviderModal
    alert(`User: ${clickedUser.name}\nEmail: ${clickedUser.email}\nRole: ${clickedUser.role}`);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">Customer Messages</h3>
              {totalUnreadCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Bell className="h-4 w-4 text-[#3db2ff] animate-pulse" />
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {totalUnreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {loading && conversations.length === 0 ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 text-[#3db2ff] mx-auto mb-4 animate-spin" />
              <p className="text-[#cbd5e1]">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#cbd5e1] mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">
                {conversations.length === 0 
                  ? "When customers message you, they'll appear here"
                  : "No conversations match your search"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <button
                  key={`conversation-${conversation.user.id}`}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-slate-700 transition-colors relative ${
                    selectedConversation?.user.id === conversation.user.id 
                      ? 'bg-slate-700 border-r-2 border-[#3db2ff]' 
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#3db2ff] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(conversation.user);
                        }}
                      >
                        <UserIcon className="h-5 w-5 text-gray-300" />
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p 
                          className={`font-medium truncate cursor-pointer hover:text-[#3db2ff] transition-colors ${
                            conversation.unreadCount > 0 ? 'text-white' : 'text-[#cbd5e1]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(conversation.user);
                          }}
                        >
                          {conversation.user.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-[#3db2ff] text-white text-xs px-2 py-1 rounded-full animate-pulse">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-[#cbd5e1]'
                        }`}>
                          {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                        <div className="flex items-center space-x-1 ml-2">
                          {conversation.lastMessage.senderId === user?.id && (
                            conversation.lastMessage.read ? (
                              <CheckCircle2 className="h-3 w-3 text-[#00c9a7]" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#3db2ff] mt-1">Customer</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-slate-800 rounded-lg flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#3db2ff] transition-all"
                  onClick={() => handleUserClick(selectedConversation.user)}
                >
                  <UserIcon className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <h4 
                    className="text-white font-semibold cursor-pointer hover:text-[#3db2ff] transition-colors"
                    onClick={() => handleUserClick(selectedConversation.user)}
                  >
                    {selectedConversation.user.name}
                  </h4>
                  <p className="text-sm text-[#3db2ff]">Customer</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-[#3db2ff] text-white'
                        : 'bg-slate-700 text-[#cbd5e1]'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.senderId === user?.id ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      {message.senderId === user?.id && (
                        <div className="ml-2">
                          {message.read ? (
                            <CheckCircle2 className="h-3 w-3 text-blue-100" />
                          ) : (
                            <Circle className="h-3 w-3 text-blue-200" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-lg">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
              <p className="text-[#cbd5e1]">
                Choose a conversation from the left to start messaging with customers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}