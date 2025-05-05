// src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { NotificationProvider } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';

import Header from './components/Header';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import Home from './components/Home';
import Invite from './components/Invite';
import Transactions from './components/Transactions';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import MyInvestments from './components/MyInvestments'; // ✅ NEW PAGE

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSetLoggedInUser = (user) => {
    setLoggedInUser(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  };

  const Layout = ({ children }) => {
    const location = useLocation();
    const hideHeaderRoutes = ['/login', '/register', '/admin/login'];

    return (
      <>
        {!hideHeaderRoutes.includes(location.pathname) && (
          <Header user={loggedInUser} setUser={handleSetLoggedInUser} />
        )}
        {children}
      </>
    );
  };

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken') || adminToken;
    return token ? children : <Navigate to="/admin/login" />;
  };

  return (
    <NotificationProvider>
      <UserProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Route for registration */}
              <Route path="/" element={<Home user={loggedInUser} setUser={handleSetLoggedInUser} />} />
              <Route path="/register" element={<Register />} />

              {/* Route for login */}
              <Route path="/login" element={<Login setLoggedInUser={handleSetLoggedInUser} />} />

              {/* Home page */}
              <Route path="/home" element={<Home user={loggedInUser} setUser={handleSetLoggedInUser} />} />

              {/* Profile page */}
              <Route path="/profile" element={<Profile user={loggedInUser} setUser={handleSetLoggedInUser} />} />

              {/* Invite page */}
              <Route path="/invite" element={<Invite user={loggedInUser} />} />

              {/* Transactions page */}
              <Route path="/transactions" element={<Transactions user={currentUser} setUser={setCurrentUser} />} />

              {/* ✅ My Investments page */}
              <Route path="/my-investments" element={<MyInvestments user={loggedInUser} />} />


              {/* Admin login */}
              <Route path="/admin/login" element={<AdminLogin setAdminToken={setAdminToken} />} />

              {/* Admin panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </Layout>
        </Router>
      </UserProvider>
    </NotificationProvider>
  );
}

export default App;
