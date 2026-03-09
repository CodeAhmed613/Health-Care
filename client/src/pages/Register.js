import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api'; // 1. Import your new config

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'parent',
        infantName: '', dob: '', healthId: ''
    });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // 1. Create User
            const userRes = await API.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            // The backend returns the user object, we need the ID
            const newUserId = userRes.data._id || userRes.data.user._id;

            // 2. Register first infant if Parent
            if (formData.role === 'parent') {
                await API.post('/api/infant/add', {
                    name: formData.infantName,
                    dob: formData.dob,
                    healthId: formData.healthId,
                    parentId: newUserId // Links the baby to this specific parent
                });
                alert("Account and first infant registered successfully!");
            } else {
                alert("Doctor account created! Pending Admin approval.");
            }

            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed.");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '700px', margin: '50px auto', padding: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderRadius: '15px' }}>
                <h2 style={{ textAlign: 'center' }}>Create Account</h2>
                
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>I am a:</label>
                    <select 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="parent">Parent</option>
                        <option value="operator">Doctor / Healthcare Staff</option>
                    </select>
                </div>

                <form onSubmit={handleRegister}>
                    <div style={{ display: 'grid', gridTemplateColumns: formData.role === 'parent' ? '1fr 1fr' : '1fr', gap: '30px' }}>
                        
                        {/* LEFT SIDE: ACCOUNT INFO */}
                        <div className="form-section">
                            <h4 style={{ color: '#007bff', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>User Details</h4>
                            <div className="form-group" style={groupStyle}>
                                <label>Full Name</label>
                                <input type="text" style={inputStyle} placeholder="John Doe" onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group" style={groupStyle}>
                                <label>Email</label>
                                <input type="email" style={inputStyle} placeholder="john@example.com" onChange={e => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            <div className="form-group" style={groupStyle}>
                                <label>Password</label>
                                <input type="password" style={inputStyle} placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} required />
                            </div>
                        </div>

                        {/* RIGHT SIDE: INFANT INFO (Only for parents) */}
                        {formData.role === 'parent' && (
                            <div className="form-section">
                                <h4 style={{ color: '#007bff', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>First Child Details</h4>
                                <div className="form-group" style={groupStyle}>
                                    <label>Child's Name</label>
                                    <input type="text" style={inputStyle} placeholder="Baby Doe" onChange={e => setFormData({...formData, infantName: e.target.value})} required />
                                </div>
                                <div className="form-group" style={groupStyle}>
                                    <label>Date of Birth</label>
                                    <input type="date" style={inputStyle} onChange={e => setFormData({...formData, dob: e.target.value})} required />
                                </div>
                                <div className="form-group" style={groupStyle}>
                                    <label>Health ID</label>
                                    <input type="text" style={inputStyle} placeholder="HID-12345" onChange={e => setFormData({...formData, healthId: e.target.value})} required />
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" style={submitBtnStyle}>
                        {formData.role === 'operator' ? 'Request Access' : 'Register Now'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

const groupStyle = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '5px' };
const submitBtnStyle = { marginTop: '20px', width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default Register;