import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API from '../api'; // 1. Import your new config

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await API.post('/api/auth/forgot-password', { email });
            setMessage({ text: "Success! Please check your email for a reset link. 📧", type: 'success' });
        } catch (err) {
            setMessage({ 
                text: err.response?.data?.message || "Something went wrong. Please try again.", 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center' }}>Reset Your Password</h2>
                <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message.text && (
                    <div style={{
                        ...msgStyle,
                        backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : '#721c24'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        style={inputStyle} 
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{...btnStyle, opacity: isLoading ? 0.7 : 1}}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

// Styles (Matching your existing theme)
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' };
const cardStyle = { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' };
const labelStyle = { fontSize: '0.9rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const msgStyle = { padding: '12px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' };

export default ForgotPassword;