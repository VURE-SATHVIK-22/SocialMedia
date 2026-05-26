import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar/Sidebar';
import Feed from './components/Feed/Feed';
import RightPanel from './components/RightPanel/RightPanel';
import LoginRegister from './components/Auth/LoginRegister';
import ChatSection from './components/Chat/ChatSection';
import ProfileSection from './components/Profile/ProfileSection';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [socket, setSocket] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  // Instagram Create Post Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createContent, setCreateContent] = useState('');
  const [createImage, setCreateImage] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [newPostFromModal, setNewPostFromModal] = useState(null);

  // Check authentication on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Initialize socket.io connection when user logs in
  useEffect(() => {
    if (currentUser && currentUser.id) {
      // Connect to the WebSocket port (5050)
      const newSocket = io('http://localhost:5050');
      setSocket(newSocket);

      // Register current user on socket connection
      newSocket.on('connect', () => {
        console.log('Connected to real-time socket cluster:', newSocket.id);
        newSocket.emit('register', currentUser.id);
      });

      return () => {
        newSocket.disconnect();
        console.log('Socket disconnected from server.');
      };
    }
  }, [currentUser]);

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setCurrentUser({
      id: data._id,
      name: data.name,
      username: data.username,
      avatar: data.avatar
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) {
      socket.disconnect();
    }
    setToken(null);
    setCurrentUser(null);
    setActiveTab('feed');
    setSelectedChatUser(null);
  };

  const handleProfileUpdate = (updatedUserData) => {
    const newUserData = {
      id: updatedUserData._id,
      name: updatedUserData.name,
      username: updatedUserData.username,
      avatar: updatedUserData.avatar
    };
    setCurrentUser(newUserData);
  };

  const handleStartChatShortcut = (user) => {
    setSelectedChatUser(user);
    setActiveTab('chat');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please select an image smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCreateImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit new post from the Instagram modal
  const handleCreatePostSubmit = async () => {
    if (!createContent.trim() || !currentUser) return;

    setIsSubmittingPost(true);
    const postPayload = {
      content: createContent.trim(),
      image: createImage.trim()
    };

    try {
      const response = await fetch('http://localhost:5050/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(postPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const createdPost = await response.json();

      // Trigger local state transition to append in Feed component
      setNewPostFromModal(createdPost);

      // Reset and close
      setCreateContent('');
      setCreateImage('');
      setIsCreateOpen(false);

      // Broadcast creation to all online sockets in real-time
      if (socket) {
        socket.emit('post_created', createdPost);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Error creating post. Please try again.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // If not authenticated, render Login/Register overlay
  if (!token || !currentUser) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        openCreateModal={() => setIsCreateOpen(true)}
      />

      {/* Main Content Layout container */}
      <div className="main-content-area">
        {/* Main Center Content Canvas based on active navigation tab */}
        {activeTab === 'feed' && (
          <Feed 
            socket={socket} 
            currentUser={currentUser} 
            newPostFromModal={newPostFromModal} 
            openCreateModal={() => setIsCreateOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatSection 
            socket={socket} 
            currentUser={currentUser} 
            initialChatUser={selectedChatUser}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSection 
            currentUser={currentUser} 
            onProfileUpdate={handleProfileUpdate} 
            onLogout={handleLogout} 
          />
        )}

        {/* Right Panel recommendations (only visible alongside home feed) */}
        {activeTab === 'feed' && (
          <RightPanel 
            socket={socket} 
            currentUser={currentUser} 
            onStartChat={handleStartChatShortcut} 
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Instagram Create Post Modal Overlay */}
      {isCreateOpen && (
        <div className="instagram-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="instagram-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close-btn" style={{ visibility: 'hidden' }}>&times;</button>
              <h3>Create new post</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-user-row">
                <img src={currentUser.avatar} alt="avatar" className="avatar" />
                <span className="modal-username">{currentUser.username}</span>
              </div>
              <textarea
                placeholder="Write a caption..."
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                className="modal-textarea"
              />
              {createImage ? (
                <div className="modal-image-preview-container">
                  <div className="modal-image-preview">
                    <img src={createImage} alt="Post preview" />
                  </div>
                  <button type="button" className="remove-preview-btn" onClick={() => setCreateImage('')}>
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="modal-file-upload-area" onClick={() => document.getElementById('post-file-upload').click()}>
                  <input
                    type="file"
                    id="post-file-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div className="modal-file-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span>Select from computer</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleCreatePostSubmit} 
                disabled={!createContent.trim() || isSubmittingPost}
                className="modal-share-btn"
              >
                {isSubmittingPost ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
