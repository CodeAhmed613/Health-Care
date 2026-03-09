import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../api'; // 1. Import your new config

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setMessage({ text: "Passwords do not match!", type: 'error' });
        }

        try {
            await API.put(`/api/auth/reset-password/${token}`, { newPassword });
            setMessage({ text: "Password reset successful! Redirecting to login...", type: 'success' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setMessage({ text: "Link expired or invalid. Please request a new one.", type: 'error' });
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center' }}>Create New Password</h2>
                {message.text && (
                    <div style={{ ...msgStyle, backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da' }}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>New Password</label>
                    <input 
                        type="password" 
                        required 
                        style={inputStyle} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <label style={labelStyle}>Confirm Password</label>
                    <input 
                        type="password" 
                        required 
                        style={inputStyle} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" style={btnStyle}>Reset Password</button>
                </form>
            </div>
        </div>
    );
};

// Add this to the bottom of ResetPassword.js

const containerStyle = { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '80vh', 
    padding: '20px' 
};

const cardStyle = { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '12px', 
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
    width: '100%', 
    maxWidth: '400px' 
};

const labelStyle = { 
    fontSize: '0.9rem', 
    fontWeight: 'bold', 
    color: '#555', 
    display: 'block', 
    marginBottom: '8px' 
};

const inputStyle = { 
    width: '100%', 
    padding: '12px', 
    marginBottom: '20px', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    boxSizing: 'border-box' 
};

const btnStyle = { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    cursor: 'pointer' 
};

const msgStyle = { 
    padding: '12px', 
    borderRadius: '6px', 
    marginBottom: '20px', 
    textAlign: 'center', 
    fontSize: '0.9rem',
    color: '#721c24',
    backgroundColor: '#f8d7da'
};

export default ResetPassword;