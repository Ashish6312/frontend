import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Header.css';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/home">EarnEase</Link>
        </div>

        <ul className="nav-links">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/invite">Invite</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/transactions">Transactions</Link></li>
          <li><Link to="/my-investments">My Investments</Link></li>
        </ul>

        <div className="header-actions">
          <NotificationBell />
          {user && (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
