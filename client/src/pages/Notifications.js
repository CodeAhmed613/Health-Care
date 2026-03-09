import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../api'; // 1. Import your new config

const Notifications = () => {
    const [notifs, setNotifs] = useState([]);
    const userId = localStorage.getItem('id');

    const fetchNotifs = async () => {
        try {
            const res = await API.get(`/api/notifications/${userId}`);
            setNotifs(res.data);
        } catch (err) { console.log("Error loading notifications"); }
    };

    useEffect(() => { fetchNotifs(); }, [userId]);

    const markAsRead = async (id) => {
        await API.put(`/api/notifications/read/${id}`);
        fetchNotifs();
    };

    const markAllRead = async () => {
        await API.put(`/api/notifications/read-all/${userId}`);
        fetchNotifs();
    };

    const deleteNotif = async (e, id) => {
        e.stopPropagation(); // Prevents marking as read when clicking delete
        if(window.confirm("Delete this notification?")) {
            await API.delete(`/api/notifications/${id}`);
            fetchNotifs();
        }
    };

    const getNotifDetails = (type) => {
        switch (type) {
            case 'admin_alert': return { icon: '📢', label: 'Admin Alert', color: '#e3f2fd', border: '#007bff' };
            case 'profile_update': return { icon: '👤', label: 'Profile Update', color: '#f1f8e9', border: '#4caf50' };
            case 'vaccine_reminder': return { icon: '💉', label: 'Vaccine Due', color: '#fff3e0', border: '#ff9800' };
            default: return { icon: '🔔', label: 'Notification', color: '#f5f5f5', border: '#9e9e9e' };
        }
    };

    return (
        <div className="admin-container">
            <div className="management-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Notifications 🔔</h2>
                        <p style={{ color: '#666', margin: 0 }}>Stay updated with your child's health track.</p>
                    </div>
                    {notifs.some(n => !n.isRead) && (
                        <button onClick={markAllRead} className="btn-nav" style={{fontSize: '0.8rem', backgroundColor: '#eee', color: '#333'}}>
                            Mark all as read
                        </button>
                    )}
                </div>
                
                <hr style={{ margin: '20px 0', opacity: '0.2' }} />

                {notifs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ fontSize: '1.2rem', color: '#999' }}>No notifications yet!</p>
                    </div>
                ) : (
                    <div className="notif-list">
                        {notifs.map((n) => {
                            const details = getNotifDetails(n.type);
                            return (
                                <div 
                                    key={n._id} 
                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                    style={{
                                        background: n.isRead ? '#ffffff' : details.color,
                                        borderLeft: `6px solid ${n.isRead ? '#ddd' : details.border}`,
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        boxShadow: n.isRead ? 'none' : '0 4px 12px rgba(0,0,0,0.08)',
                                        cursor: n.isRead ? 'default' : 'pointer',
                                        position: 'relative',
                                        opacity: n.isRead ? 0.8 : 1,
                                        transition: '0.3s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.8rem' }}>{details.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong style={{ fontSize: '0.75rem', color: '#777' }}>{details.label}</strong>
                                            <small style={{ color: '#888' }}>{new Date(n.createdAt).toLocaleDateString()}</small>
                                        </div>
                                        <p style={{ margin: '5px 0 0', fontWeight: n.isRead ? '400' : '600' }}>{n.message}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteNotif(e, n._id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;