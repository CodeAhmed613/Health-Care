import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import '../App.css';
import API from '../api'; // 1. Import your new config

const Admin = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState("all");
    const [notifType, setNotifType] = useState("admin_alert");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            // Updated route to get infants linked to parents
            const res = await API.get('/api/admin/users-with-infants');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data", err);
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm("Permanently delete this user and their records?")) {
            await API.delete(`/api/admin/user/${id}`);
            fetchAdminData(); 
        }
    };

    const sendNotification = async () => {
        if (!message) return alert("Please type a message.");
        try {
            await API.post('/api/admin/notify', {
                recipientId: target,
                message: message,
                type: notifType
            });
            alert("Notification sent successfully!");
            setMessage("");
        } catch (err) { alert("Error sending notification"); }
    };

    const chartData = [
        { name: 'With Infants', value: users.filter(u => u.infant).length },
        { name: 'No Infant', value: users.filter(u => !u.infant && u.role === 'parent').length }
    ];

    if (loading) return <div className="loader">Loading Management System...</div>;

    return (
        <div className="admin-container" style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Admin Health Portal</h1>
                <div className="tab-menu" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'btn-main' : 'btn-nav'}>📊 Overview</button>
                    <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-main' : 'btn-nav'}>👥 Users</button>
                    <button onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'btn-main' : 'btn-nav'}>📢 Notifier</button>
                </div>
            </header>

            {/* --- TAB 1: OVERVIEW --- */}
            {activeTab === 'overview' && (
                <div className="management-card">
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                        <div className="stat"><h3>{users.length}</h3><p>Total Users</p></div>
                        <div className="stat"><h3>{users.filter(u => u.infant).length}</h3><p>Infants Tracked</p></div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#007bff" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- TAB 2: USER REGISTRY (WITH INFANTS) --- */}
            {activeTab === 'users' && (
                <section className="management-card">
                    <h3>Manage Database Users</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Linked Child</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.infant ? user.infant.name : <span style={{color: 'red'}}>None</span>}</td>
                                    <td>
                                        <button className="btn-delete" onClick={() => deleteUser(user._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* --- TAB 3: NOTIFICATION CENTER --- */}
            {activeTab === 'notifications' && (
                <div className="management-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h3>Send Targeted Message</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-field">
                            <option value="all">Broadcast to All</option>
                            {users.filter(u => u.role === 'parent').map(u => (
                                <option key={u._id} value={u._id}>{u.name} (Child: {u.infant?.name || 'N/A'})</option>
                            ))}
                        </select>
                        <select value={notifType} onChange={(e) => setNotifType(e.target.value)} className="input-field">
                            <option value="admin_alert">📢 Admin Alert</option>
                            <option value="vaccine_reminder">💉 Vaccine Reminder</option>
                        </select>
                        <textarea 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="Enter message..." 
                            className="input-field"
                        />
                        <button onClick={sendNotification} className="btn-main">Send Notification</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;