import React, { useState, useEffect } from 'react';
import { User, Lock, Sparkles, CheckCircle2, UserCircle, RefreshCcw, Grid, Bookmark, Heart, MessageCircle } from 'lucide-react';
import './ProfileSection.css';

const ProfileSection = ({ currentUser, onProfileUpdate, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Settings Form State
  const [showEditForm, setShowEditForm] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [avatarSeed, setAvatarSeed] = useState(currentUser.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Generate URL based on avatarSeed
  const currentAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed.toLowerCase().trim()}`;

  // Fetch all posts to filter for user's own posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await fetch('http://localhost:5050/api/posts');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Error fetching user posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, []);

  // Filter posts made by current user
  const userPosts = posts.filter(post => {
    if (post.user && typeof post.user === 'object') {
      return post.user._id === currentUser.id;
    }
    return post.user === currentUser.id;
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      avatar: currentAvatarUrl
    };

    if (password) {
      payload.password = password;
    }

    try {
      const response = await fetch('http://localhost:5050/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Success
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        name: data.name,
        username: data.username,
        avatar: data.avatar
      }));

      onProfileUpdate(data);
      setMessage("Profile updated successfully!");
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowEditForm(false);
        setMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Error updating profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(randomSeed);
  };

  return (
    <div className="profile-section-container">
      {/* Instagram Profile Header */}
      <div className="profile-hero">
        <div className="profile-avatar-outer">
          <img src={currentUser.avatar} alt="profile avatar" className="profile-avatar-large" />
          {showEditForm && (
            <button type="button" className="randomize-avatar-btn" onClick={handleRandomizeSeed} title="Randomize Avatar Seed">
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        <div className="profile-hero-text">
          <div className="profile-username-row">
            <h2>{currentUser.username}</h2>
            <button 
              className="profile-edit-btn" 
              onClick={() => setShowEditForm(!showEditForm)}
            >
              {showEditForm ? 'View Profile Grid' : 'Edit Profile'}
            </button>
          </div>
          
          <div className="profile-stats-row">
            <span className="stat-metric-item">
              <strong>{userPosts.length}</strong> posts
            </span>
            <span className="stat-metric-item">
              <strong>{Math.floor(userPosts.length * 1.5 + 4)}</strong> followers
            </span>
            <span className="stat-metric-item">
              <strong>{Math.floor(userPosts.length * 0.8 + 12)}</strong> following
            </span>
          </div>

          <div className="profile-fullname-bio">
            <h3>{currentUser.name}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Real-time Social Member. Let's connect!
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile settings card */}
      {showEditForm ? (
        <div className="profile-edit-section">
          <h3>Profile Settings</h3>
          {message && (
            <div className="profile-feedback success-badge">
              <CheckCircle2 size={16} style={{ marginRight: 6 }} />
              {message}
            </div>
          )}
          {error && (
            <div className="profile-feedback error-badge">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="profile-form">
            <div className="form-group">
              <label>Username (Immutable)</label>
              <div className="input-wrapper disabled">
                <input type="text" value={currentUser.username} disabled />
              </div>
            </div>

            <div className="form-group">
              <label>Display Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Avatar Art Custom Seed</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Seed for custom avatar" 
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  required
                />
              </div>
              <span className="input-hint">Type any phrase/name to dynamically update your custom seed!</span>
            </div>

            <hr className="divider" style={{ margin: '12px 0' }} />
            <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Change Password</h3>

            <div className="form-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="profile-actions-row">
              <button type="button" onClick={onLogout} className="logout-btn">
                Log Out
              </button>
              <button type="submit" className="save-profile-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Post Tabs Switcher */}
          <div className="profile-tabs-bar">
            <button className="profile-tab-item active">
              <Grid size={12} />
              <span>POSTS</span>
            </button>
            <button className="profile-tab-item" onClick={() => alert('Saved posts feature: Bookmark any post to save.')}>
              <Bookmark size={12} />
              <span>SAVED</span>
            </button>
          </div>

          {/* Grid list of posts */}
          {loadingPosts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading posts...
            </div>
          ) : userPosts.length === 0 ? (
            <div className="empty-profile-state">
              <Grid size={44} strokeWidth={1} style={{ opacity: 0.6 }} />
              <p>No Posts Yet</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                When you share photos, they will appear on your profile.
              </span>
            </div>
          ) : (
            <div className="profile-posts-grid">
              {userPosts.map(post => {
                const totalLikes = Array.isArray(post.likes) ? post.likes.length : 0;
                const totalComments = Array.isArray(post.comments) ? post.comments.length : 0;
                
                return (
                  <div key={post._id} className="grid-post-item" onClick={() => alert(post.content)}>
                    {post.image ? (
                      <img src={post.image} alt="post grid item" className="grid-post-image" />
                    ) : (
                      // Fallback for text-only posts
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #121212 0%, #1c1c1e 100%)',
                        color: 'var(--text-secondary)',
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                        border: '1px solid var(--border-color)'
                      }}>
                        "{post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}"
                      </div>
                    )}
                    
                    {/* Dark metric overlay on grid hover */}
                    <div className="grid-post-overlay">
                      <span className="overlay-metric">
                        <Heart size={18} fill="white" />
                        {totalLikes}
                      </span>
                      <span className="overlay-metric">
                        <MessageCircle size={18} fill="white" />
                        {totalComments}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileSection;
