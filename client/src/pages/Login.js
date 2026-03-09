import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api'; // 1. Import your new config

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/api/auth/login', { email, password });
            
            const { token, user } = res.data; 

            if (user.role === 'operator' && user.isApproved !== true) {
                alert("Hold on! Your account is still pending Admin approval.");
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('role', user.role);
            localStorage.setItem('name', user.name);
            localStorage.setItem('id', user._id); 

            document.body.classList.add('logged-in');

            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'operator') navigate('/operator-dashboard');
            else navigate('/dashboard');

        } catch (err) {
            alert("Login failed. Check your credentials.");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
    <label>Email Address</label>
    <input 
        type="email" 
        placeholder="name@example.com" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        required 
        autoComplete="off" // Stops the browser from filling the email
    />
</div>
<div className="form-group">
    <label>Password</label>
    <input 
        type="password" 
        placeholder="••••••••" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        required 
        autoComplete="new-password" // Often more effective than "off" for password fields
    />
</div>

                    {/* ADDED FORGOT PASSWORD LINK HERE */}
                    <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '20px' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#007bff', textDecoration: 'none' }}>
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="btn-auth">Sign In</button>
                </form>
                <p className="auth-footer">New here? <Link to="/register">Create an account</Link></p>
            </div>
        </div>
    );
};

export default Login;