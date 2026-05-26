import React, { useState, useEffect } from 'react';
import './RightPanel.css';

const RightPanel = ({ socket, currentUser, onStartChat, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch registered users in the database
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUsers = async () => {
      setLoading(true);
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
        console.error('Error fetching right panel users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Listen to real-time online status updates
    if (socket) {
      socket.on('online_users', (userIds) => {
        setOnlineUserIds(userIds);
      });

      // Cleanup
      return () => {
        socket.off('online_users');
      };
    }
  }, [socket, currentUser]);

  // Filter out the current user from suggestions list
  const suggestedUsers = users.filter(u => u._id !== currentUser.id);

  return (
    <div className="right-sidebar">
      {/* Current User Row */}
      {currentUser && (
        <div className="panel-current-user-row">
          <div className="current-user-info-link">
            <img src={currentUser.avatar} alt={currentUser.name} className="panel-current-avatar" />
            <div className="current-user-details">
              <h4>{currentUser.username}</h4>
              <span>{currentUser.name}</span>
            </div>
          </div>
          <button className="panel-switch-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}

      {/* Suggested for You Section */}
      <div className="suggestions-section-header">
        <h3>Suggested for you</h3>
        <span className="see-all-label">See All</span>
      </div>

      <div className="suggestions-list">
        {loading ? (
          <div className="panel-status-msg">Loading suggestions...</div>
        ) : suggestedUsers.length === 0 ? (
          <div className="panel-status-msg">
            No other users found on this database. Open a private window to register another account and see live suggestion threads!
          </div>
        ) : (
          suggestedUsers.map(user => {
            const isOnline = onlineUserIds.includes(user._id);
            return (
              <div key={user._id} className="suggested-user-item">
                <div className="suggested-user-info">
                  <img src={user.avatar} alt={user.name} className="suggested-avatar" />
                  <div className="suggested-details">
                    <h4>{user.username}</h4>
                    <span>{isOnline ? 'Online Now' : 'Popular'}</span>
                  </div>
                </div>
                <button 
                  className="message-link-btn" 
                  onClick={() => onStartChat(user)} 
                  title={`Message ${user.name}`}
                >
                  Message
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RightPanel;
