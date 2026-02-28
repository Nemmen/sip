'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useMessages } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/Loading';
import apiClient from '@/lib/api';
import { wsService } from '@/lib/websocket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  applicationId?: string;
  createdAt: string;
  sender: {
    email: string;
    studentProfile?: { fullName: string };
    companyProfile?: { companyName: string };
  };
}

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
    
    // Subscribe to real-time messages
    wsService.onMessage((message) => {
      if (
        selectedConversation &&
        (message.senderId === selectedConversation || message.receiverId === selectedConversation)
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      
      // Update conversation list
      loadConversations();
    });

    return () => {
      // Cleanup subscriptions if needed
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations');
      // Handle both direct array and paginated responses
      const resultData = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setConversations(resultData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/messages/conversation/${userId}`);
      // Handle both direct array and paginated responses
      const resultData = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setMessages(resultData);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (userId: string) => {
    setSelectedConversation(userId);
    loadMessages(userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { data } = await apiClient.post('/messages/send', {
        receiverId: selectedConversation,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      scrollToBottom();
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold text-[var(--primary)]">Messages</h1>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto h-[calc(100vh-300px)]">
                {conversations.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {conversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => handleConversationClick(conv.userId)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                          selectedConversation === conv.userId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-[var(--primary)] text-sm">
                            {conv.userName}
                          </h4>
                          {conv.unreadCount > 0 && (
                            <span className="bg-[var(--error)] text-white text-xs w-5 h-5 flex items-center justify-center font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-1">
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {new Date(conv.lastMessageTime).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--text-secondary)]">
                    <p className="mb-2">No conversations yet</p>
                    <p className="text-sm">Start applying to internships to connect with employers</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="md:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <CardTitle>
                    {conversations.find((c) => c.userId === selectedConversation)?.userName || 'Conversation'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-300px)]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : messages.length > 0 ? (
                      <>
                        {messages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] p-3 ${
                                  isOwn
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--background)] text-[var(--text-primary)]'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? 'text-gray-200' : 'text-[var(--text-secondary)]'
                                  }`}
                                >
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-[var(--border)]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1 px-4 py-2.5 border-2 border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                      />
                      <Button
                        variant="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        loading={sending}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-[calc(100vh-300px)] flex items-center justify-center">
                <div className="text-center text-[var(--text-secondary)]">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
