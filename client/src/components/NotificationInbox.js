import React, { useState, useEffect } from 'react';
import NotificationDetail from './NotificationDetail';
import API from '../api'; 

const NotificationInbox = () => {
    const [notifications, setNotifications] = useState([]);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [checkedIds, setCheckedIds] = useState([]); 
    const [replyText, setReplyText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState(null);

    const userId = localStorage.getItem('id');
    const parentName = localStorage.getItem('name');

    useEffect(() => {
        if (userId) fetchNotifications();
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const res = await API.get(`/api/notifications/${userId}`);
            setNotifications(res.data);
        } catch (err) { console.error("Fetch Error:", err); }
    };

    // --- Bulk Actions ---
    const toggleCheck = (id) => {
        setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (checkedIds.length === notifications.length) setCheckedIds([]);
        else setCheckedIds(notifications.map(n => n._id));
    };

    const deleteSelected = async () => {
        if (window.confirm(`Delete ${checkedIds.length} notifications?`)) {
            try {
                await API.post('/api/notifications/delete-bulk', { ids: checkedIds });
                setNotifications(prev => prev.filter(n => !checkedIds.includes(n._id)));
                setCheckedIds([]);
                window.dispatchEvent(new Event("notificationsUpdated"));
            } catch (err) { alert("Bulk delete failed"); }
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.put(`/api/notifications/read-all/${userId}`);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            window.dispatchEvent(new Event("notificationsUpdated"));
        } catch (err) { console.error("Read All Error:", err); }
    };

    const handleSendReply = async (originalMsg) => {
        if (!replyText.trim()) return alert("Please type a message.");
        try {
            await API.post('/api/notifications/reply', {
                message: replyText,
                senderId: userId,
                senderName: parentName,
                originalMessageId: originalMsg._id
            });
            alert("Reply sent to Admin!");
            setReplyText("");
            setActiveReplyId(null);
        } catch (err) {
            console.error("Reply Error:", err);
            alert("Failed to send reply. Check backend console.");
        }
    };

    const handleOpen = async (notif) => {
        setSelectedNotif(notif);
        if (!notif.isRead) {
            try {
                await API.put(`/api/notifications/read/${notif._id}`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                window.dispatchEvent(new Event("notificationsUpdated"));
            } catch (err) { console.error(err); }
        }
    };

    if (selectedNotif) {
        return (
            <div className="admin-container">
                <div className="management-card">
                    <NotificationDetail 
                        notification={selectedNotif} 
                        onBack={() => setSelectedNotif(null)} 
                        onDelete={async (id) => {
                            await API.delete(`/api/notifications/${id}`);
                            setNotifications(prev => prev.filter(n => n._id !== id));
                            setSelectedNotif(null);
                            window.dispatchEvent(new Event("notificationsUpdated"));
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="management-card">
                <div style={headerStyle}>
                    <h2>Inbox 📩</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={markAllAsRead} className="btn-main" style={{background: '#28a745'}}>✔️ Read All</button>
                        {checkedIds.length > 0 && (
                            <button onClick={deleteSelected} className="btn-logout" style={{padding: '5px 15px'}}>
                                🗑 Delete Selected ({checkedIds.length})
                            </button>
                        )}
                        <button onClick={toggleAll} className="btn-main" style={{background: '#666'}}>
                            {checkedIds.length === notifications.length ? "Unselect All" : "Select All"}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    {notifications.length === 0 ? <p>No messages.</p> : 
                        notifications.map(n => (
                            <div key={n._id} style={{ borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                                <div style={{
                                    ...listItem, 
                                    backgroundColor: n.isRead ? '#fff' : '#f0f7ff',
                                    fontWeight: n.isRead ? '400' : '700'
                                }}>
                                    <input 
                                        type="checkbox" 
                                        checked={checkedIds.includes(n._id)} 
                                        onChange={() => toggleCheck(n._id)} 
                                        style={{marginRight: '15px'}}
                                    />

                                    <div onClick={() => handleOpen(n)} style={{flex: 1, display: 'flex', justifyContent: 'space-between', cursor: 'pointer'}}>

                                        <span>
                                            {(n.message || "").substring(0, 70)}
                                            {n.message && n.message.length > 70 ? '...' : ''}
                                        </span>

                                        <span style={timeStyle}>
                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                                        </span>

                                    </div>

                                    <button 
                                        style={replyBtnStyle} 
                                        onClick={() => setActiveReplyId(activeReplyId === n._id ? null : n._id)}
                                    >
                                        {activeReplyId === n._id ? "Close" : "Reply"}
                                    </button>
                                </div>

                                {activeReplyId === n._id && (
                                    <div style={replyBoxStyle}>
                                        <textarea 
                                            placeholder="Write your reply to admin..." 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            style={textareaStyle}
                                        />
                                        <button onClick={() => handleSendReply(n)} style={sendBtnStyle}>Send Reply</button>
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' };
const listItem = { padding: '15px', display: 'flex', alignItems: 'center', borderRadius: '8px' };
const timeStyle = { fontSize: '12px', color: '#888', fontWeight: '400' };
const replyBtnStyle = { marginLeft: '15px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' };
const replyBoxStyle = { padding: '15px', background: '#f8f9fa', borderRadius: '0 0 8px 8px', border: '1px solid #eee', borderTop: 'none' };
const textareaStyle = { width: '100%', height: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '10px' };
const sendBtnStyle = { background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' };

export default NotificationInbox;