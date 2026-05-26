import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Post from '../Post/Post';
import './Feed.css';

const Feed = ({ socket, currentUser, newPostFromModal, openCreateModal }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts from backend database
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/posts');

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Could not connect to database cluster. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Sync post created in App-level Create Modal
  useEffect(() => {
    if (newPostFromModal) {
      setPosts((prev) => {
        if (prev.some(p => p._id === newPostFromModal._id)) return prev;
        return [newPostFromModal, ...prev];
      });
    }
  }, [newPostFromModal]);

  // Socket integration for live real-time feeds
  useEffect(() => {
    if (!socket) return;

    // Listen for live new posts by other users
    const handleNewPost = (newPost) => {
      setPosts((prev) => {
        if (prev.some(p => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    };

    // Listen for live likes/comments
    const handleUpdatePost = (updatedPost) => {
      setPosts((prev) => 
        prev.map(post => post._id === updatedPost._id ? updatedPost : post)
      );
    };

    socket.on('new_post', handleNewPost);
    socket.on('update_post', handleUpdatePost);

    return () => {
      socket.off('new_post', handleNewPost);
      socket.off('update_post', handleUpdatePost);
    };
  }, [socket]);

  return (
    <div className="main-feed feed-layout">
      {currentUser && (
        <div className="create-post">
          <div className="post-input-area">
            <img src={currentUser.avatar} alt={currentUser.name} className="avatar" />
            <button className="post-input-placeholder-btn" onClick={openCreateModal}>
              What's on your mind, {currentUser.name.split(' ')[0]}?
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>{error}</p>
          <div style={{ marginTop: '14px' }}>
            <button onClick={fetchPosts} className="instagram-btn" style={{ textDecoration: 'underline' }}>Retry Connection</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="feed-loader">
          <div className="spinner"></div>
          <span>Loading Feed...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <Sparkles size={24} color="var(--accent-blue)" />
          <p>No posts on your feed yet.</p>
          <span>Share a moment and make the first post!</span>
        </div>
      ) : (
        posts.map((post) => (
          <Post 
            key={post._id}
            post={post}
            socket={socket}
            currentUser={currentUser}
          />
        ))
      )}
    </div>
  );
};

export default Feed;
