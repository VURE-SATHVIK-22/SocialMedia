import React, { useState, useEffect } from 'react';
import './LoginRegister.css';

const LoginRegister = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Live Avatar Preview generator using dicebear adventurer art
  useEffect(() => {
    if (!isLogin && username.trim().length >= 3) {
      setAvatarPreview(`https://api.dicebear.com/7.x/adventurer/svg?seed=${username.toLowerCase().trim()}`);
    } else {
      setAvatarPreview('');
    }
  }, [username, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { username: username.toLowerCase().trim(), password }
      : { username: username.toLowerCase().trim(), password, name: name.trim() };

    try {
      const response = await fetch(`http://localhost:5050${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Success
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        name: data.name,
        username: data.username,
        avatar: data.avatar
      }));

      onLoginSuccess(data);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Server Connection Error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-instagram-logo">SOC</span>
            <p>
              {isLogin 
                ? 'Sign in to see photos, chats, and posts from your friends.' 
                : 'Sign up to see photos, chats, and posts from your friends in real-time.'}
            </p>
          </div>

          {error && <div className="auth-error-badge">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
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
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Avatar live preview helper */}
            {avatarPreview && (
              <div className="avatar-preview-container">
                <span>Your Unique Profile Avatar:</span>
                <img src={avatarPreview} alt="Live avatar preview" className="live-avatar-preview" />
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <span>{isLogin ? 'Log in' : 'Sign up'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Lower footer toggle card */}
        <div className="auth-secondary-card">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="toggle-auth-btn">
            {isLogin ? (
              <>
                Don't have an account? <span>Sign up</span>
              </>
            ) : (
              <>
                Have an account? <span>Log in</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
