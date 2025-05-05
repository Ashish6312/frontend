// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the CSS file

function Login({ setLoggedInUser }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form); // Fixed URL

      if (res.data.user) {
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setLoggedInUser(res.data.user); // Update state
        navigate('/home');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Error logging in');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <input
        className="login-input"
        type="text"
        name="username"
        placeholder="Username"
        onChange={handleChange}
        required
      />
      <input
        className="login-input"
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />
      <button className="login-button" onClick={handleLogin}>
        Login
      </button>
      <p className="register-footer">
        Don't have an account ? <a href="/register" className="register-link">Register Here</a>
      </p>
    </div>
  );
}

export default Login;
