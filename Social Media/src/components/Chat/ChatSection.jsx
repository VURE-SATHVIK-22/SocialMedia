import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import './ChatSection.css';

const ChatSection = ({ socket, currentUser, initialChatUser }) => {
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync with chat shortcut trigger from RightPanel
  useEffect(() => {
    if (initialChatUser) {
      setActiveChatUser(initialChatUser);
    }
  }, [initialChatUser]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch registered users to chat with
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('http://localhost:5050/api/messages/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching chat users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();

    // Listen to real-time online status updates from Socket
    if (socket) {
      socket.on('online_users', (userIds) => {
        setOnlineUserIds(userIds);
      });

      // Request updated list
      socket.emit('register', currentUser.id);

      // Listen for typing events
      socket.on('typing', ({ senderId }) => {
        if (activeChatUser && activeChatUser._id === senderId) {
          setIsTyping(true);
        }
      });

      socket.on('stop_typing', ({ senderId }) => {
        if (activeChatUser && activeChatUser._id === senderId) {
          setIsTyping(false);
        }
      });

      // Cleanup
      return () => {
        socket.off('online_users');
        socket.off('typing');
        socket.off('stop_typing');
      };
    }
  }, [socket, activeChatUser, currentUser.id]);

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (populatedMessage) => {
      // If message is from the user we are currently chatting with
      if (activeChatUser && 
         (populatedMessage.sender._id === activeChatUser._id || populatedMessage.sender === activeChatUser._id)) {
        setMessages((prev) => [...prev, populatedMessage]);
        setIsTyping(false); // Stop typing visual since we got a message
      }
    };

    const handleMessageSent = (populatedMessage) => {
      // If we sent it to the active user, sync visual
      if (activeChatUser && populatedMessage.recipient._id === activeChatUser._id) {
        setMessages((prev) => [...prev, populatedMessage]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [socket, activeChatUser]);

  // Load chat history when activeChatUser changes
  useEffect(() => {
    if (!activeChatUser) return;

    const fetchMessages = async () => {
      setLoadingHistory(true);
      setMessages([]);
      setIsTyping(false);
      try {
        const response = await fetch(`http://localhost:5050/api/messages/${activeChatUser._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMessages();
  }, [activeChatUser]);

  // Handle Typing notification trigger
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !activeChatUser) return;

    // Send typing notification
    socket.emit('typing', { senderId: currentUser.id, recipientId: activeChatUser._id });

    // Debounce stop typing notification
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { senderId: currentUser.id, recipientId: activeChatUser._id });
    }, 2000);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser || !socket) return;

    // Emit live message over socket
    socket.emit('send_message', {
      senderId: currentUser.id,
      recipientId: activeChatUser._id,
      content: newMessage.trim()
    });

    // Clear typing indicator and input
    socket.emit('stop_typing', { senderId: currentUser.id, recipientId: activeChatUser._id });
    setNewMessage('');
  };

  // Format message timestamp
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Sidebar - Chat List */}
      <div className="chat-sidebar-users">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
          <span className="active-badge">{onlineUserIds.length > 0 ? onlineUserIds.filter(id => id !== currentUser.id).length : 0} online</span>
        </div>
        
        <div className="chat-users-list">
          {loadingUsers ? (
            <div className="chat-status-msg">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="chat-status-msg">No other users yet.</div>
          ) : (
            users.map((user) => {
              const isOnline = onlineUserIds.includes(user._id);
              const isActive = activeChatUser?._id === user._id;
              
              return (
                <div 
                  key={user._id} 
                  className={`chat-user-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveChatUser(user)}
                >
                  <div className="avatar-wrapper">
                    <img src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} alt={user.name} className="user-avatar" />
                    {isOnline && <span className="online-dot-glow"></span>}
                  </div>
                  <div className="user-info-text">
                    <h4>{user.username}</h4>
                    <span>{user.name}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="chat-conversation-area">
        {activeChatUser ? (
          <>
            {/* Conversation Header */}
            <div className="conversation-header">
              <div className="header-user-info">
                <img 
                  src={activeChatUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChatUser.username}`} 
                  alt={activeChatUser.name} 
                  className="chat-header-avatar" 
                />
                <div>
                  <h4>{activeChatUser.name}</h4>
                  <span className="header-status">
                    {onlineUserIds.includes(activeChatUser._id) ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div className="messages-history">
              {loadingHistory ? (
                <div className="chat-history-loader">
                  <div className="spinner"></div>
                  <span>Loading history...</span>
                </div>
              ) : (
                <>
                  {messages.length === 0 ? (
                    <div className="empty-chat-state">
                      <div style={{
                        padding: '16px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--border-color)',
                        marginBottom: '12px'
                      }}>
                        <img 
                          src={activeChatUser.avatar} 
                          alt="avatar" 
                          style={{ width: '60px', height: '60px', borderRadius: '50%' }} 
                        />
                      </div>
                      <p>{activeChatUser.name}</p>
                      <span>@{activeChatUser.username} • Live Chat Thread</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender === currentUser.id || msg.sender?._id === currentUser.id;
                      return (
                        <div key={msg._id} className={`message-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
                          {!isMe && (
                            <img 
                              src={activeChatUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChatUser.username}`} 
                              alt="avatar" 
                              className="bubble-avatar" 
                            />
                          )}
                          <div className="bubble-content-block">
                            <div className="bubble-text">{msg.content}</div>
                            <span className="bubble-time">{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="message-bubble-wrapper incoming">
                      <img 
                        src={activeChatUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChatUser.username}`} 
                        alt="avatar" 
                        className="bubble-avatar" 
                      />
                      <div className="bubble-content-block typing-bubble">
                        <div className="typing-indicator-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Composer Box */}
            <div className="chat-composer-container">
              <form onSubmit={handleSendMessage} className="chat-input-bar">
                <input 
                  type="text" 
                  placeholder="Message..." 
                  value={newMessage}
                  onChange={handleInputChange}
                />
                <button type="submit" disabled={!newMessage.trim()} className="chat-send-btn">
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-illustration">
              <div className="logo-badge">
                <Send size={44} strokeWidth={1} style={{ transform: 'rotate(-25deg)', marginRight: '4px' }} />
              </div>
            </div>
            <h3>Your messages</h3>
            <p>Send private photos and messages to a friend or group.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
