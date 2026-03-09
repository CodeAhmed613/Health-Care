import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../api'; // 1. Import your new config

const Profile = () => {
    const [user, setUser] = useState({ name: '', email: '' });
    const [infants, setInfants] = useState([]);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    
    // UI States
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false); 
    const [message, setMessage] = useState({ text: '', type: '' });

    const userId = localStorage.getItem('id');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const res = await API.get(`/api/admin/users-with-infants`);
                const currentUser = res.data.find(u => u._id === userId);
                if (currentUser) {
                    setUser({ name: currentUser.name, email: currentUser.email });
                    setInfants(currentUser.infants || []);
                }
            } catch (err) {
                console.error("Error loading profile", err);
            }
        };
        fetchProfileData();
    }, [userId]);

    const handleInfantChange = (index, field, value) => {
        const updatedInfants = [...infants];
        updatedInfants[index][field] = value;
        setInfants(updatedInfants);
    };

   const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        try {
            // 1. UPDATE USER
            const userRes = await API.put(`/api/auth/update-profile/${userId}`, {
                name: user.name,
                currentPassword: passwordData.oldPassword, 
                newPassword: passwordData.newPassword
            });

            // --- NAVBAR SYNC ---
            localStorage.setItem('name', user.name);
            // Trigger custom event so Navbar knows to re-read localStorage
            window.dispatchEvent(new Event("nameUpdated"));

            // 2. UPDATE INFANTS
            await Promise.all(infants.map(infant => 
                API.put(`/api/infant/update-info`, {
                    infantId: infant._id,
                    name: infant.name,
                    healthId: infant.healthId
                })
            ));

            setMessage({ text: "Profile and Family records updated successfully! ✅", type: 'success' });
            setPasswordData({ oldPassword: '', newPassword: '' });
            
            setTimeout(() => setMessage({ text: '', type: '' }), 5000);

        } catch (err) {
            console.error("Update error:", err.response?.data);
            const backendMsg = err.response?.data?.message || err.response?.data;
            setMessage({ 
                text: typeof backendMsg === 'string' ? backendMsg : "Update failed. Check your password.", 
                type: 'error' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={containerStyle}>
            <h2>👤 My Profile & Family</h2>
            
            {message.text && (
                <div style={{
                    ...msgStyle, 
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdateProfile}>
                <div style={cardStyle}>
                    <h3>Account Details</h3>
                    <label style={labelStyle}>Full Name</label>
                    <input 
                        style={inputStyle} 
                        value={user.name} 
                        onChange={(e) => setUser({...user, name: e.target.value})} 
                        required
                    />
                    <label style={labelStyle}>Email (Static)</label>
                    <input 
                        style={{...inputStyle, backgroundColor: '#f5f5f5', color: '#666'}} 
                        value={user.email} 
                        disabled 
                    />
                </div>

                <div style={cardStyle}>
                    <h3>Child Details ({infants.length})</h3>
                    {infants.length > 0 ? infants.map((infant, index) => (
                        <div key={infant._id} style={infantBoxStyle}>
                            <h4 style={{margin: '0 0 10px 0', color: '#007bff'}}>Child #{index + 1}</h4>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Name</label>
                                    <input 
                                        style={inputStyle} 
                                        value={infant.name} 
                                        onChange={(e) => handleInfantChange(index, 'name', e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Health ID</label>
                                    <input 
                                        style={inputStyle} 
                                        value={infant.healthId} 
                                        onChange={(e) => handleInfantChange(index, 'healthId', e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Date of Birth</label>
                                    <input 
                                        type="date" 
                                        style={inputStyle} 
                                        value={infant.dob?.split('T')[0]} 
                                        onChange={(e) => handleInfantChange(index, 'dob', e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                    )) : <p style={{textAlign: 'center', color: '#666'}}>No infants linked to this account.</p>}
                </div>

                <div style={cardStyle}>
                    <h3>Security Verification</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Current Password (Required)</label>
                        <div style={passContainer}>
                            <input 
                                type={showOld ? "text" : "password"} 
                                style={inputStyle} 
                                value={passwordData.oldPassword}
                                placeholder="Verify current password to save" 
                                onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} 
                                required
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} style={eyeBtn}>
                                {showOld ? "🙈 Hide" : "👁️ Show"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>New Password (Optional)</label>
                        <div style={passContainer}>
                            <input 
                                type={showNew ? "text" : "password"} 
                                style={inputStyle} 
                                value={passwordData.newPassword}
                                placeholder="Enter new password to change" 
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtn}>
                                {showNew ? "🙈 Hide" : "👁️ Show"}
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSaving} 
                    style={{...btnStyle, opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer'}}
                >
                    {isSaving ? "⏳ Saving Changes..." : "Save All Changes"}
                </button>
            </form>
        </div>
    );
};

const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'inherit' };
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '25px', border: '1px solid #eee' };
const infantBoxStyle = { padding: '15px', borderLeft: '5px solid #007bff', backgroundColor: '#fcfcfc', marginBottom: '15px', borderRadius: '4px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' };
const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '12px', margin: '5px 0 10px 0', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1rem' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem' };
const msgStyle = { padding: '12px', borderRadius: '6px', marginBottom: '25px', textAlign: 'center', fontWeight: '500' };
const passContainer = { position: 'relative', display: 'flex', alignItems: 'center' };
const eyeBtn = { position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.85rem' };

export default Profile;