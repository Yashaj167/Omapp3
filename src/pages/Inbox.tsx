import React, { useState } from 'react';
import { 
  Mail, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  MoreVertical,
  Paperclip,
  Calendar,
  User,
  Send,
  RefreshCw,
  Settings,
  Filter,
  CheckSquare,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import { useGmail } from '../hooks/useGmail';
import { format } from 'date-fns';

export function Inbox() {
  const { 
    messages, 
    loading, 
    isConnected, 
    unreadCount,
    currentUser,
    error,
    connectGmail,
    disconnectGmail,
    fetchMessages,
    markAsRead,
    markAsUnread,
    starMessage,
    unstarMessage,
    deleteMessage,
    sendReply
  } = useGmail();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && !message.isRead) ||
      (filter === 'starred' && message.isStarred);

    return matchesSearch && matchesFilter;
  });

  const handleMessageClick = async (message: any) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      await markAsRead(message.id);
    }
  };

  const handleSendReply = async () => {
    if (selectedMessage && replyContent.trim()) {
      await sendReply(selectedMessage.id, replyContent);
      setReplyContent('');
      setShowReplyModal(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900 mb-1">Gmail Connection Error</h4>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Gmail</h2>
          <p className="text-gray-600 mb-6">
            {error 
              ? 'There was an issue connecting to Gmail. Please try again or contact your administrator.'
              : 'Sign in with your Google account to access your Gmail inbox directly from the admin panel.'
            }
          </p>
          <button
            onClick={connectGmail}
            disabled={loading}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                {error ? 'Retry Connection' : 'Sign In with Google'}
              </>
            )}
          </button>
          {!error && (
            <p className="text-xs text-gray-500 mt-4">
              Secure OAuth2 authentication • Your data stays private
            </p>
          )}
          
          {/* Setup Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Gmail Setup Required</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Set up Google Cloud Console project</p>
              <p>2. Enable Gmail API</p>
              <p>3. Create OAuth 2.0 credentials</p>
              <p>4. Add environment variables:</p>
              <div className="bg-blue-100 p-2 rounded mt-2 font-mono text-xs">
                <p>VITE_GOOGLE_CLIENT_ID=your_client_id</p>
                <p>VITE_GOOGLE_API_KEY=your_api_key</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Mail className="w-7 h-7 mr-3 text-red-600" />
              Gmail Inbox
            </h1>
            {currentUser && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800 font-medium">
                  {currentUser.getBasicProfile?.()?.getEmail?.() || 'Connected'}
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''} • {messages.length} total
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={disconnectGmail}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Gmail API Warning</h4>
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'unread' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('starred')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'starred' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Starred
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    } ${!message.isRead ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm truncate ${!message.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {message.from.split('@')[0]}
                          </p>
                          <div className="flex items-center space-x-1">
                            {message.isStarred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mb-1 truncate ${!message.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {message.body.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(message.date, 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredMessages.length === 0 && (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                <p className="text-gray-500">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Your inbox is empty'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{selectedMessage.from}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(selectedMessage.date, 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => selectedMessage.isStarred ? unstarMessage(selectedMessage.id) : starMessage(selectedMessage.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedMessage.isStarred 
                          ? 'text-yellow-500 hover:bg-yellow-50' 
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${selectedMessage.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => selectedMessage.isRead ? markAsUnread(selectedMessage.id) : markAsRead(selectedMessage.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {selectedMessage.isRead ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Labels */}
                {selectedMessage.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.labels.map((label: string) => (
                      <span key={label} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.body}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowReplyModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors">
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center h-96">
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
                <p className="text-gray-500">Choose a message from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reply to {selectedMessage.from}</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Subject: Re: {selectedMessage.subject}</p>
              </div>
              
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={8}
              />
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}