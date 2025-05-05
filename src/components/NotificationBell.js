import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, clearNotifications, addNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState({ wallet: 1000 });
  const [transactions, setTransactions] = useState([]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!amount) return setToastMessage('Please enter an amount');
    if (amount < 100) return setToastMessage('Withdraw amount must be at least ₹100');
    if (amount > user.wallet) return setToastMessage('Insufficient wallet balance');
    if (transactionPassword !== '1234') return setToastMessage('Invalid transaction password');

    setLoading(true);
    setTimeout(() => {
      const updatedWallet = user.wallet - parseInt(amount, 10);
      setUser({ ...user, wallet: updatedWallet });

      const newTransaction = {
        id: transactions.length + 1,
        type: 'Withdraw',
        amount: parseInt(amount, 10),
        date: new Date().toISOString().split('T')[0],
      };
      setTransactions([newTransaction, ...transactions]);

      addNotification({
        id: Date.now(),
        message: `Withdraw of ₹${amount} successful!`,
      });

      setToastMessage(`Withdraw of ₹${amount} successful!`);
      setAmount('');
      setTransactionPassword('');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-icon"
        onClick={toggleDropdown}
        title="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="header-buttons">
              <button
                className="clear-all-button"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
              >
                Clear All
              </button>
              <button className="close-button" onClick={closeDropdown}>✖</button>
            </div>
          </div>
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  {notification.message}
                </div>
              ))
            ) : (
              <p className="no-notifications">No new notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
