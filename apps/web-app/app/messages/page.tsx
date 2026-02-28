'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { RouteGuard } from '@/components/RouteGuard';
import { messagesApi, usersApi } from '@/lib/api';

export default function MessagesPage() {
  return (
    <RouteGuard allowedRoles={['STUDENT', 'EMPLOYER']}>
      <MessagesContent />
    </RouteGuard>
  );
}

function MessagesContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messagesApi.getConversations();
      setConversations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      setLoadingMessages(true);
      const response = await messagesApi.getMessages(otherUserId);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await messagesApi.send({
        receiverId: selectedConversation,
        content: newMessage.trim(),
      });
      
      setNewMessage('');
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return 'Unknown User';
    
    if (foundUser.studentProfile?.fullName) {
      return foundUser.studentProfile.fullName;
    }
    if (foundUser.employerProfile?.companyName) {
      return foundUser.employerProfile.companyName;
    }
    return foundUser.email;
  };

  const getUserRole = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.role || 'Unknown';
  };

  const getOtherUserId = (conversation: any) => {
    return conversation.senderId === user?.id ? conversation.receiverId : conversation.senderId;
  };

  const getDashboardPath = () => {
    return user?.role === 'EMPLOYER' ? '/employer/dashboard' : '/student/dashboard';
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">Chat with candidates and employers</p>
            </div>
            <Link href={getDashboardPath()}>
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Conversations List */}
          <Card className="overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
              <p className="text-sm text-gray-600">{conversations.length} total</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start messaging candidates or employers
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => {
                    const otherUserId = getOtherUserId(conversation);
                    const isSelected = selectedConversation === otherUserId;
                    
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(otherUserId)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {getUserName(otherUserId)}
                              </h4>
                              <Badge variant={getUserRole(otherUserId) === 'EMPLOYER' ? 'info' : 'default'} className="text-xs">
                                {getUserRole(otherUserId)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.content}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.createdAt).toLocaleDateString()}
                            </span>
                            {!conversation.readAt && conversation.receiverId === user?.id && (
                              <div className="w-2 h-2 bg-[var(--accent)]" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {!selectedConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-600 text-lg">Select a conversation</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b-2 border-[var(--border)] bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                      {getUserName(selectedConversation).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--primary)]">
                        {getUserName(selectedConversation)}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {getUserRole(selectedConversation)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--background)]">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[var(--text-secondary)]">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isSent = message.senderId === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 ${
                              isSent
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-white text-[var(--primary)] border-2 border-[var(--border)]'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p
                              className={`text-xs mt-2 ${
                                isSent ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2.5 border-2 border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                      disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()}>
                      {sending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
