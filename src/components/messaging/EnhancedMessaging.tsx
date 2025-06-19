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
  Info,
  Download,
  AlertTriangle
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

interface MessageAction {
  type: 'delete-for-me' | 'delete-for-all';
  messageId: string;
}

export default function EnhancedMessaging({ chatWithUserId, onClose }: EnhancedMessagingProps) {
  const { user, getUserById, sendMessage, markMessagesAsRead, deleteConversation, deleteMessage } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showParticipantInfo, setShowParticipantInfo] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [showDeleteConversationConfirm, setShowDeleteConversationConfirm] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const refreshConversations = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      // Use the new database function for proper message filtering
      const { data: messages, error } = await supabase.rpc('get_user_messages', {
        user_id: user.id
      });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const conversationMap = new Map<string, ChatMessage[]>();
      
      messages.forEach((msg: any) => {
        const chatMessage: ChatMessage = {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          read: msg.read,
          messageType: msg.message_type || 'text',
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileSize: msg.file_size,
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
        } else {
          setSelectedConversation(null);
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
    setSelectedMessages(new Set());
    setShowMessageActions(null);
    
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

  const handleDeleteMessage = async (messageId: string, deleteType: 'delete-for-me' | 'delete-for-all') => {
    if (!user) return;
    
    setDeletingMessage(messageId);
    try {
      const success = await deleteMessage(messageId, deleteType);
      if (success) {
        setShowMessageActions(null);
        setTimeout(refreshConversations, 200);
      } else {
        alert('Failed to delete message. You can only delete your own messages for everyone.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeletingMessage(null);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return;
    
    setDeletingConversation(true);
    try {
      const success = await deleteConversation(selectedConversation.participant.id);
      if (success) {
        setSelectedConversation(null);
        setShowDeleteConversationConfirm(false);
        setTimeout(refreshConversations, 200);
      } else {
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('File type not supported. Please upload images, PDFs, or documents.');
        return;
      }

      try {
        // For now, we'll convert to base64 and store in message content
        // In production, you'd upload to Supabase Storage
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target?.result as string;
          
          if (selectedConversation && user) {
            setSendingMessage(true);
            try {
              // Create file message
              const fileMessage = {
                type: file.type.startsWith('image/') ? 'image' : 'file',
                name: file.name,
                size: file.size,
                data: base64Data
              };
              
              await sendMessage(selectedConversation.participant.id, JSON.stringify(fileMessage));
              
              // Clear file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              
              // Refresh conversation
              setTimeout(refreshConversations, 200);
            } catch (error) {
              console.error('Failed to send file:', error);
              alert('Failed to send file. Please try again.');
            } finally {
              setSendingMessage(false);
            }
          }
        };
        
        reader.onerror = () => {
          alert('Failed to read file. Please try again.');
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Failed to process file. Please try again.');
      }
    }
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

  const formatMessageDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} minutes ago`;
    } else if (diffInHours < 24) {
      if (diffInHours < 1) {
        return `${Math.floor(diffInMinutes)} minutes ago`;
      } else {
        return `Today at ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } else if (diffInDays < 2) {
      return `Yesterday at ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${messageDate.toLocaleDateString([], { weekday: 'long' })} at ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
    <>
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
                            {(() => {
                              const content = conversation.lastMessage.content;
                              if (!content) return 'Start a conversation';
                              
                              try {
                                const fileData = JSON.parse(content);
                                if (fileData.type && fileData.name && fileData.data) {
                                  if (fileData.type === 'image') {
                                    return '📷 Image';
                                  } else {
                                    return '📎 File';
                                  }
                                }
                              } catch {
                                // Not a file message, return regular content
                              }
                              return content;
                            })()}
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
                      onClick={() => setShowDeleteConversationConfirm(true)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-700"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    
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
                          className={`relative group px-4 py-2 rounded-2xl shadow-lg ${
                            message.senderId === user?.id
                              ? 'bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-br-md'
                              : 'bg-white text-slate-800 rounded-bl-md'
                          }`}
                        >
                          {/* Render message content based on type */}
                          {(() => {
                            try {
                              const fileData = JSON.parse(message.content);
                              if (fileData.type && fileData.name && fileData.data) {
                                // This is a file message
                                if (fileData.type === 'image') {
                                  return (
                                    <div className="space-y-2">
                                      <img 
                                        src={fileData.data} 
                                        alt={fileData.name}
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(fileData.data, '_blank')}
                                      />
                                      <p className="text-xs opacity-75">{fileData.name}</p>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center space-x-2 p-2 bg-black/10 rounded-lg">
                                      <Paperclip className="h-4 w-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{fileData.name}</p>
                                        <p className="text-xs opacity-75">
                                          {(fileData.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = fileData.data;
                                          link.download = fileData.name;
                                          link.click();
                                        }}
                                        className="p-1 hover:bg-black/10 rounded transition-colors"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>
                                  );
                                }
                              }
                            } catch {
                              // Not a file message, render as regular text
                            }
                            return <p className="text-sm leading-relaxed break-words">{message.content}</p>;
                          })()}
                          
                          {/* Message Actions */}
                          {message.senderId === user?.id && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setShowMessageActions(showMessageActions === message.id ? null : message.id)}
                                className="p-1 rounded-full hover:bg-black/20 transition-colors"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                              
                              {showMessageActions === message.id && (
                                <div className="absolute top-6 right-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10 min-w-[150px]">
                                  <button
                                    onClick={() => handleDeleteMessage(message.id, 'delete-for-me')}
                                    disabled={deletingMessage === message.id}
                                    className="w-full text-left px-3 py-2 text-sm text-[#cbd5e1] hover:bg-slate-600 transition-colors disabled:opacity-50"
                                  >
                                    {deletingMessage === message.id ? (
                                      <div className="flex items-center space-x-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Deleting...</span>
                                      </div>
                                    ) : (
                                      'Delete for me'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id, 'delete-for-all')}
                                    disabled={deletingMessage === message.id}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-600 transition-colors disabled:opacity-50"
                                  >
                                    Delete for everyone
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center space-x-1 mt-1 px-2 ${
                          message.senderId === user?.id ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-gray-400">
                            {formatMessageDate(message.timestamp)}
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
                          onClick={() => alert('Emoji picker coming soon!')}
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
                  accept="image/*,application/pdf,text/plain,.doc,.docx"
                  onChange={handleFileUpload}
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

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConversationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 rounded-full p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Conversation</h3>
            </div>
            
            <p className="text-[#cbd5e1] mb-6">
              Are you sure you want to delete this conversation with{' '}
              <strong>{selectedConversation?.participant.name}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConversationConfirm(false)}
                disabled={deletingConversation}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={deletingConversation}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
              >
                {deletingConversation ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}