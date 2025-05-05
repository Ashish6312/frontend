import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from './Toast';
import './Transactions.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import io from 'socket.io-client'; // Import socket.io-client

// Create socket connection
const socket = io('http://localhost:5000');

function Transactions() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Recharge');
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showWallet, setShowWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user?.wallet || 0);
  const [earningsStats, setEarningsStats] = useState({
    totalEarned: 0,
    todayEarned: 0,
    yesterdayEarned: 0,
    lastWeekEarned: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'recharge', 'withdraw', 'earning'

  // Sync wallet balance with user object
  useEffect(() => {
    if (user && user.wallet !== undefined) {
      setWalletBalance(user.wallet);
    }
  }, [user]);

  // Socket.io connection for real-time wallet updates
  useEffect(() => {
    socket.on('walletUpdated', (data) => {
      if (user && (data.userId === user._id || data.userId === user.id)) {
        // Update user in context and localStorage
        const updatedUser = { ...user, wallet: data.newWallet };
        setUser(updatedUser);
        setWalletBalance(data.newWallet);
        
        // Show notification based on transaction type
        if (data.transactionType === 'Earning') {
          setToastMessage(`💰 ₹${data.amount} earned from ${data.planName || 'your investment'}!`);
        } else if (data.amount > 0) {
          setToastMessage(`💰 ₹${data.amount} credited to your wallet!`);
        }
        
        // Refresh transaction history if we're viewing it
        if (activeTab === 'TransactionHistory') {
          fetchTransactions();
        }
      }
    });

    return () => {
      socket.off('walletUpdated');
    };
  }, [user, setUser, activeTab]);

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch transaction history and calculate earnings statistics
  const fetchTransactions = async () => {
    if (!user?.phone) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/transactions/${user.phone}`);
      const allTransactions = response.data.transactions;
      
      // Apply filter if needed
      if (filter !== 'all') {
        const filteredTransactions = allTransactions.filter(
          tx => tx.type.toLowerCase() === filter.toLowerCase()
        );
        setTransactions(filteredTransactions);
      } else {
        setTransactions(allTransactions);
      }
      
      // Calculate earnings statistics
      calculateEarningsStats(allTransactions);
    } catch (error) {
      if (error.response?.status === 401) {
        setToastMessage('Session expired. Please log in again.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        setTransactions([]);
        setToastMessage('No transactions found');
      } else {
        console.error('Error fetching transactions:', error);
        setToastMessage('Failed to fetch transaction history');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate earnings statistics from transactions
  const calculateEarningsStats = (transactions) => {
    // Filter only earning transactions
    const earningTransactions = transactions.filter(tx => tx.type === 'Earning');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    let totalEarned = 0;
    let todayEarned = 0;
    let yesterdayEarned = 0;
    let lastWeekEarned = 0;
    
    earningTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      
      // Total earnings
      totalEarned += tx.amount;
      
      // Today's earnings
      if (txDate.getTime() === today.getTime()) {
        todayEarned += tx.amount;
      }
      
      // Yesterday's earnings
      if (txDate.getTime() === yesterday.getTime()) {
        yesterdayEarned += tx.amount;
      }
      
      // Last week's earnings
      if (txDate >= lastWeekStart && txDate <= today) {
        lastWeekEarned += tx.amount;
      }
    });
    
    setEarningsStats({
      totalEarned,
      todayEarned,
      yesterdayEarned,
      lastWeekEarned
    });
  };
  
  useEffect(() => {
    if (activeTab === 'TransactionHistory' && user?.phone) {
      fetchTransactions();
    }
  }, [activeTab, filter, user?.phone]);

  // Conditional rendering for user
  if (!user) {
    return <p>Loading user data...</p>;
  }

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!amount || amount < 100) {
      return setToastMessage('Minimum amount is ₹100');
    }
  
    try {
      const orderRes = await axios.post('http://localhost:5000/api/auth/create-order', { amount });
  
      const options = {
        key: 'rzp_test_tCkC2xdxoDsNsP', // Store key in .env file
        amount: orderRes.data.amount, // Amount in paise
        currency: "INR",
        name: "Investment App",
        description: "Wallet Recharge",
        order_id: orderRes.data.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post('http://localhost:5000/api/auth/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              phone: user.phone,
              transactionPassword,
              amount
            });
  
            if (verifyRes.status === 200) {
              setUser({ ...user, wallet: verifyRes.data.wallet });
              setWalletBalance(verifyRes.data.wallet);
              setToastMessage('Recharge successful!');
              setAmount('');
              setTransactionPassword('');
            }
          } catch (err) {
            console.error('Verification failed:', err);
            setToastMessage('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          contact: user.phone,
        },
        theme: { color: "#3399cc" }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setToastMessage('Payment failed. Please try again.');
      });
  
      rzp.open();
    } catch (error) {
      console.error('Error creating order:', error);
      setToastMessage('Failed to initiate payment');
    }
  };
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!amount) return setToastMessage('Please enter an amount');
    if (amount < 100) return setToastMessage('Withdraw amount must be at least ₹100');
    if (amount > walletBalance) return setToastMessage('Insufficient wallet balance');
  
    // Calculate the 90% of the entered amount (this will be given to the user)
    const amountToUser = amount * 0.9;
    const withdrawalFee = amount * 0.1; // 10% withdrawal fee
  
    // Show a toast message about the withdrawal fee
    setToastMessage(`You will be charged ₹${withdrawalFee.toFixed(2)} as withdrawal fee. You will receive ₹${amountToUser.toFixed(2)}.`);
  
    try {
      const response = await axios.post('http://localhost:5000/api/auth/transaction/withdraw', {
        phone: user.phone,
        amount: amount,  // Send the full amount to deduct from the wallet
        transactionPassword,
      });
  
      if (response.status === 200) {
        // Update both the user context and local wallet balance
        const updatedUser = { ...user, wallet: response.data.wallet };
        setUser(updatedUser); // This calls updateUser in the context
        setWalletBalance(response.data.wallet); // Update local wallet state
        setToastMessage('Withdraw successful!');
        setAmount('');
        setTransactionPassword('');
        
        // Refresh transaction history if we're viewing it
        if (activeTab === 'TransactionHistory') {
          fetchTransactions();
        }
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setToastMessage('Invalid transaction password');
      } else {
        console.error('Error during withdraw:', error);
        setToastMessage('Failed to process withdraw');
      }
    }
  };
    
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get appropriate badge class based on transaction type
  const getTransactionBadgeClass = (type) => {
    switch (type.toLowerCase()) {
      case 'recharge':
        return 'badge-success';
      case 'withdraw':
        return 'badge-warning';
      case 'earning':
        return 'badge-info';
      case 'purchase':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="transactions-container">
      <h1>Transactions</h1>

      <div className="wallet-section">
        <p>
          Wallet Balance: ₹
          {showWallet ? walletBalance : '******'}
          <button
            onClick={() => setShowWallet(!showWallet)}
            style={{
              marginLeft: 10,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {showWallet ? '👁️' : '🙈'}
          </button>
        </p>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}

      <div className="tab-section">
        <button onClick={() => setActiveTab('Recharge')} className={activeTab === 'Recharge' ? 'active' : ''}>
          Recharge
        </button>
        <button onClick={() => setActiveTab('Withdraw')} className={activeTab === 'Withdraw' ? 'active' : ''}>
          Withdraw
        </button>
        <button onClick={() => setActiveTab('TransactionHistory')} className={activeTab === 'TransactionHistory' ? 'active' : ''}>
          Transaction History
        </button>
        <button onClick={() => setActiveTab('EarningStats')} className={activeTab === 'EarningStats' ? 'active' : ''}>
          Earning Stats
        </button>
      </div>

      {activeTab === 'Recharge' && (
        <form onSubmit={handleRecharge}>
          <div className="fixed-amounts">
            <button type="button" onClick={() => setAmount(100)}>₹100</button>
            <button type="button" onClick={() => setAmount(500)}>₹500</button>
            <button type="button" onClick={() => setAmount(1000)}>₹1000</button>
            <button type="button" onClick={() => setAmount(2000)}>₹2000</button>
          </div>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter transaction password"
            value={transactionPassword}
            onChange={(e) => setTransactionPassword(e.target.value)}
          />
          <button type="submit">Recharge</button>
        </form>
      )}

      {activeTab === 'Withdraw' && (
        <form onSubmit={handleWithdraw}>
          <input 
            type="number" 
            placeholder="Enter amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Enter transaction password" 
            value={transactionPassword} 
            onChange={(e) => setTransactionPassword(e.target.value)} 
          />
          <button type="submit">Withdraw</button>
        </form>
      )}

      {activeTab === 'TransactionHistory' && (
        <div className="transaction-history-container">
          <div className="filter-section">
  <span>Filter by: </span>
  <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
  <button onClick={() => setFilter('recharge')} className={filter === 'recharge' ? 'active' : ''}>Recharge</button>
  <button onClick={() => setFilter('withdraw')} className={filter === 'withdraw' ? 'active' : ''}>Withdraw</button>
  <button onClick={() => setFilter('earning')} className={filter === 'earning' ? 'active' : ''}>Earning</button>
  <button onClick={() => setFilter('purchase')} className={filter === 'purchase' ? 'active' : ''}>Purchase</button>
</div>

          {isLoading ? (
            <p>Loading transactions...</p>
          ) : transactions.length > 0 ? (
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <span className={`transaction-badge ${getTransactionBadgeClass(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={(transaction.type === 'Withdraw' || transaction.type === 'Purchase') ? 'amount-negative' : 'amount-positive'}>
  {(transaction.type === 'Withdraw' || transaction.type === 'Purchase') ? '-' : '+'} ₹{transaction.amount}
</td>

                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>{transaction.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>
      )}

      {activeTab === 'EarningStats' && (
        <div className="earnings-stats-container">
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Earnings</h3>
              <p className="stat-value">₹{earningsStats.totalEarned.toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Today's Earnings</h3>
              <p className="stat-value">₹{earningsStats.todayEarned.toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Yesterday's Earnings</h3>
              <p className="stat-value">₹{earningsStats.yesterdayEarned.toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Last 7 Days</h3>
              <p className="stat-value">₹{earningsStats.lastWeekEarned.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="earnings-history">
            <h3>Recent Earnings</h3>
            {isLoading ? (
              <p>Loading earnings data...</p>
            ) : transactions.filter(tx => tx.type === 'Earning').length > 0 ? (
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(tx => tx.type === 'Earning')
                    .slice(0, 10) // Show only the latest 10 earnings
                    .map((earning) => (
                      <tr key={earning._id}>
                        <td className="amount-positive">+ ₹{earning.amount}</td>
                        <td>{formatDate(earning.date)}</td>
                        <td>{earning.description || 'Daily Income'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No earnings found yet. Purchase a plan to start earning!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;