import React, { useState } from 'react';
import axios from 'axios';
import Toast from './Toast'; // Import the Toast component
import './Profile.css';

function Profile({ user }) {
  const [activeTab, setActiveTab] = useState('BankInfo'); // State to track active tab
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [oldWithdrawPass, setOldWithdrawPass] = useState('');
  const [newWithdrawPass, setNewWithdrawPass] = useState('');
  const [toastMessage, setToastMessage] = useState(''); // State for toast message

  // If user is null or undefined, show a fallback message
  if (!user) {
    return (
      <div className="profile-container">
        <h1>Profile</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const updateBank = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/profile/update-bank', {
        phone: user.phone,
        accountNumber,
        ifscCode: ifsc,
      });
      setToastMessage(res.data.msg); // Show success message
    } catch (err) {
      setToastMessage(err.response?.data?.msg || 'Error updating bank info'); // Show error message
    }
  };

  const changeLoginPass = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/profile/change-login-password', {
        phone: user.phone,
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setToastMessage(res.data.msg); // Show success message
    } catch (err) {
      setToastMessage(err.response?.data?.msg || 'Error updating login password'); // Show error message
    }
  };

  const changeWithdrawPass = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/profile/change-withdraw-password', {
        phone: user.phone,
        oldWithdrawPassword: oldWithdrawPass,
        newWithdrawPassword: newWithdrawPass,
      });
      setToastMessage(res.data.msg); // Show success message
    } catch (err) {
      setToastMessage(err.response?.data?.msg || 'Error updating withdraw password'); // Show error message
    }
  };

  return (
    <div className="profile-container">
      {/* Greeting with User's Phone Number */}
      <h1>Hello, {user.username}</h1>

      {/* Tabs for Navigation */}
      <div className="tab-section">
        <button
          onClick={() => setActiveTab('BankInfo')}
          className={activeTab === 'BankInfo' ? 'active' : ''}
        >
          Bank Info
        </button>
        <button
          onClick={() => setActiveTab('LoginPassword')}
          className={activeTab === 'LoginPassword' ? 'active' : ''}
        >
          Change Login Password
        </button>
        <button
          onClick={() => setActiveTab('WithdrawPassword')}
          className={activeTab === 'WithdrawPassword' ? 'active' : ''}
        >
          Change Withdrawal Password
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'BankInfo' && (
        <div className="tab-content">
          <h3>Bank Info</h3>
          <input
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <input
            placeholder="IFSC Code"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
          />
          <button onClick={updateBank}>Update Bank Info</button>
        </div>
      )}

      {activeTab === 'LoginPassword' && (
        <div className="tab-content">
          <h3>Change Login Password</h3>
          <input
            placeholder="Old Password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
          />
          <input
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <button onClick={changeLoginPass}>Change Login Password</button>
        </div>
      )}

      {activeTab === 'WithdrawPassword' && (
        <div className="tab-content">
          <h3>Change Withdrawal Password</h3>
          <input
            placeholder="Old Withdrawal Password"
            value={oldWithdrawPass}
            onChange={(e) => setOldWithdrawPass(e.target.value)}
          />
          <input
            placeholder="New Withdrawal Password"
            value={newWithdrawPass}
            onChange={(e) => setNewWithdrawPass(e.target.value)}
          />
          <button onClick={changeWithdrawPass}>Change Withdrawal Password</button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
    </div>
  );
}

export default Profile;
