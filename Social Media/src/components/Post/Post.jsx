import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, AlertCircle } from 'lucide-react';
import './Post.css';

const Post = ({ post, socket, currentUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Safely resolve properties from populated user or legacy string user
  let authorName = 'Unknown User';
  let authorHandle = 'unknown';
  let authorAvatar = '';

  if (post.user && typeof post.user === 'object') {
    authorName = post.user.name || 'Unknown User';
    authorHandle = post.user.username || 'unknown';
    authorAvatar = post.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${authorHandle}`;
  } else if (post.user && typeof post.user === 'string') {
    authorName = post.user;
    authorHandle = post.handle || post.user.toLowerCase().replace(/\s+/g, '');
    authorAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${authorHandle}`;
  } else {
    authorAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=unknown`;
  }

  // Safely check if current user liked the post
  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = currentUser ? likesArray.includes(currentUser.id) : false;
  const likeCount = likesArray.length;

  const toggleLike = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:5050/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const updatedPost = await response.json();
        // Emit live update over socket to update everyone else's screen
        if (socket) {
          socket.emit('post_updated', updatedPost);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`http://localhost:5050/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setCommentText('');
        // Emit live update over socket to sync comment
        if (socket) {
          socket.emit('post_updated', updatedPost);
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Helper to format time (e.g. "Just now", "2m ago")
  const formatTime = (timeVal) => {
    if (!timeVal) return 'Just now';
    const date = new Date(timeVal);
    if (isNaN(date.getTime())) return timeVal;
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + "m";
    return "Just now";
  };

  const totalComments = Array.isArray(post.comments) ? post.comments.length : 0;

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="user-info">
          <img src={authorAvatar} alt="avatar" className="avatar" />
          <div className="user-details">
            <h4>{authorName}</h4>
            <span>@{authorHandle} • {formatTime(post.createdAt)}</span>
          </div>
        </div>
        <button className="action-btn">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Main Image content area if exists */}
      <div className="post-content">
        {post.image ? (
          <img src={post.image} alt="Post media" className="post-image" />
        ) : (
          // Instagram elegant fallback for text-only posts (centered premium typography)
          <div style={{
            padding: '40px 24px', 
            background: 'linear-gradient(135deg, #0e0e0e 0%, #161616 100%)', 
            textAlign: 'center', 
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: '#f5f5f5',
            fontStyle: 'italic'
          }}>
            "{post.content}"
          </div>
        )}
      </div>

      {/* Iconic Action buttons below image */}
      <div className="post-actions-row">
        <div className="left-actions">
          <button 
            className={`action-btn ${isLiked ? 'liked' : ''}`} 
            onClick={toggleLike}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={24} fill={isLiked ? "var(--accent-heart)" : "none"} strokeWidth={isLiked ? 0 : 2} />
          </button>
          
          <button 
            className="action-btn" 
            onClick={() => setShowComments(!showComments)}
            title="Comment"
          >
            <MessageCircle size={24} />
          </button>
          
          <button className="action-btn" title="Share" onClick={() => alert('Post link copied to clipboard!')}>
            <Send size={24} />
          </button>
        </div>

        <button 
          className="action-btn" 
          onClick={() => setIsBookmarked(!isBookmarked)}
          title={isBookmarked ? 'Remove Bookmark' : 'Save'}
        >
          <Bookmark size={24} fill={isBookmarked ? "var(--text-primary)" : "none"} />
        </button>
      </div>

      {/* Post Metadata, Caption, and Comment summaries */}
      <div className="post-info-section">
        <span className="likes-count">
          {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
        </span>
        
        {post.image && (
          <div className="caption-block">
            <span className="caption-username">@{authorHandle}</span>
            {post.content}
          </div>
        )}

        {totalComments > 0 && (
          <button 
            className="comments-toggle-btn" 
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? 'Hide comments' : `View all ${totalComments} ${totalComments === 1 ? 'comment' : 'comments'}`}
          </button>
        )}
      </div>

      {/* Comments Nested Drawer */}
      {showComments && (
        <div className="comments-drawer">
          <div className="comment-list-scroll">
            {totalComments > 0 ? (
              post.comments.map((comment, index) => {
                const commentUser = comment.user || { name: 'Unknown User', username: 'unknown', avatar: '' };
                const commentAvatar = typeof commentUser === 'object' && commentUser.avatar 
                  ? commentUser.avatar 
                  : `https://api.dicebear.com/7.x/adventurer/svg?seed=${typeof commentUser === 'object' ? commentUser.username : 'unknown'}`;
                
                const commentHandle = typeof commentUser === 'object' ? commentUser.username : 'unknown';

                return (
                  <div key={comment._id || index} className="comment-item">
                    <img src={commentAvatar} alt="avatar" className="comment-avatar" />
                    <div className="comment-text-block">
                      <span className="comment-username">@{commentHandle}</span>
                      {comment.content}
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-comments-label">No comments yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Add comment Composer section */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="comment-composer-form">
          <input 
            type="text" 
            placeholder="Add a comment..." 
            className="comment-input-field"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="comment-post-btn" 
            disabled={submittingComment || !commentText.trim()}
          >
            {submittingComment ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <div className="comment-login-banner">
          <AlertCircle size={14} style={{ marginRight: 6 }} />
          <span>Log in to comment.</span>
        </div>
      )}
    </div>
  );
};

export default Post;
