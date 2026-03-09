import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import API from '../api'; 

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]); 
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState("all");
    const [loading, setLoading] = useState(true);

    // --- DATA FETCHING ---
    const refreshLogs = useCallback(async () => {
        try {
            const logRes = await API.get('/api/admin/activity-logs');
            setLogs(Array.isArray(logRes.data) ? logRes.data : []);
        } catch (err) {
            console.error("Error fetching logs", err);
        }
    }, []);

    const fetchAdminData = useCallback(async () => {
        try {
            const userRes = await API.get('/api/admin/users-with-infants');
            setUsers(Array.isArray(userRes.data) ? userRes.data : []);
            await refreshLogs();
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data", err);
            setLoading(false);
        }
    }, [refreshLogs]);

    // --- AUTH PROTECTION ---
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/');
        } else {
            fetchAdminData();
        }
    }, [fetchAdminData, navigate]);

    // --- ACTION HANDLERS ---
    const handleApproval = async (userId, approveStatus) => {
        try {
            await API.put(`/api/admin/approve-operator/${userId}`, { 
                isApproved: approveStatus 
            });
            alert(approveStatus ? "Operator Approved!" : "Status Updated");
            fetchAdminData(); // Refresh both user list and logs
        } catch (err) {
            alert("Approval update failed");
        }
    };

    const sendNotification = async () => {
        if (!message.trim()) return alert("Please type a message.");
        try {
            await API.post('/api/admin/notify', {
                recipientId: target,
                message: message,
                type: "admin_alert" 
            });
            alert("Notification sent successfully!");
            setMessage("");
            refreshLogs(); // Activity log should record the notification dispatch
        } catch (err) { 
            alert("Error sending notification"); 
        }
    };

    // --- CALCULATIONS ---
    const totalInfants = users.reduce((acc, user) => acc + (user.infants ? user.infants.length : 0), 0);
    const activeDoctors = users.filter(u => u.role === 'operator' && u.isApproved).length;

    const chartData = [
        { name: 'Total Infants', value: totalInfants },
        { name: 'Total Users', value: users.length },
        { name: 'Active Doctors', value: activeDoctors }
    ];

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Initializing Admin Portal...</div>;

    return (
        <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div className="dashboard-header-row" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                <h1 style={{ margin: 0 }}>Admin Command Center 🏢</h1>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} style={logoutBtn}>Logout</button>
            </div>

            {/* --- TAB NAVIGATION --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', overflowX: 'auto', paddingBottom: '5px' }}>
                <button onClick={() => setActiveTab('overview')} style={tabStyle(activeTab === 'overview')}>📊 Overview</button>
                <button onClick={() => setActiveTab('users')} style={tabStyle(activeTab === 'users')}>👥 User Registry</button>
                <button onClick={() => setActiveTab('staff')} style={tabStyle(activeTab === 'staff')}>🏥 Staff Approvals</button>
                <button onClick={() => setActiveTab('logs')} style={tabStyle(activeTab === 'logs')}>📜 Activity Logs</button>
                <button onClick={() => setActiveTab('notifications')} style={tabStyle(activeTab === 'notifications')}>📢 Notifier</button>
            </div>

            {/* --- TAB: OVERVIEW --- */}
            {activeTab === 'overview' && (
                <div className="tab-content">
                    <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="stat-card" style={statCardStyle('#007bff')}>
                            <h3>{users.length}</h3>
                            <p>Total Registered</p>
                        </div>
                        <div className="stat-card" style={statCardStyle('#6f42c1')}>
                            <h3>{totalInfants}</h3>
                            <p>Total Infants</p>
                        </div>
                        <div className="stat-card" style={statCardStyle('#28a745')}>
                            <h3>{activeDoctors}</h3>
                            <p>Active Doctors</p>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '350px' }}>
                        <h3>System Demographics</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6f42c1' : index === 1 ? '#007bff' : '#28a745'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- TAB: USER REGISTRY --- */}
            {activeTab === 'users' && (
                <div style={managementCardStyle}>
                    <h3>Verified User Database</h3>
                    <div className="table-scroll-area">
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={thStyle}>Parent/User</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Linked Infant(s)</th>
                                    <th style={thStyle}>Health ID(s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, idx) => (
                                    <tr key={user._id || idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>
                                            <strong>{user.name || "Unknown User"}</strong><br/>
                                            <small style={{color: '#666'}}>{user.email || "No Email"}</small>
                                        </td>
                                        <td style={tdStyle}><span style={roleBadge(user.role)}>{user.role}</span></td>
                                        <td style={tdStyle}>
                                            {user.infants && user.infants.length > 0 ? (
                                                user.infants.map((inf, i) => (
                                                    <div key={i} style={{marginBottom: '5px', padding: '4px 8px', backgroundColor: '#f0f7ff', borderRadius: '4px', fontSize: '0.9rem'}}>
                                                        👶 {inf.name}
                                                    </div>
                                                ))
                                            ) : '—'}
                                        </td>
                                        <td style={tdStyle}>
                                            {user.infants && user.infants.length > 0 ? (
                                                user.infants.map((inf, i) => (
                                                    <div key={i} style={{marginBottom: '10px', fontSize: '0.9rem'}}>
                                                        <code>{inf.healthId}</code>
                                                    </div>
                                                ))
                                            ) : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB: STAFF MANAGEMENT --- */}
            {activeTab === 'staff' && (
                <div style={managementCardStyle}>
                    <h3 style={{color: '#d9534f'}}>⏳ Pending Doctor Approvals</h3>
                    <div className="table-scroll-area">
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ background: '#fff5f5' }}>
                                    <th style={thStyle}>Doctor Name</th>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => u.role === 'operator' && !u.isApproved).map(user => (
                                    <tr key={user._id}>
                                        <td style={tdStyle}>{user.name}</td>
                                        <td style={tdStyle}>{user.email}</td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleApproval(user._id, true)} style={btnPromo}>✅ Approve</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h3 style={{marginTop: '40px', color: '#28a745'}}>🛡️ Active Operators</h3>
                    <div className="table-scroll-area">
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ background: '#f8fff9' }}>
                                    <th style={thStyle}>Operator Name</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => u.role === 'operator' && u.isApproved).map(user => (
                                    <tr key={user._id}>
                                        <td style={tdStyle}><strong>{user.name}</strong></td>
                                        <td style={tdStyle}><span style={{color: 'green'}}>● Active</span></td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleApproval(user._id, false)} style={btnDemote}>Revoke Access</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

{/* --- TAB: ACTIVITY LOGS (Improved & Fixed) --- */}
{activeTab === 'logs' && (
    <div style={managementCardStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h3>📜 Activity Logs</h3>
            <button onClick={refreshLogs} style={{ ...btnPromo, background: '#17a2b8' }}>🔄 Refresh</button>
        </div>
        <div className="table-scroll-area">
            <table style={tableStyle}>
                <thead>
                    <tr style={{ background: '#f1f1f1' }}>
                        <th style={thStyle}>Timestamp</th>
                        <th style={thStyle}>Action</th>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Details</th>
                       
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log._id}>
                            <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    fontWeight: 'bold',
                                    backgroundColor: log.action === 'User Reply Received' ? '#d1ecf1' : '#e2e3e5',
                                    color: log.action === 'User Reply Received' ? '#0c5460' : '#383d41',
                                    fontSize: '0.85rem'
                                }}>
                                    {log.action}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                {/* FIXED LOGIC: Checks if performedBy is a string or an object */}
                                <strong>
                                    {typeof log.performedBy === 'string' 
                                        ? log.performedBy 
                                        : (log.performedBy?.name || 'System')}
                                </strong>
                                <br/>
                                <small>{typeof log.performedBy === 'object' ? log.performedBy?.email : ''}</small>
                            </td>
                            <td style={tdStyle}>
                                <div style={{maxWidth: '300px', fontStyle: 'italic'}}>
                                    "{log.details || '—'}"
                                </div>
                            </td>
                            <td style={tdStyle}>
                                {/* Only show reply if we have a valid ID to reply to */}
                                {log.action === 'User Reply Received' && log.senderId && (
                                    <button 
                                        onClick={() => {
                                            setTarget(log.senderId); // Use senderId from the log
                                            setActiveTab('notifications');
                                            setMessage(`Replying to: "${log.details}" \n\n --- \n `);
                                        }}
                                        style={{...btnPromo, background: '#007bff', fontSize: '0.8rem'}}
                                    >
                                        ↩️ Reply
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}

            {/* --- TAB: NOTIFICATIONS --- */}
            {activeTab === 'notifications' && (
                <div style={{ ...managementCardStyle, maxWidth: '600px', margin: '0 auto' }}>
                    <h3>Create New Alert</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        <label style={{fontSize: '0.9rem', color: '#666'}}>Recipient Type:</label>
                        <select value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle}>
                            <option value="all">Broadcast to All Parents</option>
                            {users.filter(u => u.role === 'parent').map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <label style={{fontSize: '0.9rem', color: '#666'}}>Message Content:</label>
                        <textarea 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="Type your announcement or alert here..."
                            style={{ ...inputStyle, minHeight: '120px' }}
                        />
                        <button onClick={sendNotification} style={{background: '#007bff', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
                            🚀 Dispatch Message
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const tabStyle = (isActive) => ({ padding: '12px 24px', cursor: 'pointer', border: 'none', background: 'none', borderBottom: isActive ? '3px solid #007bff' : '3px solid transparent', color: isActive ? '#007bff' : '#666', fontWeight: isActive ? 'bold' : 'normal', transition: '0.3s', whiteSpace: 'nowrap' });
const statCardStyle = (color) => ({ padding: '20px', borderRadius: '12px', background: '#fff', borderTop: `4px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' });
const managementCardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const roleBadge = (role) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', background: role === 'admin' ? '#333' : role === 'operator' ? '#e7f3ff' : '#f0f0f0', color: role === 'admin' ? '#fff' : role === 'operator' ? '#007bff' : '#666' });
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
const thStyle = { padding: '12px', borderBottom: '2px solid #eee', textAlign: 'left' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f9f9f9', verticalAlign: 'top' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' };
const btnPromo = { background: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' };
const btnDemote = { background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' };
const logoutBtn = { padding: '8px 15px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' };

export default AdminDashboard;