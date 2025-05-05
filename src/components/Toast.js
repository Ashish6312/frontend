import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    console.log('Toast Message:', message); // Debug the message prop
    const interval = setInterval(() => {
      setProgress((prev) => (prev > 0 ? prev - 1 : 0));
    }, 30); // Decrease progress every 50ms (5 seconds total)

    const timeout = setTimeout(() => {
      console.log('Toast closing...'); // Debug when the toast is closing
      onClose(); // Close the toast after 5 seconds
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onClose, message]);

  return (
    <div className="toast">
      <p>{message}</p>
      <div className="toast-progress" style={{ width: `${progress}%` }}></div>
      <button className="toast-close" onClick={onClose}>
        ✖
      </button>
    </div>
  );
};

export default Toast;