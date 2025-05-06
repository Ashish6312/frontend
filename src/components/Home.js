import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import io from 'socket.io-client';
import './Home.css';

const socket = io('http://13.235.86.32:5000'); // Update if your backend runs on another port

const Toast = ({ message, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev > 0 ? prev - 1 : 0));
    }, 50);

    const timeout = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onClose, message]);

  return (
    <div className="toast">
      <p>{message}</p>
      <div className="toast-progress" style={{ width: `${progress}%` }}></div>
      <button className="toast-close" onClick={onClose}>✖</button>
    </div>
  );
};

function Home() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('PlanA');
  const [loading, setLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(true);
  const { addNotification } = useNotification();
  const [toastMessage, setToastMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState(user?.wallet || 0);

// Replace the problematic fetchUserData function and useEffect code in Home.js

// First, update state from localStorage when component mounts
useEffect(() => {
  // If no user in context but exists in localStorage, restore it
  if (!user || !user.id) {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.id) {
      setUser(storedUser);
      setWalletBalance(storedUser.wallet || 0);
    } else {
      // No valid user data found, redirect to login
      navigate('/login');
    }
  } else {
    // User exists in context, ensure wallet balance is set
    setWalletBalance(user.wallet || 0);
  }
}, [user, setUser, navigate]);

// Separate useEffect to fetch plans
useEffect(() => {
  fetchPlans();
}, []);

// Socket connection for real-time updates will handle wallet updates automatically

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Connection status for debugging
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server with socket ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('walletUpdated');
    };
  }, [user, setUser, addNotification]);

  // Listen for wallet updates
  useEffect(() => {
    const handleWalletUpdate = (data) => {
      console.log('Wallet update received:', data);
      
      // Check if this update is for the current user
      if (user && (data.userId === user._id || data.userId === user.id)) {
        console.log('Updating wallet for current user');
        
        // Update user in context and localStorage
        const updatedUser = { ...user, wallet: data.newWallet };
        setUser(updatedUser);
        setWalletBalance(data.newWallet);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Show appropriate notification
        if (data.amount > 0) {
          addNotification(`💰 ₹${data.amount} credited to your wallet!`);
          setToastMessage(`💰 ₹${data.amount} credited to your wallet!`);
        } else if (data.amount < 0) {
          // For purchase deductions
          addNotification(`💸 ₹${Math.abs(data.amount)} deducted from your wallet.`);
          setToastMessage(`💸 ₹${Math.abs(data.amount)} deducted from your wallet.`);
        } else {
          addNotification('💰 Your wallet has been updated!');
          setToastMessage('💰 Your wallet has been updated!');
        }
      }
    };

    socket.on('walletUpdated', handleWalletUpdate);

    return () => {
      socket.off('walletUpdated', handleWalletUpdate);
    };
  }, [user, setUser, addNotification]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://13.235.86.32:5000/api/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    
    // Fetch latest user data to ensure wallet is up-to-date
    const fetchUserData = async () => {
      if (user && user.id) {
        try {
          const res = await axios.get(`http://13.235.86.32:5000/api/auth/user/${user.id}`);
          if (res.data) {
            const updatedUser = { ...user, wallet: res.data.wallet };
            setUser(updatedUser);
            setWalletBalance(res.data.wallet);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Failed to fetch updated user data:', err);
        }
      }
    };
    
    fetchUserData();
  }, []);

  const handleBuyPlan = async (plan) => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post('http://13.235.86.32:5000/api/purchases', {
        userId: user.id,
        planId: plan._id,
        planType: plan.planType,
        price: plan.price,
        dailyIncome: plan.dailyIncome,
      });

      const updatedWallet = res.data.updatedWallet;
      const updatedUser = { ...user, wallet: updatedWallet };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setWalletBalance(updatedWallet);

      addNotification(`✅ You purchased the ${plan.name} plan!`);
      setToastMessage(`✅ You purchased the ${plan.name} plan!`);
    } catch (error) {
      console.error('Purchase failed:', error.response?.data || error.message);
      if (error.response?.data?.msg === 'Insufficient wallet balance') {
        addNotification('❌ Insufficient wallet balance. Please add more funds.');
        setToastMessage('❌ Insufficient wallet balance. Please add more funds.');
      } else {
        addNotification('❌ Failed to purchase plan. Please try again.');
        setToastMessage('❌ Failed to purchase plan. Please try again.');
      }
    }
  };

  return (
    <div className="home">
      <h2>Welcome, {user?.username || 'Guest'}!</h2>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}

      <div className="wallet-section">
        <p>
          Wallet Balance: ₹
          {showWallet ? walletBalance : '******'}
          <button
            onClick={() => setShowWallet(!showWallet)}
            aria-label={showWallet ? 'Hide wallet balance' : 'Show wallet balance'}
            style={{
              marginLeft: 10,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {showWallet ? '👁️' : '🙈'}
          </button>
        </p>
      </div>

      {loading && <p>Loading plans...</p>}

      <div className="options-section">
        <button onClick={() => window.open("https://t.me/your_telegram_channel")}>Telegram</button>
        <button onClick={() => window.open("https://t.me/help_contact_person")}>Contact</button>
      </div>

      <div className="tab-section">
        <button
          onClick={() => setActiveTab('PlanA')}
          className={activeTab === 'PlanA' ? 'active' : ''}
        >
          Plan A
        </button>
        <button
          onClick={() => setActiveTab('Welfare')}
          className={activeTab === 'Welfare' ? 'active' : ''}
        >
          Welfare Plan
        </button>
      </div>
      <div className="plans-section">
  {plans.filter((plan) => plan.planType === activeTab).length > 0 ? (
    plans
      .filter((plan) => plan.planType === activeTab)
      .map((plan) => (
        <div key={plan._id} className="plan-card">
          <h4>{plan.name}</h4>
          <p>Price: ₹{plan.price}</p>
          <p>Daily Income: ₹{plan.dailyIncome}</p>
          {plan.image && (
            <img
              src={`http://13.235.86.32:5000${plan.image}`}
              alt={plan.name}
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
          )}
          <button onClick={() => handleBuyPlan(plan)}>Buy Now</button>
        </div>
      ))
  ) : (
    <p>No plans available in this category.</p>
  )}
</div>

    </div>
  );
}

export default Home;