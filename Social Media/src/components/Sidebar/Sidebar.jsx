import React from 'react';
import { Home, MessageCircle, PlusSquare, User, LogOut, Search, Compass, Heart } from 'lucide-react';
import './Sidebar.css';

const InstagramIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-instagram"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Sidebar = ({ activeTab, setActiveTab, currentUser, onLogout, openCreateModal }) => {
  return (
    <div className="sidebar left-sidebar">
      {/* Cursive Instagram Cursive Wordmark */}
      <div className="logo" onClick={() => setActiveTab('feed')}>
        <span className="instagram-logo-text">Instagram</span>
        <span className="instagram-logo-icon"><InstagramIcon size={24} /></span>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          onClick={() => setActiveTab('feed')} 
          className={`nav-item-btn ${activeTab === 'feed' ? 'active' : ''}`}
        >
          <Home size={24} strokeWidth={activeTab === 'feed' ? 2.5 : 2} />
          <span>Home</span>
        </button>

        <button 
          onClick={() => {
            alert('Search features are integrated into the main feed search box.');
          }} 
          className="nav-item-btn"
        >
          <Search size={24} />
          <span>Search</span>
        </button>

        <button 
          onClick={() => {
            alert('Explore section populated! Browse trending tags on the right panel.');
          }} 
          className="nav-item-btn"
        >
          <Compass size={24} />
          <span>Explore</span>
        </button>

        <button 
          onClick={() => setActiveTab('chat')} 
          className={`nav-item-btn ${activeTab === 'chat' ? 'active' : ''}`}
        >
          <MessageCircle size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
          <span>Messages</span>
        </button>

        <button 
          onClick={() => {
            alert('Notifications section: Interactive real-time chat and likes updates are live!');
          }} 
          className="nav-item-btn"
        >
          <Heart size={24} />
          <span>Notifications</span>
        </button>

        {/* Create button triggers the App-level Create Modal */}
        <button 
          onClick={openCreateModal} 
          className="nav-item-btn create-btn"
        >
          <PlusSquare size={24} />
          <span>Create</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          className={`nav-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          {currentUser && currentUser.avatar ? (
            <img src={currentUser.avatar} alt="profile" className="nav-profile-avatar" />
          ) : (
            <User size={24} />
          )}
          <span>Profile</span>
        </button>
      </nav>

      {currentUser && (
        <div className="sidebar-footer">
          <button className="nav-item-btn logout-btn-item" onClick={onLogout}>
            <LogOut size={24} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
