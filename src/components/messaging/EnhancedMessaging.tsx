import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage, ServiceProvider, User } from '../../types';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Archive, 
  Trash2, 
  Star,
  Image,
  Paperclip,
  Smile,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  X,
  ArrowLeft,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Conversation {
  participant: User | ServiceProvider;
  lastMessage: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
  isStarred: boolean;
  isArchived: boolean;
}

interface EnhancedMessagingProps {
  chatWithUserId?: string | null;
  onClose?: () => void;
}

export default function EnhancedMessaging({ chatWithUserId, onClose }: EnhancedMessagingProps) {
  const { user, getUserById, sendMessage, markMessagesAsRead } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showParticipantInfo, setShowParticipantInfo] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const refreshConversations = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

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

      const conversationList: Conversation[] = [];
      for (const [userId, messages] of conversationMap) {
        const participant = await getUserById(userId);
        if (participant) {
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          const unreadCount = messages.filter(msg => 
            msg.senderId === userId && msg.receiverId === user.id && !msg.read
          ).length;

          conversationList.push({
            participant,
            lastMessage,
            unreadCount,
            messages: sortedMessages,
            isStarred: false, // TODO: Implement starring
            isArchived: false, // TODO: Implement archiving
          });
        }
      }

      conversationList.sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );

      setConversations(conversationList);

      if (selectedConversation) {
        const updatedSelected = conversationList.find(conv => 
          conv.participant.id === selectedConversation.participant.id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }

      // Auto-select conversation if chatWithUserId is provided
      if (chatWithUserId && !selectedConversation) {
        const targetConversation = conversationList.find(conv => 
          conv.participant.id === chatWithUserId
        );
        if (targetConversation) {
          setSelectedConversation(targetConversation);
        } else {
          // Create new conversation
          const participant = await getUserById(chatWithUserId);
          if (participant) {
            const newConversation: Conversation = {
              participant,
              lastMessage: {
                id: 'temp',
                senderId: user.id,
                receiverId: chatWithUserId,
                content: '',
                timestamp: new Date(),
                read: false,
              },
              unreadCount: 0,
              messages: [],
              isStarred: false,
              isArchived: false,
            };
            setSelectedConversation(newConversation);
          }
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
  }, [user, chatWithUserId]);

  useEffect(() => {
    intervalRef.current = setInterval(refreshConversations, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  // Improved scroll to bottom with better control
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      };
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [selectedConversation?.messages, shouldScrollToBottom]);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      setShouldScrollToBottom(isAtBottom);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowParticipantInfo(false);
    setShouldScrollToBottom(true); // Always scroll to bottom when selecting new conversation
    
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation.participant.id, user!.id);
      setTimeout(refreshConversations, 500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSendingMessage(true);
    setShouldScrollToBottom(true); // Scroll to bottom when sending message
    
    try {
      await sendMessage(selectedConversation.participant.id, newMessage.trim());
      setNewMessage('');
      setTimeout(refreshConversations, 200);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.senderId !== user?.id) return null;
    
    return message.read ? (
      <CheckCircle2 className="h-3 w-3 text-[#00c9a7]" title="Read" />
    ) : (
      <Circle className="h-3 w-3 text-gray-400" title="Sent" />
    );
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (messageFilter) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'starred':
        return matchesSearch && conv.isStarred;
      case 'archived':
        return matchesSearch && conv.isArchived;
      default:
        return matchesSearch && !conv.isArchived;
    }
  });

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="flex h-full bg-slate-900 rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 bg-slate-800 border-r border-slate-700`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-white">Messages</h2>
              {totalUnreadCount > 0 && (
                <span className="bg-[#3db2ff] text-white text-xs px-2 py-1 rounded-full">
                  {totalUnreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none text-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-slate-700 rounded-md p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'starred', label: 'Starred' },
              { key: 'archived', label: 'Archived' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setMessageFilter(filter.key as any)}
                className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                  messageFilter === filter.key
                    ? 'bg-[#3db2ff] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 text-[#3db2ff] mx-auto mb-4 animate-spin" />
              <p className="text-[#cbd5e1]">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#cbd5e1] mb-2">No conversations found</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Try adjusting your search' : 'Start a conversation to see it here'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.participant.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-3 text-left hover:bg-slate-700 transition-colors rounded-md ${
                    selectedConversation?.participant.id === conversation.participant.id 
                      ? 'bg-slate-700 border-l-2 border-[#3db2ff]' 
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      {(conversation.participant as any).profileImage ? (
                        <img
                          src={(conversation.participant as any).profileImage}
                          alt={conversation.participant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {conversation.participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-[#3db2ff] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium truncate ${
                          conversation.unreadCount > 0 ? 'text-white' : 'text-[#cbd5e1]'
                        }`}>
                          {conversation.participant.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          {conversation.isStarred && (
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-[#cbd5e1]'
                        }`}>
                          {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                          {conversation.lastMessage.content || 'Start a conversation'}
                        </p>
                        {conversation.lastMessage.senderId === user?.id && conversation.lastMessage.content && (
                          <div className="ml-2 flex-shrink-0">
                            {getMessageStatus(conversation.lastMessage)}
                          </div>
                        )}
                      </div>
                      
                      {conversation.participant.role === 'provider' && (
                        <p className="text-xs text-[#3db2ff] mt-1">
                          {(conversation.participant as ServiceProvider).serviceType}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-col flex-1 bg-slate-800`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  {(selectedConversation.participant as any).profileImage ? (
                    <img
                      src={(selectedConversation.participant as any).profileImage}
                      alt={selectedConversation.participant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {selectedConversation.participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-white font-semibold">
                      {selectedConversation.participant.name}
                    </h3>
                    {selectedConversation.participant.role === 'provider' && (
                      <p className="text-sm text-[#3db2ff]">
                        {(selectedConversation.participant as ServiceProvider).serviceType}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedConversation.participant.role === 'provider' && (selectedConversation.participant as ServiceProvider).phone && (
                    <button
                      onClick={() => window.open(`tel:${(selectedConversation.participant as ServiceProvider).phone}`)}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-700"
                      title="Call"
                    >
                      <Phone className="h-5 w-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowParticipantInfo(!showParticipantInfo)}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-700"
                    title="Info"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ scrollBehavior: 'smooth' }}
            >
              {selectedConversation.messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Start the conversation</h3>
                  <p className="text-[#cbd5e1] text-sm">
                    Send a message to {selectedConversation.participant.name} to get started!
                  </p>
                </div>
              ) : (
                selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col max-w-xs lg:max-w-md">
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-lg ${
                          message.senderId === user?.id
                            ? 'bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-br-md'
                            : 'bg-white text-slate-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      </div>
                      <div className={`flex items-center space-x-1 mt-1 px-2 ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.senderId === user?.id && (
                          <div className="ml-1">
                            {getMessageStatus(message)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-900 flex-shrink-0">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-2 focus:ring-[#3db2ff]/20 focus:outline-none transition-all disabled:opacity-50 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendingMessage}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-600"
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={sendingMessage}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-slate-600"
                        title="Add emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-gradient-to-r from-[#3db2ff] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all transform hover:scale-105 disabled:scale-100 shadow-lg flex-shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={(e) => {
                  // TODO: Implement file upload
                  console.log('File selected:', e.target.files?.[0]);
                }}
              />
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-[#cbd5e1]">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Participant Info Sidebar */}
      {showParticipantInfo && selectedConversation && (
        <div className="w-80 bg-slate-900 border-l border-slate-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Contact Info</h3>
            <button
              onClick={() => setShowParticipantInfo(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            {(selectedConversation.participant as any).profileImage ? (
              <img
                src={(selectedConversation.participant as any).profileImage}
                alt={selectedConversation.participant.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-medium">
                  {selectedConversation.participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h4 className="text-white font-semibold text-lg">
              {selectedConversation.participant.name}
            </h4>
            <p className="text-[#cbd5e1] text-sm">{selectedConversation.participant.email}</p>
          </div>

          {selectedConversation.participant.role === 'provider' && (
            <div className="space-y-4">
              <div>
                <h5 className="text-white font-medium mb-2">Service</h5>
                <p className="text-[#3db2ff]">
                  {(selectedConversation.participant as ServiceProvider).serviceType}
                </p>
              </div>
              
              {(selectedConversation.participant as ServiceProvider).phone && (
                <div>
                  <h5 className="text-white font-medium mb-2">Phone</h5>
                  <a
                    href={`tel:${(selectedConversation.participant as ServiceProvider).phone}`}
                    className="text-[#3db2ff] hover:text-blue-400 transition-colors"
                  >
                    {(selectedConversation.participant as ServiceProvider).phone}
                  </a>
                </div>
              )}
              
              {(selectedConversation.participant as ServiceProvider).location?.address && (
                <div>
                  <h5 className="text-white font-medium mb-2">Location</h5>
                  <p className="text-[#cbd5e1] text-sm">
                    {(selectedConversation.participant as ServiceProvider).location.address}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}