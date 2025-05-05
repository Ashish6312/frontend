import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    dailyIncome: '',
    planType: 'PlanA',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const checkToken = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        console.error('Error decoding token:', e);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    } else {
      const payload = checkToken();
      if (!payload || payload.role !== 'admin') {
        localStorage.removeItem('adminToken');
        setMessage('Invalid admin token. Please log in again.');
        navigate('/admin/login');
      } else {
        fetchPlans(token);
      }
    }
  }, [navigate]);

  const fetchPlans = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setMessage('Failed to fetch plans. Please try again.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setMessage('No authentication token found. Please log in again.');
        navigate('/admin/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', form.price);
      formData.append('dailyIncome', form.dailyIncome);
      formData.append('planType', form.planType);
      if (form.image) {
        formData.append('image', form.image);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingPlan) {
        await axios.put(`http://localhost:5000/api/plans/${editingPlan._id}`, formData, config);
        setMessage('Plan updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/plans', formData, config);
        setMessage('Plan added successfully!');
      }

      setForm({ name: '', price: '', dailyIncome: '', planType: 'PlanA', image: null });
      setPreviewImage(null);
      setEditingPlan(null);
      fetchPlans(token);
    } catch (err) {
      console.error('Failed to save plan:', err);
      if (err.response) {
        if (err.response.status === 403 || err.response.status === 401) {
          setMessage('Unauthorized. Please log in again.');
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          setMessage(`Failed to save plan: ${err.response.data.message || 'Try again.'}`);
        }
      } else {
        setMessage('Network error. Please try again.');
      }
    }
  };

  const handleEdit = (plan) => {
    setForm({
      name: plan.name,
      price: plan.price,
      dailyIncome: plan.dailyIncome,
      planType: plan.planType,
      image: null
    });
    setEditingPlan(plan);
    setPreviewImage(plan.image ? `http://localhost:5000${plan.image}` : null);
    setMessage('');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Plan deleted successfully!');
      fetchPlans(token);
    } catch (err) {
      console.error('Failed to delete plan:', err);
      setMessage('Failed to delete plan. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel - Manage Plans</h2>

      {message && <p className="message">{message}</p>}

      <button className="logout-button" onClick={handleLogout}>Logout</button>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          placeholder="Plan Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Daily Income"
          value={form.dailyIncome}
          onChange={(e) => setForm({ ...form, dailyIncome: e.target.value })}
          required
        />
        <select
          value={form.planType}
          onChange={(e) => setForm({ ...form, planType: e.target.value })}
        >
          <option value="PlanA">Plan A</option>
          <option value="Welfare">Welfare</option>
        </select>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {previewImage && (
          <img src={previewImage} alt="Preview" style={{ width: '100px', margin: '10px 0' }} />
        )}

        <button type="submit">{editingPlan ? 'Update Plan' : 'Add Plan'}</button>
      </form>

      <div className="plan-list">
        {plans.map((plan) => (
          <div key={plan._id} className="plan-item">
            <h4>{plan.name}</h4>
            <p>Price: ₹{plan.price}</p>
            <p>Daily Income: ₹{plan.dailyIncome}</p>
            <p>Type: {plan.planType}</p>
            {plan.image && (
              <img
  src={`http://localhost:5000${plan.image}`}
  alt={plan.name}
  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
/>

            )}
            <button onClick={() => handleEdit(plan)}>Edit</button>
            <button onClick={() => handleDelete(plan._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
