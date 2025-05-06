import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from './Toast';
import './Invite.css';

function Invite({ user }) {
  const [team, setTeam] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      if (user?.inviteCode) {
        try {
          const res = await axios.get(`http://13.235.86.32:5000/api/auth/profile/referrals/${user.inviteCode}`);
          console.log('Fetched team data:', res.data.referrals); // Log the response to check the data structure
          setTeam(res.data.referrals); // Set the team data
        } catch (err) {
          console.error('Error fetching team:', err.response?.data?.msg || err.message);
        }
      }
    };
  
    fetchTeam();
  }, [user]);
  
  if (!user) {
    return <div className="invite-container">Please log in to view your invite page.</div>;
  }

  const inviteLink = `${window.location.origin}/register?ref=${user.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setToastMessage('✅ Invite link copied to clipboard!');
  };

  return (
    <div className="invite-container">
      <div className="invite-card">
        <h1>🎉 Invite Friends</h1>
        <p className="invite-description">
          Share your invite link and earn rewards when friends join your team!
        </p>

        <div className="invite-link-section">
          <input type="text" value={inviteLink} readOnly className="invite-link-input" />
          <div className="invite-actions">
            <button onClick={handleCopy} className="invite-button">📋 Copy</button>
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(inviteLink)}`, '_blank')}
              className="invite-button whatsapp"
            >
              📤 WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="team-section">
        <h2>👥 Your Team Members</h2>
        {team.length > 0 ? (
          <ul className="team-list">
            {/* Loop through the populated team and display the details */}
            {team.map((member) => (
              <li key={member._id} className="team-member">
                <div className="member-info">
                  <span><strong>📱 Phone:</strong> {member.phone}</span>
                  <span><strong>🧑 Username:</strong> {member.username}</span>
                  {/* Display other details if needed */}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-members">You have no team members yet.</p>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
    </div>
  );
}

export default Invite;
