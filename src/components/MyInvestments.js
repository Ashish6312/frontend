import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyInvestments.css'; // Import the CSS

const MyInvestments = ({ user }) => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/investments/${userId}`);
        setInvestments(res.data);
      } catch (error) {
        console.error('Error fetching investments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [userId]);

  return (
    <div className="investments-container">
      <h2>Your Investments</h2>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : investments.length === 0 ? (
        <p className="no-investments">You don't have any active investments.</p>
      ) : (
        <div className="investment-grid">
          {investments.map((inv, i) => (
            <div key={i} className="investment-card">
              <h3>{inv.planName} ({inv.planType})</h3>
              {inv.image && (
                <img src={`http://localhost:5000${inv.image}`} alt={inv.planName} style={{ width: '100px', height: '100px', objectFit: 'cover' }}/>
              )}
              <p><strong>Invested Amount:</strong> ₹{inv.investedAmount}</p>
              <p><strong>Daily Income:</strong> ₹{inv.dailyIncome}</p>
              <p><strong>Total Earned:</strong> ₹{inv.totalEarned}</p>
              <p><strong>Start Date:</strong> {new Date(inv.purchaseDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {inv.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInvestments;
